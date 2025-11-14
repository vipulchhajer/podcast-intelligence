"""Audio transcription using Whisper-MLX optimized for Apple Silicon."""

import json
import subprocess
from pathlib import Path
from typing import Optional

import mlx_whisper


class Transcriber:
    """Handles audio transcription using Whisper-MLX."""
    
    def __init__(self, model_name: str = "mlx-community/whisper-large-v3-turbo"):
        """
        Initialize transcriber with specified model.
        
        Args:
            model_name: Whisper model to use. Options:
                - mlx-community/whisper-large-v3-turbo (fastest, recommended)
                - mlx-community/whisper-large-v3
                - mlx-community/whisper-medium
                - mlx-community/whisper-small
        """
        self.model_name = model_name
        print(f"📝 Initializing Whisper model: {model_name}")
    
    def convert_to_wav(self, audio_path: Path, output_path: Optional[Path] = None) -> Path:
        """
        Convert audio to 16kHz mono WAV format required by Whisper.
        
        Args:
            audio_path: Path to input audio file
            output_path: Optional output path. If None, creates temp file.
        
        Returns:
            Path to converted WAV file
        """
        if output_path is None:
            output_path = audio_path.parent / f"{audio_path.stem}.16k.wav"
        
        print(f"🔄 Converting audio to 16kHz WAV format...")
        
        cmd = [
            "ffmpeg",
            "-y",  # Overwrite output file
            "-i", str(audio_path),
            "-ac", "1",  # Mono
            "-ar", "16000",  # 16kHz sample rate
            "-acodec", "pcm_s16le",  # 16-bit PCM
            str(output_path)
        ]
        
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        if result.returncode != 0:
            raise RuntimeError(f"FFmpeg conversion failed: {result.stderr}")
        
        print(f"✓ Converted to: {output_path}")
        return output_path
    
    def transcribe(
        self,
        audio_path: Path,
        language: str = "en",
        word_timestamps: bool = True
    ) -> dict:
        """
        Transcribe audio file.
        
        Args:
            audio_path: Path to audio file (will be converted if needed)
            language: Language code (e.g., 'en', 'es', 'fr')
            word_timestamps: Include word-level timestamps
        
        Returns:
            Dictionary containing:
                - text: Full transcript
                - segments: List of segments with timestamps
                - language: Detected/specified language
        """
        audio_path = Path(audio_path)
        
        if not audio_path.exists():
            raise FileNotFoundError(f"Audio file not found: {audio_path}")
        
        # Convert to WAV if needed
        if audio_path.suffix.lower() not in ['.wav']:
            wav_path = self.convert_to_wav(audio_path)
        else:
            wav_path = audio_path
        
        print(f"🎤 Transcribing with {self.model_name}...")
        print(f"   Language: {language}")
        print(f"   Word timestamps: {word_timestamps}")
        
        # Transcribe using MLX Whisper
        result = mlx_whisper.transcribe(
            str(wav_path),
            path_or_hf_repo=self.model_name,
            language=language,
            word_timestamps=word_timestamps,
        )
        
        # Calculate word count
        word_count = len(result["text"].split())
        
        print(f"✓ Transcription complete!")
        print(f"   Words: {word_count:,}")
        print(f"   Segments: {len(result.get('segments', []))}")
        
        return result
    
    def save_transcript(
        self,
        result: dict,
        output_dir: Path,
        include_json: bool = True
    ) -> tuple[Path, Optional[Path]]:
        """
        Save transcript to files.
        
        Args:
            result: Transcription result from transcribe()
            output_dir: Directory to save files
            include_json: Whether to save detailed JSON with timestamps
        
        Returns:
            Tuple of (text_path, json_path)
        """
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Save plain text
        text_path = output_dir / "transcript.txt"
        text_path.write_text(result["text"], encoding="utf-8")
        print(f"💾 Saved transcript: {text_path}")
        
        # Save detailed JSON with timestamps
        json_path = None
        if include_json:
            json_path = output_dir / "transcript.json"
            json_path.write_text(
                json.dumps(result, indent=2, ensure_ascii=False),
                encoding="utf-8"
            )
            print(f"💾 Saved detailed JSON: {json_path}")
        
        return text_path, json_path


def transcribe_file(
    audio_path: str,
    output_dir: str,
    model: str = "mlx-community/whisper-large-v3-turbo",
    language: str = "en"
) -> dict:
    """
    Convenience function to transcribe a single file.
    
    Args:
        audio_path: Path to audio file
        output_dir: Where to save transcripts
        model: Whisper model name
        language: Language code
    
    Returns:
        Transcription result dictionary
    """
    transcriber = Transcriber(model_name=model)
    result = transcriber.transcribe(Path(audio_path), language=language)
    transcriber.save_transcript(result, Path(output_dir))
    return result



