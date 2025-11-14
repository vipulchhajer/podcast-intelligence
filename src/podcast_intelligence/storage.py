"""Storage utilities for managing episode data."""

import re
import json
from pathlib import Path
from datetime import datetime
from typing import Optional


def create_podcast_slug(podcast_title: str) -> str:
    """
    Create a filesystem-safe slug for a podcast.
    
    Args:
        podcast_title: Podcast name
    
    Returns:
        Filesystem-safe slug like "10-percent-happier"
    """
    clean_title = podcast_title.lower()
    clean_title = re.sub(r'[^\w\s-]', '', clean_title)  # Remove special chars
    clean_title = re.sub(r'[\s_]+', '-', clean_title)    # Replace spaces with hyphens
    clean_title = re.sub(r'-+', '-', clean_title)        # Collapse multiple hyphens
    clean_title = clean_title.strip('-')                 # Remove leading/trailing hyphens
    
    # Truncate to reasonable length (40 chars)
    clean_title = clean_title[:40].rstrip('-')
    
    # If empty, use generic name
    if not clean_title:
        clean_title = "podcast"
    
    return clean_title


def create_episode_slug(title: str, published: datetime, guid: str) -> str:
    """
    Create a filesystem-safe slug for an episode.
    
    Uses date + sanitized title to create a stable, readable folder name.
    Falls back to GUID hash if title is problematic.
    
    Args:
        title: Episode title
        published: Publication date
        guid: Episode GUID
    
    Returns:
        Filesystem-safe slug like "2025-11-10-overwhelmed-over-scheduled"
    """
    # Format date
    date_str = published.strftime("%Y-%m-%d")
    
    # Sanitize title
    # Remove/replace problematic characters
    clean_title = title.lower()
    clean_title = re.sub(r'[^\w\s-]', '', clean_title)  # Remove special chars
    clean_title = re.sub(r'[\s_]+', '-', clean_title)    # Replace spaces with hyphens
    clean_title = re.sub(r'-+', '-', clean_title)        # Collapse multiple hyphens
    clean_title = clean_title.strip('-')                 # Remove leading/trailing hyphens
    
    # Truncate to reasonable length (50 chars)
    clean_title = clean_title[:50].rstrip('-')
    
    # If title is empty after sanitization, use hash of GUID
    if not clean_title:
        guid_hash = abs(hash(guid)) % (10 ** 8)
        clean_title = f"episode-{guid_hash}"
    
    return f"{date_str}-{clean_title}"


def find_existing_episode(base_dir: Path, podcast_slug: str, guid: str) -> Optional[Path]:
    """
    Check if an episode with this GUID already exists.
    
    Searches podcast folder for matching GUID in metadata.json files.
    
    Args:
        base_dir: Base episodes directory (e.g., output/episodes)
        podcast_slug: Podcast slug (e.g., "10-percent-happier")
        guid: Episode GUID to search for
    
    Returns:
        Path to existing episode folder, or None if not found
    """
    podcast_dir = base_dir / podcast_slug
    
    if not podcast_dir.exists():
        return None
    
    # Search all episode subdirectories for metadata.json files
    for episode_dir in podcast_dir.iterdir():
        if not episode_dir.is_dir():
            continue
        
        metadata_path = episode_dir / "metadata.json"
        if not metadata_path.exists():
            continue
        
        try:
            metadata = json.loads(metadata_path.read_text())
            if metadata.get("guid") == guid:
                return episode_dir
        except (json.JSONDecodeError, OSError):
            continue
    
    return None


def get_episode_directory(
    base_dir: Path,
    podcast_title: str,
    episode_title: str, 
    published: datetime, 
    guid: str,
    check_existing: bool = True
) -> tuple[Path, bool]:
    """
    Get the directory path for an episode, organized by podcast.
    
    Creates structure: base_dir/podcast-slug/episode-slug/
    
    Args:
        base_dir: Base episodes directory
        podcast_title: Podcast name
        episode_title: Episode title
        published: Publication date
        guid: Episode GUID
        check_existing: Whether to check for existing episode with same GUID
    
    Returns:
        Tuple of (episode_path, already_exists)
    """
    # Create podcast slug
    podcast_slug = create_podcast_slug(podcast_title)
    
    # First check if episode already exists
    if check_existing:
        existing_dir = find_existing_episode(base_dir, podcast_slug, guid)
        if existing_dir:
            return existing_dir, True
    
    # Create new directory with slug
    episode_slug = create_episode_slug(episode_title, published, guid)
    episode_dir = base_dir / podcast_slug / episode_slug
    
    return episode_dir, False

