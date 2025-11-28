"""Main FastAPI application."""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from contextlib import asynccontextmanager
from pathlib import Path
from datetime import datetime
import json
import sys

# Add parent directory to path to import from src
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from config import settings
from database import init_db, get_db
from models import User, Podcast, Episode
from services.groq_service import groq_service
from podcast_intelligence.rss_parser import RSSParser
from podcast_intelligence.downloader import AudioDownloader


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for the application."""
    # Startup
    await init_db()
    
    # Create mock user for demo (TODO: add proper authentication)
    from database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        from sqlalchemy import select
        result = await db.execute(select(User).where(User.id == 1))
        mock_user = result.scalar_one_or_none()
        if not mock_user:
            mock_user = User(
                id=1,
                email="demo@example.com",
                username="demo",
                hashed_password="demo"  # Not used for now
            )
            db.add(mock_user)
            await db.commit()
            print("✓ Created mock user for demo")
    
    print("✓ Database initialized")
    yield
    # Shutdown
    print("Shutting down...")


app = FastAPI(
    title="Podcast Intelligence API",
    description="AI-powered podcast transcription and summarization",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic schemas
from pydantic import BaseModel, HttpUrl


class PodcastCreate(BaseModel):
    """Schema for creating a podcast."""
    rss_url: HttpUrl


class EpisodeProcess(BaseModel):
    """Schema for processing an episode."""
    episode_guid: str


class EpisodeResponse(BaseModel):
    """Schema for episode response."""
    id: int
    title: str
    description: str | None
    published: datetime | None
    duration: int | None
    status: str
    podcast_title: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# Routes

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Podcast Intelligence API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


# Podcast routes

@app.post("/api/podcasts")
async def add_podcast(
    podcast_data: PodcastCreate,
    db: AsyncSession = Depends(get_db)
):
    """Add a new podcast feed."""
    try:
        # Parse RSS feed to get podcast info
        podcast_info, episodes = RSSParser.parse_feed(str(podcast_data.rss_url))
        
        # Check if podcast already exists
        result = await db.execute(
            select(Podcast).where(Podcast.rss_url == str(podcast_data.rss_url))
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            return {
                "message": "Podcast already exists",
                "podcast": {
                    "id": existing.id,
                    "title": existing.title,
                    "slug": existing.slug
                }
            }
        
        # Create podcast slug
        from podcast_intelligence.storage import create_podcast_slug
        slug = create_podcast_slug(podcast_info.title)
        
        # Create new podcast
        new_podcast = Podcast(
            title=podcast_info.title,
            rss_url=str(podcast_data.rss_url),
            author=podcast_info.author,
            description=podcast_info.description,
            slug=slug
        )
        
        db.add(new_podcast)
        await db.commit()
        await db.refresh(new_podcast)
        
        return {
            "message": "Podcast added successfully",
            "podcast": {
                "id": new_podcast.id,
                "title": new_podcast.title,
                "slug": new_podcast.slug,
                "episode_count": len(episodes)
            }
        }
    
    except Exception as e:
        import traceback
        print(f"❌ Error adding podcast: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=400, detail=f"Failed to add podcast: {str(e)}")


@app.get("/api/podcasts")
async def list_podcasts(db: AsyncSession = Depends(get_db)):
    """List all podcasts."""
    result = await db.execute(select(Podcast))
    podcasts = result.scalars().all()
    
    return {
        "podcasts": [
            {
                "id": p.id,
                "title": p.title,
                "slug": p.slug,
                "rss_url": p.rss_url,
                "created_at": p.created_at
            }
            for p in podcasts
        ]
    }


@app.get("/api/podcasts/{podcast_id}/episodes")
async def list_podcast_episodes(
    podcast_id: int,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """List episodes from a podcast feed."""
    # Get podcast
    result = await db.execute(
        select(Podcast).where(Podcast.id == podcast_id)
    )
    podcast = result.scalar_one_or_none()
    
    if not podcast:
        raise HTTPException(status_code=404, detail="Podcast not found")
    
    # Parse RSS feed
    try:
        podcast_info, episodes = RSSParser.parse_feed(podcast.rss_url)
        
        # Check which episodes are already processed
        result = await db.execute(
            select(Episode).where(Episode.podcast_id == podcast_id)
        )
        processed_episodes = {ep.guid: ep for ep in result.scalars().all()}
        
        # Return episode list with status
        episode_list = []
        for ep in episodes[:limit]:
            processed = processed_episodes.get(ep.guid)
            episode_list.append({
                "guid": ep.guid,
                "title": ep.title,
                "description": ep.description,
                "audio_url": ep.audio_url,
                "published": ep.published.isoformat() if ep.published else None,
                "duration": ep.duration,
                "duration_formatted": ep.duration_formatted,
                "status": processed.status if processed else "new",
                "id": processed.id if processed else None
            })
        
        return {
            "podcast": {
                "id": podcast.id,
                "title": podcast.title
            },
            "episodes": episode_list
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch episodes: {str(e)}")


# Episode processing routes

@app.post("/api/podcasts/{podcast_id}/episodes/process")
async def process_episode(
    podcast_id: int,
    episode_data: EpisodeProcess,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Start processing an episode (download, transcribe, summarize)."""
    # Get podcast
    result = await db.execute(
        select(Podcast).where(Podcast.id == podcast_id)
    )
    podcast = result.scalar_one_or_none()
    
    if not podcast:
        raise HTTPException(status_code=404, detail="Podcast not found")
    
    # Parse RSS to find episode
    podcast_info, episodes = RSSParser.parse_feed(podcast.rss_url)
    episode_info = next((ep for ep in episodes if ep.guid == episode_data.episode_guid), None)
    
    if not episode_info:
        raise HTTPException(status_code=404, detail="Episode not found in feed")
    
    # Check if episode already exists
    result = await db.execute(
        select(Episode).where(Episode.guid == episode_data.episode_guid)
    )
    existing_episode = result.scalar_one_or_none()
    
    if existing_episode:
        if existing_episode.status == "completed":
            return {
                "message": "Episode already processed",
                "episode_id": existing_episode.id
            }
        elif existing_episode.status == "failed" or existing_episode.status == "pending":
            # Allow retry for failed or stuck pending episodes
            existing_episode.status = "pending"
            existing_episode.error_message = None
            await db.commit()
            
            # Start background processing for retry
            background_tasks.add_task(
                process_episode_background,
                existing_episode.id,
                podcast.slug,
                episode_info
            )
            
            return {
                "message": "Episode processing restarted",
                "episode_id": existing_episode.id,
                "status": "pending"
            }
        else:
            return {
                "message": f"Episode is already being processed (status: {existing_episode.status})",
                "episode_id": existing_episode.id
            }
    
    # Create episode record (for demo, using a mock user_id=1)
    # TODO: Replace with actual authenticated user
    new_episode = Episode(
        user_id=1,  # Mock user ID
        podcast_id=podcast.id,
        title=episode_info.title,
        description=episode_info.description,
        audio_url=episode_info.audio_url,
        guid=episode_info.guid,
        published=episode_info.published,
        duration=episode_info.duration,
        status="pending"
    )
    
    db.add(new_episode)
    await db.commit()
    await db.refresh(new_episode)
    
    # Start background processing
    background_tasks.add_task(
        process_episode_background,
        new_episode.id,
        podcast.slug,
        episode_info
    )
    
    return {
        "message": "Episode processing started",
        "episode_id": new_episode.id,
        "status": "pending"
    }


