import html
import json
import re
import urllib.parse
import urllib.request
import httpx
from typing import Tuple, Optional
from .schemas import FastMetadataResponse

def detect_source(url: str) -> str:
    lower = url.lower()
    if "instagram.com" in lower:
        return "Instagram"
    if "youtube.com" in lower or "youtu.be" in lower:
        return "YouTube"
    if "pinterest.com" in lower or "pin.it" in lower:
        return "Pinterest"
    return "Web"

def get_embed_url(url: str) -> Optional[str]:
    """Generates a clean embeddable player URL for YouTube, Instagram, or Pinterest."""
    # YouTube (regular, shorts, youtu.be)
    yt_match = re.search(r'(?:v=|\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})', url)
    if yt_match:
        video_id = yt_match.group(1)
        return f"https://www.youtube.com/embed/{video_id}?enablejsapi=1"

    # Instagram Reels
    ig_match = re.search(r'instagram\.com\/(?:reel|p)\/([a-zA-Z0-9_-]+)', url)
    if ig_match:
        code = ig_match.group(1)
        return f"https://www.instagram.com/reel/{code}/embed"

    # Pinterest Pin
    pin_match = re.search(r'pin\/([0-9]+)', url)
    if pin_match:
        pin_id = pin_match.group(1)
        return f"https://assets.pinterest.com/ext/embed.html?id={pin_id}"

    return None

def fetch_pinterest_oembed(url: str) -> Tuple[Optional[str], Optional[str], Optional[str], Optional[str]]:
    """
    Fetch pin title, author, high-res thumbnail, and embed iframe from Pinterest's official oEmbed endpoint.
    Handles pin.it shortened URLs by following HTTP 301/308 redirects via httpx.
    """
    canonical_url = url
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        # Resolve pin.it or shortened redirect with HTTP 308 support
        if "pin.it" in url.lower():
            with httpx.Client(follow_redirects=True, timeout=8.0, headers=headers) as client:
                resp = client.get(url)
                canonical_url = str(resp.url)

        # Clean canonical URL to extract clean pin ID and clean pin URL
        pin_match = re.search(r'pin\/([0-9]+)', canonical_url)
        pin_id = pin_match.group(1) if pin_match else None
        if pin_id:
            canonical_url = f"https://www.pinterest.com/pin/{pin_id}/"

        # Call official Pinterest oEmbed
        oembed_url = f"https://www.pinterest.com/oembed.json?url={urllib.parse.quote(canonical_url)}"
        with httpx.Client(timeout=8.0, headers=headers) as client:
            resp = client.get(oembed_url)
            if resp.status_code == 200:
                data = resp.json()
                raw_title = (data.get("title") or "").strip()
                author = data.get("author_name")
                thumb = data.get("thumbnail_url")
                # Upgrade thumbnail to high resolution (736x) if possible
                if thumb and "/236x/" in thumb:
                    thumb = thumb.replace("/236x/", "/736x/")

                embed_url = f"https://assets.pinterest.com/ext/embed.html?id={pin_id}" if pin_id else None
                title = raw_title if raw_title else None
                return title, author, thumb, embed_url
    except Exception:
        return None, None, None, None
    return None, None, None, None

def fetch_youtube_oembed(url: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """Fetch video title, author, and thumbnail via YouTube's official oEmbed endpoint."""
    try:
        oembed_url = f"https://www.youtube.com/oembed?url={urllib.parse.quote(url)}&format=json"
        req = urllib.request.Request(oembed_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=4) as response:
            data = json.loads(response.read().decode("utf-8"))
            return data.get("title"), data.get("author_name"), data.get("thumbnail_url")
    except Exception:
        return None, None, None

def fetch_page_metadata(url: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """Fetch page title, description, and thumbnail from OpenGraph/HTML tags."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=4) as response:
            content_type = response.headers.get("Content-Type", "")
            if "text/html" not in content_type and "application/xhtml" not in content_type:
                return None, None, None
            html_bytes = response.read(150000)
            html_text = html_bytes.decode("utf-8", errors="ignore")

            # Extract Title
            og_title = re.search(r'<meta\s+property=["\']og:title["\']\s+content=["\'](.*?)["\']', html_text, re.IGNORECASE)
            title_tag = re.search(r'<title[^>]*>(.*?)</title>', html_text, re.IGNORECASE | re.DOTALL)
            title = None
            if og_title:
                title = html.unescape(og_title.group(1)).strip()
            elif title_tag:
                title = html.unescape(title_tag.group(1)).strip()

            # Extract Description
            og_desc = re.search(r'<meta\s+property=["\']og:description["\']\s+content=["\'](.*?)["\']', html_text, re.IGNORECASE)
            meta_desc = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', html_text, re.IGNORECASE)
            desc = None
            if og_desc:
                desc = html.unescape(og_desc.group(1)).strip()
            elif meta_desc:
                desc = html.unescape(meta_desc.group(1)).strip()

            # Extract Thumbnail
            og_image = re.search(r'<meta\s+property=["\']og:image["\']\s+content=["\'](.*?)["\']', html_text, re.IGNORECASE)
            thumbnail = html.unescape(og_image.group(1)).strip() if og_image else None

            return title, desc, thumbnail
    except Exception:
        return None, None, None

def get_fast_metadata(url: str) -> FastMetadataResponse:
    """Instantly extracts high-level metadata (title, platform, thumbnail, embed) in <400ms."""
    source = detect_source(url)
    embed_url = get_embed_url(url)
    parsed = urllib.parse.urlparse(url)
    domain = parsed.netloc.replace("www.", "")

    if source == "YouTube":
        yt_title, yt_author, yt_thumb = fetch_youtube_oembed(url)
        if yt_title:
            return FastMetadataResponse(
                title=yt_title,
                author=yt_author,
                thumbnail=yt_thumb,
                category="Video Content",
                source=source,
                embed_url=embed_url
            )

    if source == "Pinterest":
        p_title, p_author, p_thumb, p_embed = fetch_pinterest_oembed(url)
        clean_title = p_title or (f"Pinterest Idea by {p_author}" if p_author else "Pinterest Pin")
        return FastMetadataResponse(
            title=clean_title,
            author=p_author or "Pinterest",
            thumbnail=p_thumb,
            category="Design & Creative",
            source=source,
            embed_url=p_embed or embed_url
        )

    # General / Instagram fallback
    title, _desc, thumbnail = fetch_page_metadata(url)
    if not title:
        path = parsed.path.strip("/")
        slug = path.split("/")[-1] if path else domain
        clean_slug = re.sub(r"[-_]", " ", slug).title()
        title = f"Saved from {domain}: {clean_slug}" if clean_slug else f"Saved link from {domain}"

    category = "General"
    if source == "Instagram":
        category = "Social & Reels"
    elif "github.com" in domain or "stackoverflow.com" in domain:
        category = "Programming & Tech"

    return FastMetadataResponse(
        title=title,
        author=domain,
        thumbnail=thumbnail,
        category=category,
        source=source,
        embed_url=embed_url
    )
