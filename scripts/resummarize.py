#!/usr/bin/env python3
"""Re-summarize an existing episode with updated prompts."""

import sys
import json
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from podcast_intelligence.summarizer import PodcastSummarizer
from rich.console import Console
from rich.panel import Panel

console = Console()


def main():
    """Re-summarize an existing episode."""
    
    if len(sys.argv) < 2:
        console.print("[red]Usage: python resummarize.py <episode_directory>[/red]")
        console.print("\nExample:")
        console.print("  python scripts/resummarize.py output/episodes/10-happier-with-dan-harris/2025-10-22-how-to-perform-under-pressurewith-both-peace-and-c")
        sys.exit(1)
    
    episode_dir = Path(sys.argv[1])
    
    if not episode_dir.exists():
        console.print(f"[red]Error: Directory not found: {episode_dir}[/red]")
        sys.exit(1)
    
    console.print(Panel.fit(
        f"🔄 Re-Summarizing Episode\n\n"
        f"Directory: {episode_dir}",
        title="Re-Summarize",
        border_style="blue"
    ))
    
    try:
        # Load existing transcript
        transcript_path = episode_dir / "transcript.txt"
        if not transcript_path.exists():
            console.print(f"[red]Error: transcript.txt not found in {episode_dir}[/red]")
            sys.exit(1)
        
        console.print(f"\n[bold blue]Loading existing transcript...[/bold blue]")
        transcript_text = transcript_path.read_text()
        word_count = len(transcript_text.split())
        console.print(f"✓ Loaded transcript ({word_count:,} words)")
        
        # Load metadata
        metadata_path = episode_dir / "metadata.json"
        metadata = {}
        if metadata_path.exists():
            metadata = json.loads(metadata_path.read_text())
            console.print(f"✓ Loaded metadata")
        
        # Re-summarize
        console.print(f"\n[bold blue]Re-generating Summary with Improved Prompts...[/bold blue]")
        console.print("[dim]Using Ollama to analyze transcript...[/dim]")
        
        summarizer = PodcastSummarizer()
        summary = summarizer.summarize(
            transcript_text=transcript_text,
            podcast_name=metadata.get("podcast"),
            episode_title=metadata.get("episode_title"),
            host=metadata.get("author"),
            published_date=metadata.get("published", "").split("T")[0] if metadata.get("published") else None
        )
        
        # Save summary (overwrites old one)
        summarizer.save_summary(summary, episode_dir)
        
        # Display summary
        console.print("\n" + "="*60)
        console.print("[bold cyan]NEW SUMMARY GENERATED[/bold cyan]")
        console.print("="*60)
        summarizer.display_summary(summary)
        
        console.print("\n[bold green]✓ Re-summarization Complete![/bold green]")
        console.print(f"  📁 Episode Directory: {episode_dir}")
        console.print(f"  🤖 Updated Summary: {episode_dir / 'summary.txt'}")
        
    except Exception as e:
        console.print(f"\n[red]✗ Error: {e}[/red]")
        import traceback
        console.print(traceback.format_exc())
        sys.exit(1)


if __name__ == "__main__":
    main()

