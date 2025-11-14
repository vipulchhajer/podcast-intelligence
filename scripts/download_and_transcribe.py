#!/usr/bin/env python3
"""Download and transcribe a podcast episode from RSS feed."""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from podcast_intelligence.rss_parser import RSSParser
from podcast_intelligence.downloader import AudioDownloader
from podcast_intelligence.transcriber import Transcriber
from podcast_intelligence.summarizer import PodcastSummarizer
from podcast_intelligence.storage import get_episode_directory
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

console = Console()


def main():
    """Download and transcribe latest episode from RSS feed."""
    
    if len(sys.argv) < 2:
        console.print("[red]Usage: python download_and_transcribe.py <rss_feed_url> [episode_number][/red]")
        console.print("\nExamples:")
        console.print("  # Download and transcribe latest episode")
        console.print("  python scripts/download_and_transcribe.py https://feeds.example.com/podcast.rss")
        console.print("\n  # Download and transcribe specific episode (0 = latest)")
        console.print("  python scripts/download_and_transcribe.py https://feeds.example.com/podcast.rss 0")
        sys.exit(1)
    
    feed_url = sys.argv[1]
    episode_index = int(sys.argv[2]) if len(sys.argv) > 2 else 0
    
    console.print(Panel.fit(
        f"🎙️ Podcast Intelligence - Step 2\n\n"
        f"RSS Feed: {feed_url}\n"
        f"Episode: #{episode_index} (0 = latest)",
        title="Download & Transcribe",
        border_style="blue"
    ))
    
    try:
        # Parse RSS feed
        console.print("\n[bold blue]Step 1: Parsing RSS Feed[/bold blue]")
        podcast_info, episodes = RSSParser.parse_feed(feed_url)
        
        # Show podcast info
        table = Table(show_header=False)
        table.add_row("Podcast", f"[bold]{podcast_info.title}[/bold]")
        table.add_row("Author", podcast_info.author)
        table.add_row("Episodes", str(len(episodes)))
        console.print(table)
        
        # Select episode
        if episode_index >= len(episodes):
            console.print(f"[red]Error: Episode {episode_index} not found (only {len(episodes)} episodes available)[/red]")
            sys.exit(1)
        
        episode = episodes[episode_index]
        
        console.print(f"\n[bold green]Selected Episode:[/bold green]")
        console.print(f"  Title: {episode.title}")
        console.print(f"  Published: {episode.published.strftime('%Y-%m-%d')}")
        console.print(f"  Duration: {episode.duration_formatted}")
        console.print(f"  Size: {episode.file_size_mb}")
        
        # Get episode directory (organized by podcast)
        base_dir = Path("output") / "episodes"
        output_dir, already_exists = get_episode_directory(
            base_dir,
            podcast_info.title,
            episode.title,
            episode.published,
            episode.guid
        )
        
        if already_exists:
            console.print(f"\n[yellow]⚠ Episode already processed![/yellow]")
            console.print(f"[yellow]  Location: {output_dir}[/yellow]")
            console.print(f"[yellow]  Delete this folder to re-process the episode.[/yellow]")
            
            # Show what's already there
            audio_path = output_dir / "audio.mp3"
            text_path = output_dir / "transcript.txt"
            json_path = output_dir / "transcript.json"
            summary_path = output_dir / "summary.txt"
            
            console.print(f"\n[bold cyan]Existing files:[/bold cyan]")
            if audio_path.exists():
                console.print(f"  ✓ Audio: {audio_path}")
            if text_path.exists():
                console.print(f"  ✓ Transcript: {text_path}")
            if json_path.exists():
                console.print(f"  ✓ JSON: {json_path}")
            if summary_path.exists():
                console.print(f"  ✓ Summary: {summary_path}")
            
            sys.exit(0)
        
        # Create new directory
        output_dir.mkdir(parents=True, exist_ok=True)
        console.print(f"\n[dim]📁 Output directory: {output_dir}[/dim]")
        
        # Download audio
        console.print(f"\n[bold blue]Step 2: Downloading Audio[/bold blue]")
        audio_path = output_dir / "audio.mp3"
        
        downloader = AudioDownloader()
        audio_path = downloader.download(episode.audio_url, audio_path)
        
        # Transcribe
        console.print(f"\n[bold blue]Step 3: Transcribing[/bold blue]")
        console.print("[dim]This will take a few minutes...[/dim]")
        
        transcriber = Transcriber(model_name="mlx-community/whisper-large-v3-turbo")
        result = transcriber.transcribe(audio_path, language="en", word_timestamps=True)
        
        # Save transcript
        text_path, json_path = transcriber.save_transcript(result, output_dir)
        
        # Save episode metadata
        import json
        metadata = {
            "podcast": podcast_info.title,
            "episode_title": episode.title,
            "published": episode.published.isoformat(),
            "duration": episode.duration,
            "audio_url": episode.audio_url,
            "guid": episode.guid,
            "author": podcast_info.author,
        }
        metadata_path = output_dir / "metadata.json"
        metadata_path.write_text(json.dumps(metadata, indent=2))
        console.print(f"💾 Saved metadata: {metadata_path}")
        
        # Summarize
        console.print(f"\n[bold blue]Step 4: Generating Summary[/bold blue]")
        console.print("[dim]Using Ollama to analyze transcript...[/dim]")
        
        summarizer = PodcastSummarizer()
        summary = summarizer.summarize(
            transcript_text=result["text"],
            podcast_name=podcast_info.title,
            episode_title=episode.title,
            host=podcast_info.author,
            published_date=episode.published.strftime('%Y-%m-%d')
        )
        
        # Save summary
        summarizer.save_summary(summary, output_dir)
        
        # Display summary
        console.print("\n" + "="*60)
        console.print("[bold cyan]SUMMARY GENERATED[/bold cyan]")
        console.print("="*60)
        summarizer.display_summary(summary)
        
        # Display transcript preview
        console.print("\n" + "="*60)
        
        word_count = len(result["text"].split())
        preview_text = result["text"][:500]
        if len(result["text"]) > 500:
            preview_text += "..."
        
        console.print(Panel(
            preview_text,
            title=f"📝 Transcript Preview ({word_count:,} words)",
            border_style="green"
        ))
        
        console.print("\n[bold green]✓ Complete![/bold green]")
        console.print(f"  📁 Episode Directory: {output_dir}")
        console.print(f"  🎵 Audio: {audio_path}")
        console.print(f"  📝 Transcript: {text_path}")
        console.print(f"  📊 JSON: {json_path}")
        console.print(f"  🤖 Summary: {output_dir / 'summary.txt'}")
        console.print(f"  ℹ️  Metadata: {metadata_path}")
        
    except Exception as e:
        console.print(f"\n[red]✗ Error: {e}[/red]")
        import traceback
        console.print(traceback.format_exc())
        sys.exit(1)


if __name__ == "__main__":
    main()

