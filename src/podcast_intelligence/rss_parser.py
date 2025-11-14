"""RSS feed parsing for podcast episodes."""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional

import feedparser


@dataclass
class PodcastEpisode:
    """Represents a single podcast episode."""
    
    title: str
    audio_url: str
    published: datetime
    guid: str
    description: str = ""
    duration: Optional[int] = None  # seconds
    file_size: Optional[int] = None  # bytes
    
    @property
    def duration_formatted(self) -> str:
        """Return duration as HH:MM:SS."""
        if not self.duration:
            return "Unknown"
        hours = self.duration // 3600
        minutes = (self.duration % 3600) // 60
        seconds = self.duration % 60
        if hours > 0:
            return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        return f"{minutes:02d}:{seconds:02d}"
    
    @property
    def file_size_mb(self) -> str:
        """Return file size in MB."""
        if not self.file_size:
            return "Unknown"
        return f"{self.file_size / (1024 * 1024):.1f} MB"


@dataclass
class PodcastInfo:
    """Represents podcast feed metadata."""
    
    title: str
    description: str
    author: str
    link: str
    language: str = "en"
    image_url: Optional[str] = None


class RSSParser:
    """Parse podcast RSS feeds."""
    
    @staticmethod
    def parse_feed(feed_url: str) -> tuple[PodcastInfo, list[PodcastEpisode]]:
        """
        Parse RSS feed and extract podcast info and episodes.
        
        Args:
            feed_url: URL to the podcast RSS feed
        
        Returns:
            Tuple of (PodcastInfo, list of PodcastEpisode)
        
        Raises:
            ValueError: If feed cannot be parsed or is invalid
        """
        print(f"📡 Fetching RSS feed: {feed_url}")
        
        feed = feedparser.parse(feed_url)
        
        if feed.bozo:
            raise ValueError(f"Invalid RSS feed: {feed.bozo_exception}")
        
        if not feed.entries:
            raise ValueError("No episodes found in feed")
        
        # Extract podcast info
        podcast_info = PodcastInfo(
            title=feed.feed.get("title", "Unknown Podcast"),
            description=feed.feed.get("description", ""),
            author=feed.feed.get("author", "Unknown"),
            link=feed.feed.get("link", feed_url),
            language=feed.feed.get("language", "en"),
            image_url=feed.feed.get("image", {}).get("href")
        )
        
        # Extract episodes
        episodes = []
        for entry in feed.entries:
            # Find audio enclosure
            audio_url = None
            file_size = None
            
            for enclosure in entry.get("enclosures", []):
                if enclosure.get("type", "").startswith("audio/"):
                    audio_url = enclosure.get("url") or enclosure.get("href")
                    file_size = int(enclosure.get("length", 0)) or None
                    break
            
            if not audio_url:
                continue  # Skip entries without audio
            
            # Parse published date
            published_tuple = entry.get("published_parsed")
            published = datetime(*published_tuple[:6]) if published_tuple else datetime.now()
            
            # Get duration (in seconds)
            duration = None
            itunes_duration = entry.get("itunes_duration")
            if itunes_duration:
                try:
                    # Could be "3819" or "01:03:39"
                    if ":" in str(itunes_duration):
                        parts = str(itunes_duration).split(":")
                        if len(parts) == 3:
                            duration = int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
                        elif len(parts) == 2:
                            duration = int(parts[0]) * 60 + int(parts[1])
                    else:
                        duration = int(itunes_duration)
                except (ValueError, TypeError):
                    pass
            
            episode = PodcastEpisode(
                title=entry.get("title", "Untitled"),
                audio_url=audio_url,
                published=published,
                guid=entry.get("id", audio_url),
                description=entry.get("summary", ""),
                duration=duration,
                file_size=file_size
            )
            
            episodes.append(episode)
        
        print(f"✓ Found {len(episodes)} episodes in '{podcast_info.title}'")
        
        return podcast_info, episodes
    
    @staticmethod
    def get_latest_episode(feed_url: str) -> tuple[PodcastInfo, PodcastEpisode]:
        """
        Get the latest episode from a feed.
        
        Args:
            feed_url: URL to the podcast RSS feed
        
        Returns:
            Tuple of (PodcastInfo, latest PodcastEpisode)
        """
        podcast_info, episodes = RSSParser.parse_feed(feed_url)
        
        if not episodes:
            raise ValueError("No episodes found")
        
        # Episodes should already be sorted by date (most recent first)
        latest = episodes[0]
        
        return podcast_info, latest

