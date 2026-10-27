import os
import re
import shutil
import tempfile
import urllib.request
import logging
from typing import Optional
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Load environment variables
load_dotenv()

from .schemas import (
    FastMetadataRequest,
    FastMetadataResponse,
    ExtractRequest,
    ExtractResponse,
    QARequest,
    QAResponse,
    TranslateRequest,
    TranslateResponse,
    Chapter,
    CodeSnippet,
    VisualInsights,
    DetectedResource,
    DetectedProduct,
    FactOrClaim,
    DeepMetadata,
    SummaryDetail
)
from .metadata import get_fast_metadata, detect_source, fetch_page_metadata, get_embed_url
from .downloader import MediaDownloader
from .gemini_client import GeminiService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("supersave.ai")

# --- Security: Rate limiting ---
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="SuperSave AI Service", version="0.3.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- Security: Restrict CORS to known origins ---
ALLOWED_ORIGINS = [
    os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
    os.getenv("API_GATEWAY_URL", "http://localhost:4000"),
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

gemini = GeminiService()

@app.get("/health")
@limiter.limit("20/minute")
def health(request: Request):
    return {
        "ok": True,
        "service": "supersave-ai",
        "gemini_available": gemini.is_available(),
        "model": gemini.model_name
    }

@app.post("/metadata", response_model=FastMetadataResponse)
@limiter.limit("20/minute")
def get_metadata(request: Request, body: FastMetadataRequest):
    """
    Step 1: Ultra-fast metadata retrieval (<400ms).
    Used to immediately capture and display the title, creator, thumbnail, and embed player.
    """
    url = body.source_url.strip()
    return get_fast_metadata(url)

def is_valid_media_image(img_url: Optional[str]) -> bool:
    """Verifies that the image URL is an actual content photo, and NOT a favicon or website logo."""
    if not img_url or not isinstance(img_url, str):
        return False
    lower = img_url.lower()
    # Reject generic favicons, logos, or icon fallback services
    if any(bad in lower for bad in ["favicon", "favicons", "avatar", "default_", "icon", "logo"]):
        return False
    # Accept real CDN media images (Pinterest i.pinimg.com, Instagram cdn, etc.)
    if "pinimg.com" in lower:
        return True
    if any(ext in lower for ext in [".jpg", ".jpeg", ".png", ".webp"]):
        return True
    return False

@app.post("/extract", response_model=ExtractResponse)
@limiter.limit("5/minute")
def extract_content(request: Request, body: ExtractRequest):
    """
    Step 2: Deep multimodal extraction covering all 14 intelligence dimensions.
    """
    url = body.source_url.strip()
    mode = body.mode or "video_lowres"
    client_meta = body.client_meta or {}
    logger.info(f"Extract requested for: {url} (mode: {mode}, has_client_meta: {bool(client_meta)})")

    # Step A: Get fast metadata first so we always have title, thumbnail, and embed player
    fast_meta = get_fast_metadata(url)
    if client_meta.get("title"):
        fast_meta.title = str(client_meta["title"]).strip()
    if client_meta.get("thumbnail") and is_valid_media_image(client_meta["thumbnail"]):
        fast_meta.thumbnail = str(client_meta["thumbnail"]).strip()
    if client_meta.get("author"):
        fast_meta.author = str(client_meta["author"]).strip()

    # Step B: Attempt media download and multimodal Gemini synthesis
    media_path = None
    temp_dir = None
    ai_data = None

    if gemini.is_available():
        # Only attempt video download if not a known image/idea platform like Pinterest
        if fast_meta.source != "Pinterest":
            try:
                logger.info(f"Attempting media download for {url} in {mode} mode...")
                media_path, temp_dir, downloaded_thumb, downloaded_title = MediaDownloader.download(url, mode=mode)
                if downloaded_thumb and (not fast_meta.thumbnail or not is_valid_media_image(fast_meta.thumbnail)):
                    fast_meta.thumbnail = downloaded_thumb
                if downloaded_title and (not fast_meta.title or "Saved from" in fast_meta.title or "Instagram Reel from" in fast_meta.title):
                    fast_meta.title = downloaded_title
                if media_path:
                    logger.info(f"Media downloaded to {media_path}. Sending to Gemini multimodal...")
                    ai_data = gemini.extract_from_media(media_path, url)
            except Exception as e:
                logger.warning(f"Media download/multimodal step failed: {e}")
            finally:
                MediaDownloader.cleanup(temp_dir)

        # Step B1: If we have an actual content image (e.g. Pinterest Pin image on pinimg.com, NOT a favicon!), use Gemini Vision!
        if not ai_data and is_valid_media_image(fast_meta.thumbnail):
            img_path = None
            img_temp_dir = None
            try:
                logger.info(f"Downloading Pin/Visual image for Gemini Vision: {fast_meta.thumbnail}")
                img_temp_dir = tempfile.mkdtemp(prefix="supersave_pin_img_")
                ext = "jpg"
                if ".png" in fast_meta.thumbnail.lower():
                    ext = "png"
                elif ".webp" in fast_meta.thumbnail.lower():
                    ext = "webp"
                img_path = os.path.join(img_temp_dir, f"pin.{ext}")
                req = urllib.request.Request(fast_meta.thumbnail, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, timeout=10) as resp:
                    with open(img_path, "wb") as f:
                        f.write(resp.read())

                client_extra = None
                if client_meta.get("description") or client_meta.get("notes") or client_meta.get("author"):
                    client_extra = f"Description: {client_meta.get('description', '')} | Author: {client_meta.get('author', '')} | Notes: {client_meta.get('notes', '')}"
                
                ai_data = gemini.extract_from_image(
                    img_path,
                    url,
                    page_title=fast_meta.title,
                    page_desc=client_meta.get("description"),
                    client_context=client_extra
                )
            except Exception as e:
                logger.warning(f"Gemini image vision extraction failed: {e}")
            finally:
                if img_temp_dir and os.path.exists(img_temp_dir):
                    shutil.rmtree(img_temp_dir, ignore_errors=True)

        # Fallback to text extraction if media/image download didn't work (e.g. blog post or web page)
        if not ai_data:
            logger.info("Falling back to Gemini text/metadata extraction...")
            _, page_desc, _ = fetch_page_metadata(url)
            client_extra = None
            if client_meta.get("description") or client_meta.get("notes") or client_meta.get("author"):
                client_extra = f"Description: {client_meta.get('description', '')} | Author: {client_meta.get('author', '')} | Notes: {client_meta.get('notes', '')}"
            ai_data = gemini.extract_from_text(
                url,
                page_title=fast_meta.title,
                page_desc=client_meta.get("description") or page_desc,
                extra_context=client_extra
            )

    # If Gemini returned valid structured data
    if ai_data:
        # Parse chapters
        chapters = []
        for ch in ai_data.get("chapters", []):
            if isinstance(ch, dict) and "title" in ch:
                chapters.append(Chapter(
                    timestamp=str(ch.get("timestamp", "00:00")),
                    seconds=int(ch.get("seconds", 0)),
                    title=str(ch.get("title", "")),
                    summary=str(ch.get("summary", ""))
                ))

        # Parse code snippets
        code_snippets = []
        for cs in ai_data.get("code_snippets", []):
            if isinstance(cs, dict) and "code" in cs:
                code_snippets.append(CodeSnippet(
                    language=str(cs.get("language", "text")),
                    title=str(cs.get("title", "Code snippet")),
                    code=str(cs.get("code", "")),
                    timestamp=cs.get("timestamp")
                ))

        # Parse visual insights
        vi_raw = ai_data.get("visual_insights", {})
        visual_insights = VisualInsights(
            on_screen_text=vi_raw.get("on_screen_text", []) if isinstance(vi_raw, dict) else [],
            diagrams_or_slides=vi_raw.get("diagrams_or_slides", []) if isinstance(vi_raw, dict) else [],
            tools_or_ui_shown=vi_raw.get("tools_or_ui_shown", []) if isinstance(vi_raw, dict) else [],
            objects_or_ingredients=vi_raw.get("objects_or_ingredients", []) if isinstance(vi_raw, dict) else []
        )

        # Parse detected resources
        detected_resources = []
        for res in ai_data.get("detected_resources", []):
            if isinstance(res, dict) and "name" in res:
                detected_resources.append(DetectedResource(
                    name=str(res.get("name", "")),
                    type=str(res.get("type", "tool")),
                    reference=str(res.get("reference", ""))
                ))

        # Parse detected products
        detected_products = []
        for prod in ai_data.get("detected_products", []):
            if isinstance(prod, dict) and "name" in prod:
                detected_products.append(DetectedProduct(
                    brand=str(prod.get("brand", "")),
                    name=str(prod.get("name", "")),
                    category=str(prod.get("category", ""))
                ))

        # Parse facts and claims
        facts_and_claims = []
        for fc in ai_data.get("facts_and_claims", []):
            if isinstance(fc, dict) and "claim" in fc:
                facts_and_claims.append(FactOrClaim(
                    claim=str(fc.get("claim", "")),
                    verification_note=str(fc.get("verification_note", ""))
                ))

        # Parse metadata
        meta_raw = ai_data.get("metadata", {})
        metadata = DeepMetadata(
            tags=meta_raw.get("tags", ai_data.get("tags", [])) if isinstance(meta_raw, dict) else [],
            keywords=meta_raw.get("keywords", []) if isinstance(meta_raw, dict) else [],
            technologies=meta_raw.get("technologies", []) if isinstance(meta_raw, dict) else [],
            people=meta_raw.get("people", []) if isinstance(meta_raw, dict) else [],
            brands=meta_raw.get("brands", []) if isinstance(meta_raw, dict) else [],
            locations=meta_raw.get("locations", []) if isinstance(meta_raw, dict) else []
        )

        # Parse summary detail
        sum_detail_raw = ai_data.get("summary_detail")
        summary_detail = None
        if isinstance(sum_detail_raw, dict):
            summary_detail = SummaryDetail(
                executive=str(sum_detail_raw.get("executive", "")),
                tldr=str(sum_detail_raw.get("tldr", ""))
            )

        return ExtractResponse(
            title=ai_data.get("title") or fast_meta.title,
            content_type=ai_data.get("content_type", "general"),
            category=ai_data.get("category") or fast_meta.category,
            subcategory=ai_data.get("subcategory"),
            summary=ai_data.get("summary") or f"Saved content from {url}",
            summary_detail=summary_detail,
            notes=ai_data.get("notes") or f"## Saved Link\n[{url}]({url})",
            tags=ai_data.get("tags") or metadata.tags or [],
            key_takeaways=ai_data.get("key_takeaways") or [],
            chapters=chapters,
            visual_insights=visual_insights,
            code_snippets=code_snippets,
            detected_resources=detected_resources,
            detected_products=detected_products,
            facts_and_claims=facts_and_claims,
            metadata=metadata,
            action_items=ai_data.get("action_items") or [],
            thumbnail=fast_meta.thumbnail,
            source=fast_meta.source,
            embed_url=fast_meta.embed_url
        )

    # Dynamic fallback when Gemini is unavailable
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
        content_type="general",
        category=fast_meta.category,
        summary=f"Saved content from {fast_meta.author or source}. URL: {url}",
        notes=fallback_notes,
        tags=[source.lower(), fast_meta.category.lower()],
        key_takeaways=[
            f"Saved from {source}.",
            "Indexed into SuperSave library for fast retrieval.",
            "Ready for review and personal notes."
        ],
        chapters=[Chapter(timestamp="00:00", seconds=0, title="Full Overview", summary="General content")],
        thumbnail=fast_meta.thumbnail,
        source=fast_meta.source,
        embed_url=fast_meta.embed_url
    )

@app.post("/qa", response_model=QAResponse)
@limiter.limit("15/minute")
def answer_question(request: Request, body: QARequest):
    """
    Answers interactive questions grounded in the note's context with optional Web Search expansion.
    """
    qa_result = gemini.answer_question(body.question, body.context, search_mode=body.search_mode)
    return QAResponse(
        answer=qa_result["answer"],
        search_mode=qa_result.get("search_mode", "note_only"),
        sources=qa_result.get("sources", [])
    )

@app.post("/translate", response_model=TranslateResponse)
@limiter.limit("10/minute")
def translate(request: Request, body: TranslateRequest):
    """
    Translates notes or summaries into the requested target language.
    """
    translated = gemini.translate_content(body.text, body.target_language)
    return TranslateResponse(translated_text=translated, target_language=body.target_language)