async def process_episode_background(episode_id: int, podcast_slug: str, episode_info):
    """Background task to process an episode."""
    print(f"🚀 Starting background task for episode {episode_id}")
    from database import AsyncSessionLocal
    
    async with AsyncSessionLocal() as db:
        try:
            print(f"📝 Fetching episode {episode_id} from database...")
            # Get episode
            result = await db.execute(
                select(Episode).where(Episode.id == episode_id)
            )
            episode = result.scalar_one()
            print(f"✓ Found episode: {episode.title}")
            
            # Update status: downloading
            episode.status = "downloading"
            await db.commit()
            
            # Create storage path
            storage_path = settings.storage_path / podcast_slug / str(episode_id)
            storage_path.mkdir(parents=True, exist_ok=True)
            
            # Download audio
            audio_path = storage_path / "audio.mp3"
            AudioDownloader.download(episode_info.audio_url, audio_path)
            episode.audio_path = str(audio_path.relative_to(settings.storage_path))
            await db.commit()
            
            # Update status: transcribing
            episode.status = "transcribing"
            await db.commit()
            
            # Check file size - Groq has ~25MB limit
            audio_size_mb = audio_path.stat().st_size / (1024 * 1024)
            
            # Step 1: Try compression with 64k bitrate (best quality)
            print(f"📊 Audio file is {audio_size_mb:.1f}MB")
            compressed_path = storage_path / "audio_compressed.mp3"
            
            import subprocess
            compress_cmd = [
                "ffmpeg", "-y", "-i", str(audio_path),
                "-b:a", "64k",      # 64kbps - best quality for speech
                "-ar", "16000",     # 16kHz sample rate (Whisper standard)
                "-ac", "1",         # Mono
                str(compressed_path)
            ]
            result = subprocess.run(compress_cmd, capture_output=True, text=True)
            if result.returncode != 0:
                raise Exception(f"Audio compression failed: {result.stderr}")
            
            compressed_size_mb = compressed_path.stat().st_size / (1024 * 1024)
            print(f"✓ Compressed to {compressed_size_mb:.1f}MB (64k bitrate)")
            
            # Step 2: Check if still too large, if so, use chunking
            if compressed_size_mb > 24:  # Leave 1MB buffer
                print(f"⚠️  Still too large ({compressed_size_mb:.1f}MB), splitting into chunks...")
                
                # Get audio duration
                duration_cmd = [
                    "ffprobe", "-v", "error", "-show_entries", "format=duration",
                    "-of", "default=noprint_wrappers=1:nokey=1", str(compressed_path)
                ]
                duration_result = subprocess.run(duration_cmd, capture_output=True, text=True)
                duration_seconds = float(duration_result.stdout.strip())
                duration_minutes = duration_seconds / 60
                
                # Calculate chunk size (aim for ~20MB per chunk)
                chunk_duration_minutes = int((24 / compressed_size_mb) * duration_minutes)
                print(f"📊 Episode duration: {duration_minutes:.1f} min, splitting into {chunk_duration_minutes}-min chunks")
                
                # Split into chunks
                chunks_dir = storage_path / "chunks"
                chunks_dir.mkdir(exist_ok=True)
                
                chunk_paths = []
                current_time = 0
                chunk_num = 0
                
                while current_time < duration_seconds:
                    chunk_path = chunks_dir / f"chunk_{chunk_num}.mp3"
                    chunk_cmd = [
                        "ffmpeg", "-y", "-i", str(compressed_path),
                        "-ss", str(current_time),
                        "-t", str(chunk_duration_minutes * 60),
                        "-c", "copy",  # Fast copy, no re-encoding
                        str(chunk_path)
                    ]
                    subprocess.run(chunk_cmd, capture_output=True, text=True)
                    
                    if chunk_path.exists():
                        chunk_paths.append(chunk_path)
                        chunk_num += 1
                    
                    current_time += chunk_duration_minutes * 60
                
                print(f"✓ Split into {len(chunk_paths)} chunks")
                
                # Transcribe each chunk
                all_transcripts = []
                for idx, chunk_path in enumerate(chunk_paths):
                    chunk_size = chunk_path.stat().st_size / (1024 * 1024)
                    
                    # Update status to show progress
                    episode.status = f"transcribing ({idx + 1}/{len(chunk_paths)})"
                    await db.commit()
                    
                    print(f"🎤 Transcribing chunk {idx + 1}/{len(chunk_paths)} ({chunk_size:.1f}MB)...")
                    
                    chunk_result = await groq_service.transcribe_audio(chunk_path)
                    all_transcripts.append(chunk_result["text"])
                
                # Combine transcripts
                transcript_text = " ".join(all_transcripts)
                print(f"✓ Combined {len(chunk_paths)} transcripts ({len(transcript_text.split())} words)")
                
                # Clean up chunks
                import shutil
                shutil.rmtree(chunks_dir)
                
            else:
                # File is small enough, transcribe normally
                print(f"✓ File size OK ({compressed_size_mb:.1f}MB), transcribing...")
                transcript_result = await groq_service.transcribe_audio(compressed_path)
                transcript_text = transcript_result["text"]
            episode.transcript_text = transcript_text
            
            # Save transcript
            transcript_path = storage_path / "transcript.txt"
            transcript_path.write_text(transcript_text)
            episode.transcript_path = str(transcript_path.relative_to(settings.storage_path))
            await db.commit()
            
            # Update status: summarizing
            episode.status = "summarizing"
            await db.commit()
            
            # Summarize
            result_podcast = await db.execute(
                select(Podcast).where(Podcast.id == episode.podcast_id)
            )
            podcast = result_podcast.scalar_one()
            
            summary_data = await groq_service.summarize_transcript(
                transcript_text,
                podcast_name=podcast.title,
                episode_title=episode.title,
                host=podcast.author,
                published_date=episode.published.strftime("%Y-%m-%d") if episode.published else None
            )
            
            # Save summary
            summary_path = storage_path / "summary.json"
            summary_path.write_text(json.dumps(summary_data, indent=2))
            episode.summary_path = str(summary_path.relative_to(settings.storage_path))
            episode.summary_json = json.dumps(summary_data)
            
            # Update status: completed
            episode.status = "completed"
            episode.completed_at = datetime.utcnow()
            await db.commit()
            
            print(f"✓ Episode {episode_id} processed successfully")
        
        except Exception as e:
            # Update status: failed with error message
            episode.status = "failed"
            episode.error_message = str(e)
            await db.commit()
            print(f"✗ Episode {episode_id} processing failed: {str(e)}")
            
            # Print full traceback for debugging
            import traceback
            print(traceback.format_exc())


