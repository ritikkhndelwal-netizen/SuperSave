import os
import re
import logging
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv()

from .schemas import (
    FastMetadataRequest,
    FastMetadataResponse,
    ExtractRequest,
    ExtractResponse,
    QARequest,
    QAResponse
)
from .metadata import get_fast_metadata, detect_source, fetch_page_metadata
from .downloader import MediaDownloader
from .gemini_client import GeminiService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("supersave.ai")

app = FastAPI(title="SuperSave AI Service", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

gemini = GeminiService()

@app.get("/health")
def health():
    return {
        "ok": True,
        "service": "supersave-ai",
        "gemini_available": gemini.is_available(),
        "model": gemini.model_name
    }

@app.post("/metadata", response_model=FastMetadataResponse)
def get_metadata(request: FastMetadataRequest):
    """
    Step 1: Ultra-fast metadata retrieval (<400ms).
    Used to immediately capture and display the title, creator, and thumbnail to the user.
    """
    url = request.source_url.strip()
    return get_fast_metadata(url)

@app.post("/extract", response_model=ExtractResponse)
def extract_content(request: ExtractRequest):
    """
    Step 2: Deep multimodal extraction.
    Downloads the audio/video (based on request.mode: 'audio_fast' or 'video_lowres'),
    sends to Gemini Multimodal API to watch/listen, and synthesizes structured knowledge.
    """
    url = request.source_url.strip()
    mode = request.mode or "video_lowres"
    logger.info(f"Extract requested for: {url} (mode: {mode})")

    # Step A: Get fast metadata first so we always have title & thumbnail
    fast_meta = get_fast_metadata(url)

    # Step B: Attempt media download and multimodal Gemini synthesis
    media_path = None
    temp_dir = None
    ai_data = None

    if gemini.is_available():
        try:
            logger.info(f"Attempting media download for {url} in {mode} mode...")
            media_path, temp_dir = MediaDownloader.download(url, mode=mode)
            if media_path:
                logger.info(f"Media downloaded to {media_path}. Sending to Gemini multimodal...")
                ai_data = gemini.extract_from_media(media_path, url)
        except Exception as e:
            logger.warning(f"Media download/multimodal step failed: {e}")
        finally:
            MediaDownloader.cleanup(temp_dir)

        # Fallback to text extraction if media download didn't work (e.g. blog post or web page)
        if not ai_data:
            logger.info("Falling back to Gemini text/metadata extraction...")
            _, page_desc, _ = fetch_page_metadata(url)
            ai_data = gemini.extract_from_text(url, page_title=fast_meta.title, page_desc=page_desc)

    # If Gemini returned valid structured data
    if ai_data:
        return ExtractResponse(
            title=ai_data.get("title") or fast_meta.title,
            category=ai_data.get("category") or fast_meta.category,
            summary=ai_data.get("summary") or f"Saved content from {url}",
            notes=ai_data.get("notes") or f"## Saved Link\n[{url}]({url})",
            tags=ai_data.get("tags") or [],
            key_takeaways=ai_data.get("key_takeaways") or [],
            thumbnail=fast_meta.thumbnail,
            source=fast_meta.source,
        )

    # Dynamic fallback when Gemini is unavailable or unconfigured
    source = detect_source(url)
    fallback_notes = f"""## Overview
Saved content from **{fast_meta.author or source}**.

## Source Details
- **Original Link**: [{url}]({url})
- **Platform**: {source}
- **Category**: {fast_meta.category}

## Key Highlights
1. Captured directly from {source}.
2. Indexed into your SuperSave Knowledge Library.
3. Ready for personal annotation and interactive Q&A.
"""
    return ExtractResponse(
        title=fast_meta.title,
        category=fast_meta.category,
        summary=f"Saved content from {fast_meta.author or source}. URL: {url}",
        notes=fallback_notes,
        tags=[source.lower(), fast_meta.category.lower()],
        key_takeaways=[
            f"Saved from {source}.",
            "Indexed into SuperSave library for fast retrieval.",
            "Ready for review and personal notes."
        ],
        thumbnail=fast_meta.thumbnail,
        source=fast_meta.source
    )

@app.post("/qa", response_model=QAResponse)
def answer_question(request: QARequest):
    """
    Answers interactive questions grounded in the note's context.
    """
    answer = gemini.answer_question(request.question, request.context)
    return QAResponse(answer=answer)
