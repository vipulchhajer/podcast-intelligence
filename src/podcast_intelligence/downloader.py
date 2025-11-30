"""Download audio files from URLs."""

from pathlib import Path
from typing import Optional

import requests
from rich.progress import Progress, DownloadColumn, TransferSpeedColumn, TimeRemainingColumn


class AudioDownloader:
    """Download audio files with progress tracking."""
    
    @staticmethod
    def download(
        url: str,
        output_path: Path,
        timeout: int = 300
    ) -> Path:
        """
        Download audio file from URL.
        
        Args:
            url: URL to download from
            output_path: Where to save the file
            timeout: Download timeout in seconds
        
        Returns:
            Path to downloaded file
        
        Raises:
            httpx.HTTPError: If download fails
        """
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        print(f"⬇️  Downloading audio...")
        print(f"   URL: {url}")
        print(f"   Output: {output_path}")
        
        # Use simple headers with requests library (works better than httpx for Substack)
        headers = {
            "User-Agent": "podcast-app/1.0"
        }
        
        with Progress(
            *Progress.get_default_columns(),
            DownloadColumn(),
            TransferSpeedColumn(),
            TimeRemainingColumn(),
        ) as progress:
            
            with requests.get(url, headers=headers, timeout=timeout, allow_redirects=True, stream=True) as response:
                response.raise_for_status()
                
                total = int(response.headers.get("content-length", 0))
                
                task = progress.add_task("Downloading", total=total)
                
                with open(output_path, "wb") as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:  # filter out keep-alive chunks
                            f.write(chunk)
                            progress.update(task, advance=len(chunk))
        
        file_size = output_path.stat().st_size
        print(f"✓ Downloaded {file_size / (1024 * 1024):.1f} MB")
        
        return output_path
    
    @staticmethod
    def download_with_resume(
        url: str,
        output_path: Path,
        timeout: int = 300
    ) -> Path:
        """
        Download with resume capability (for interrupted downloads).
        
        Args:
            url: URL to download from
            output_path: Where to save the file
            timeout: Download timeout in seconds
        
        Returns:
            Path to downloaded file
        """
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Check if file exists and get current size
        existing_size = output_path.stat().st_size if output_path.exists() else 0
        
        # Use simple headers with requests library (works better than httpx for Substack)
        headers = {
            "User-Agent": "podcast-app/1.0"
        }
        if existing_size > 0:
            headers["Range"] = f"bytes={existing_size}-"
            print(f"📂 Resuming download from {existing_size / (1024 * 1024):.1f} MB")
        
        mode = "ab" if existing_size > 0 else "wb"
        
        with Progress(
            *Progress.get_default_columns(),
            DownloadColumn(),
            TransferSpeedColumn(),
            TimeRemainingColumn(),
        ) as progress:
            
            with requests.get(url, headers=headers, timeout=timeout, allow_redirects=True, stream=True) as response:
                response.raise_for_status()
                
                total = int(response.headers.get("content-length", 0))
                if existing_size > 0:
                    total += existing_size
                
                task = progress.add_task("Downloading", total=total, completed=existing_size)
                
                with open(output_path, mode) as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:  # filter out keep-alive chunks
                            f.write(chunk)
                            progress.update(task, advance=len(chunk))
        
        file_size = output_path.stat().st_size
        print(f"✓ Downloaded {file_size / (1024 * 1024):.1f} MB")
        
        return output_path