@app.get("/api/episodes/{episode_id}")
async def get_episode(
    episode_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get episode details."""
    result = await db.execute(
        select(Episode).where(Episode.id == episode_id)
    )
    episode = result.scalar_one_or_none()
    
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    
    # Get podcast info
    result = await db.execute(
        select(Podcast).where(Podcast.id == episode.podcast_id)
    )
    podcast = result.scalar_one()
    
    # Parse summary if available
    summary_data = None
    if episode.summary_json:
        summary_data = json.loads(episode.summary_json)
    
    return {
        "id": episode.id,
        "title": episode.title,
        "description": episode.description,
        "published": episode.published.isoformat() if episode.published else None,
        "duration": episode.duration,
        "status": episode.status,
        "error_message": episode.error_message,
        "podcast": {
            "id": podcast.id,
            "title": podcast.title,
            "slug": podcast.slug
        },
        "transcript": episode.transcript_text,
        "summary": summary_data,
        "created_at": episode.created_at.isoformat(),
        "completed_at": episode.completed_at.isoformat() if episode.completed_at else None
    }


@app.get("/api/episodes")
async def list_episodes(
    limit: int = 20,
    status: str | None = None,
    db: AsyncSession = Depends(get_db)
):
    """List all episodes."""
    query = select(Episode).order_by(Episode.created_at.desc()).limit(limit)
    
    if status:
        query = query.where(Episode.status == status)
    
    result = await db.execute(query)
    episodes = result.scalars().all()
    
    # Get podcast info for each episode
    episode_list = []
    for ep in episodes:
        result = await db.execute(
            select(Podcast).where(Podcast.id == ep.podcast_id)
        )
        podcast = result.scalar_one()
        
        episode_list.append({
            "id": ep.id,
            "guid": ep.guid,
            "podcast_id": ep.podcast_id,
            "title": ep.title,
            "published": ep.published.isoformat() if ep.published else None,
            "status": ep.status,
            "error_message": ep.error_message,
            "podcast_title": podcast.title,
            "created_at": ep.created_at.isoformat()
        })
        
        # Debug: log episode status
        if ep.id == 1:
            print(f"🔍 Episode 1 status in API response: {ep.status}")
    
    return {"episodes": episode_list}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

