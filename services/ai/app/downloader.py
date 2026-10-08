import os
import shutil
import tempfile
import logging
from typing import Optional, Tuple
import yt_dlp

logger = logging.getLogger("supersave.downloader")

class MediaDownloader:
    """Safely downloads video or audio from YouTube, Instagram, or supported platforms."""

    @staticmethod
    def download(url: str, mode: str = "video_lowres") -> Tuple[Optional[str], Optional[str]]:
        """
        Downloads media to a unique temporary directory.
        Returns:
            (filepath, temp_dir) or (None, None) if not a downloadable media url.
        """
        temp_dir = tempfile.mkdtemp(prefix="supersave_media_")

        # Select format based on mode
        if mode == "audio_fast":
            # Prefer lightweight audio stream
            format_str = "ba[ext=m4a]/ba/b"
            outtmpl = os.path.join(temp_dir, "audio.%(ext)s")
        else:
            # Video capped to max 480p to optimize download and Gemini upload speed
            format_str = "bestvideo[height<=480]+bestaudio/best[height<=480]/worst[ext=mp4]/worst"
            outtmpl = os.path.join(temp_dir, "video.%(ext)s")

        ydl_opts = {
            "format": format_str,
            "outtmpl": outtmpl,
            "quiet": True,
            "no_warnings": True,
            "noplaylist": True,
            "socket_timeout": 20,
            "max_filesize": 50 * 1024 * 1024,  # Cap at 50MB max to prevent huge files
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                if not info:
                    shutil.rmtree(temp_dir, ignore_errors=True)
                    return None, None

                # Find the downloaded file in temp_dir
                files = os.listdir(temp_dir)
                if not files:
                    shutil.rmtree(temp_dir, ignore_errors=True)
                    return None, None

                filepath = os.path.join(temp_dir, files[0])
                logger.info(f"Downloaded media: {filepath} ({os.path.getsize(filepath)} bytes)")
                return filepath, temp_dir
        except Exception as e:
            logger.warning(f"Could not download media from {url}: {e}")
            shutil.rmtree(temp_dir, ignore_errors=True)
            return None, None

    @staticmethod
    def cleanup(temp_dir: Optional[str]):
        """Safely removes the temporary directory."""
        if temp_dir and os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir, ignore_errors=True)
            except Exception as e:
                logger.error(f"Error removing temp directory {temp_dir}: {e}")
