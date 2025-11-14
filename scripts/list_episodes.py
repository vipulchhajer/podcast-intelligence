#!/usr/bin/env python3
"""List all episodes from a podcast RSS feed."""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from podcast_intelligence.rss_parser import RSSParser
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

console = Console()


def main():
    """List episodes from RSS feed."""
    
    if len(sys.argv) < 2:
        console.print("[red]Usage: python list_episodes.py <rss_feed_url> [--limit N][/red]")
        console.print("\nExamples:")
        console.print("  # List all episodes")
        console.print("  python scripts/list_episodes.py https://feeds.libsyn.com/570160/rss")
        console.print("\n  # List only first 20 episodes")
        console.print("  python scripts/list_episodes.py https://feeds.libsyn.com/570160/rss --limit 20")
        sys.exit(1)
    
    feed_url = sys.argv[1]
    
    # Check for limit flag
    limit = None
    if "--limit" in sys.argv:
        try:
            limit_idx = sys.argv.index("--limit")
            limit = int(sys.argv[limit_idx + 1])
        except (IndexError, ValueError):
            console.print("[red]Error: --limit requires a number[/red]")
            sys.exit(1)
    
    try:
        # Parse feed
        console.print(f"\n📡 Fetching RSS feed...\n")
        podcast_info, episodes = RSSParser.parse_feed(feed_url)
        
        # Show podcast info
        console.print(Panel.fit(
            f"[bold]{podcast_info.title}[/bold]\n"
            f"By: {podcast_info.author}\n"
            f"Total Episodes: {len(episodes)}",
            title="🎙️ Podcast Info",
            border_style="blue"
        ))
        
        # Limit episodes if requested
        display_episodes = episodes[:limit] if limit else episodes
        
        if limit and limit < len(episodes):
            console.print(f"\n[yellow]Showing {limit} of {len(episodes)} episodes[/yellow]\n")
        
        # Create table
        table = Table(show_header=True, header_style="bold cyan")
        table.add_column("#", style="dim", width=6, justify="right")
        table.add_column("Title", style="white", no_wrap=False)
        table.add_column("Date", style="green", width=12)
        table.add_column("Duration", style="yellow", width=10, justify="right")
        table.add_column("Size", style="magenta", width=10, justify="right")
        
        # Add episodes to table
        for idx, episode in enumerate(display_episodes):
            # Truncate long titles
            title = episode.title
            if len(title) > 80:
                title = title[:77] + "..."
            
            table.add_row(
                str(idx),
                title,
                episode.published.strftime("%Y-%m-%d"),
                episode.duration_formatted,
                episode.file_size_mb
            )
        
        console.print("\n")
        console.print(table)
        
        # Show usage instructions
        console.print("\n[bold cyan]To transcribe an episode:[/bold cyan]")
        console.print(f"  python scripts/download_and_transcribe.py \"{feed_url}\" [episode_number]")
        console.print("\n[bold cyan]Examples:[/bold cyan]")
        console.print("  # Transcribe latest episode (Diana Hill)")
        console.print(f"  python scripts/download_and_transcribe.py \"{feed_url}\" 0")
        console.print("\n  # Transcribe episode #5")
        console.print(f"  python scripts/download_and_transcribe.py \"{feed_url}\" 5")
        
    except Exception as e:
        console.print(f"\n[red]✗ Error: {e}[/red]")
        import traceback
        console.print(traceback.format_exc())
        sys.exit(1)


if __name__ == "__main__":
    main()

