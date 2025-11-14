#!/usr/bin/env python3
"""Test script for audio transcription."""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from podcast_intelligence.transcriber import Transcriber
from rich.console import Console
from rich.panel import Panel
from rich.syntax import Syntax

console = Console()


def main():
    """Test transcription with a sample audio file."""
    
    if len(sys.argv) < 2:
        console.print("[red]Usage: python test_transcription.py <audio_file> [output_dir][/red]")
        console.print("\nExample:")
        console.print("  python scripts/test_transcription.py test_audio.mp3 output/")
        sys.exit(1)
    
    audio_path = Path(sys.argv[1])
    output_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("output/test")
    
    if not audio_path.exists():
        console.print(f"[red]Error: Audio file not found: {audio_path}[/red]")
        sys.exit(1)
    
    console.print(Panel.fit(
        f"🎤 Testing Whisper-MLX Transcription\n\n"
        f"Audio: {audio_path}\n"
        f"Output: {output_dir}",
        title="Podcast Intelligence - Step 1",
        border_style="blue"
    ))
    
    try:
        # Initialize transcriber
        transcriber = Transcriber(model_name="mlx-community/whisper-large-v3-turbo")
        
        # Transcribe
        result = transcriber.transcribe(audio_path, language="en", word_timestamps=True)
        
        # Save results
        text_path, json_path = transcriber.save_transcript(result, output_dir)
        
        # Display preview
        preview_text = result["text"][:500]
        if len(result["text"]) > 500:
            preview_text += "..."
        
        console.print("\n" + "="*60)
        console.print(Panel(
            preview_text,
            title="📝 Transcript Preview",
            border_style="green"
        ))
        
        console.print("\n[green]✓ Success![/green]")
        console.print(f"  Text: {text_path}")
        console.print(f"  JSON: {json_path}")
        
    except Exception as e:
        console.print(f"\n[red]✗ Error: {e}[/red]")
        import traceback
        console.print(traceback.format_exc())
        sys.exit(1)


if __name__ == "__main__":
    main()



