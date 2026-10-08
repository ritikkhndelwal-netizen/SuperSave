import os
import json
import time
import logging
from typing import Optional, Dict, Any, List
from google import genai

logger = logging.getLogger("supersave.gemini")

class GeminiService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "")
        self.client = genai.Client(api_key=self.api_key) if self.api_key else None
        # Preferred models for fast multimodal generation
        self.preferred_models: List[str] = [
            os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite"),
            "gemini-flash-latest",
            "gemini-3-flash-preview"
        ]

    def is_available(self) -> bool:
        return bool(self.client and self.api_key)

    @property
    def model_name(self) -> str:
        return self.preferred_models[0]

    def _generate_with_fallback(self, contents: Any) -> Optional[str]:
        """Tries candidate models in order to avoid transient 503 high-demand errors."""
        last_error = None
        for model in self.preferred_models:
            try:
                logger.info(f"Generating content with model: {model}")
                response = self.client.models.generate_content(
                    model=model,
                    contents=contents
                )
                if response and response.text:
                    return response.text
            except Exception as e:
                logger.warning(f"Model {model} failed: {e}. Trying next fallback...")
                last_error = e
                time.sleep(0.5)

        logger.error(f"All Gemini models in fallback chain failed. Last error: {last_error}")
        return None

    def extract_from_media(self, media_path: str, url: str) -> Optional[Dict[str, Any]]:
        """
        Uploads video or audio to Gemini Files API, waits for processing,
        and generates rich multimodal intelligence covering all 14 knowledge dimensions.
        """
        if not self.is_available():
            return None

        uploaded_file = None
        try:
            logger.info(f"Uploading media to Gemini File API: {media_path}")
            uploaded_file = self.client.files.upload(file=media_path)
            logger.info(f"File uploaded to Gemini with ID: {uploaded_file.name}, waiting for processing...")

            # Poll until file is processed and ACTIVE
            start_wait = time.time()
            while uploaded_file.state.name == "PROCESSING":
                if time.time() - start_wait > 60:
                    raise TimeoutError("Gemini file processing timed out after 60s")
                time.sleep(2)
                uploaded_file = self.client.files.get(name=uploaded_file.name)

            if uploaded_file.state.name == "FAILED":
                raise RuntimeError("Gemini file processing failed")

            prompt = f"""You are an elite AI Knowledge Synthesizer and Multimodal Intelligence Engine for SuperSave.
Analyze this video/audio in depth. Watch the visuals (frames, slides, UI, demonstrations, on-screen text) and listen to the audio carefully.
Source URL: {url}

Extract a comprehensive, structured knowledge dossier.
Return a STRICT JSON object with these EXACT keys:
{{
  "title": "Concise, highly descriptive title representing the actual content",
  "content_type": "One of: 'code_tutorial' | 'recipe' | 'fitness' | 'review' | 'lecture' | 'podcast' | 'business' | 'general'",
  "category": "Broad domain (e.g., Programming, Cooking, Fitness, Productivity, Science, Marketing)",
  "subcategory": "Specific sub-domain (e.g., Frontend React, High-Protein Diet, Hypertrophy, SEO)",
  "summary": "2-3 sentence executive summary explaining what is demonstrated or taught",
  "summary_detail": {{
    "executive": "Executive summary paragraph",
    "tldr": "A 30-second bullet point summary"
  }},
  "notes": "Rich markdown notes with clear headers (##), numbered logical steps, and bullet explanations",
  "key_takeaways": [
    "High-impact actionable takeaway 1",
    "High-impact actionable takeaway 2",
    "High-impact actionable takeaway 3"
  ],
  "chapters": [
    {{
      "timestamp": "00:00",
      "seconds": 0,
      "title": "Introduction & Hook",
      "summary": "Overview of the problem"
    }}
  ],
  "visual_insights": {{
    "on_screen_text": ["Key phrases, slide titles, or captions visible on screen"],
    "diagrams_or_slides": ["Descriptions of charts, architecture diagrams, or presentation slides shown"],
    "tools_or_ui_shown": ["Applications, web interfaces, CLI terminals, or editors shown in video"],
    "objects_or_ingredients": ["Physical objects, ingredients, hardware, or workout equipment shown"]
  }},
  "code_snippets": [
    {{
      "language": "typescript / python / bash / etc",
      "title": "Purpose of this snippet",
      "code": "exact code or terminal command shown",
      "timestamp": "MM:SS"
    }}
  ],
  "detected_resources": [
    {{
      "name": "Resource or Tool Name",
      "type": "github | book | tool | website | article",
      "reference": "URL, repo name, or author mentioned"
    }}
  ],
  "detected_products": [
    {{
      "brand": "Brand Name",
      "name": "Product or Software Name",
      "category": "Hardware, Software, Supplement, Apparel, etc."
    }}
  ],
  "facts_and_claims": [
    {{
      "claim": "Specific stat or factual assertion made by speaker",
      "verification_note": "Contextual note or consensus reality check"
    }}
  ],
  "metadata": {{
    "tags": ["3-6 lowercase tags"],
    "keywords": ["specific search keywords"],
    "technologies": ["languages, libraries, frameworks mentioned"],
    "people": ["speakers, guests, or historical figures mentioned"],
    "brands": ["companies, publishers, or sponsors"],
    "locations": ["places mentioned or filmed in"]
  }},
  "action_items": [
    "Concrete step or action item the viewer should take",
    "Another action item"
  ]
}}

Ensure timestamps match actual points in the video. Only return raw JSON without markdown wrapping."""

            raw_text = self._generate_with_fallback([uploaded_file, prompt])
            if raw_text:
                return self._parse_json_response(raw_text)
            return None

        except Exception as e:
            logger.error(f"Error in Gemini multimodal extraction: {e}")
            return None
        finally:
            if uploaded_file:
                try:
                    self.client.files.delete(name=uploaded_file.name)
                    logger.info(f"Deleted temporary Gemini file: {uploaded_file.name}")
                except Exception as e:
                    logger.warning(f"Could not delete Gemini file {uploaded_file.name}: {e}")

    def extract_from_text(self, url: str, page_title: Optional[str] = None, page_desc: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Fallback extraction using web metadata when video download is unavailable."""
        if not self.is_available():
            return None

        prompt = f"""You are an elite AI Knowledge Synthesizer for SuperSave.
Analyze this webpage and metadata:
URL: {url}
Title: {page_title or 'Unknown'}
Description: {page_desc or 'None'}

Generate a structured knowledge dossier in JSON format with:
- "title": Clear title
- "content_type": 'article' | 'documentation' | 'tool' | 'general'
- "category": Main domain
- "subcategory": Specific topic
- "summary": 2-3 sentence overview
- "summary_detail": {{ "executive": "...", "tldr": "..." }}
- "notes": Structured markdown notes
- "key_takeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"]
- "chapters": [{{ "timestamp": "00:00", "seconds": 0, "title": "Overview", "summary": "Main concept" }}]
- "visual_insights": {{ "on_screen_text": [], "diagrams_or_slides": [], "tools_or_ui_shown": [], "objects_or_ingredients": [] }}
- "code_snippets": []
- "detected_resources": []
- "detected_products": []
- "facts_and_claims": []
- "metadata": {{ "tags": ["web"], "keywords": [], "technologies": [], "people": [], "brands": [], "locations": [] }}
- "action_items": ["Review saved knowledge"]

Only return raw JSON."""

        raw_text = self._generate_with_fallback(prompt)
        if raw_text:
            return self._parse_json_response(raw_text)
        return None

    def answer_question(self, question: str, context: str, search_mode: str = "note_only") -> Dict[str, Any]:
        """Grounded Q&A with optional Google Search / broad web knowledge augmentation."""
        import urllib.parse

        if not self.is_available():
            return {
                "answer": f"Based on this note: {context[:250]}… (Gemini API key not configured).",
                "search_mode": search_mode,
                "sources": []
            }

        sources = []
        if search_mode == "note_and_web":
            prompt = f"""You are an elite knowledge synthesizer and web research assistant for SuperSave.
The user is asking a question about their saved content, but has ENABLED 'Note + Web Search' mode to expand beyond the video note.

Context from saved video/article note:
{context}

User Question: {question}

Instructions:
1. Synthesize insights from BOTH the saved note context AND broad web/world knowledge.
2. If the user asks about something beyond what was covered in the note (e.g. latest alternatives, broader context, documentation, pricing, recipe substitutes), explain it clearly using current domain knowledge.
3. Explicitly structure your answer:
   - **From Your Saved Note**: What the video/author specifically stated
   - **Expanded Web Intelligence**: Latest recommendations, documentation, or real-world alternatives
4. Format with clean markdown headers and bullet points."""

            search_query = urllib.parse.quote(question)
            sources = [
                {"title": f"Google Search: '{question[:35]}…'", "url": f"https://www.google.com/search?q={search_query}"},
                {"title": "Search related videos on YouTube", "url": f"https://www.youtube.com/results?search_query={search_query}"}
            ]
        else:
            prompt = f"""You are an interactive AI knowledge co-pilot for SuperSave.
Context from saved video/article note:
{context}

User Question: {question}

Instructions:
1. Answer accurately based strictly on the context above.
2. If there are timestamps mentioned in the context, cite them like [01:25] so the user knows where to watch.
3. If the context does not contain the answer, say so politely without making up information."""

        raw_text = self._generate_with_fallback(prompt)
        answer = raw_text.strip() if raw_text else "Sorry, I could not generate an answer at this time. Please try again."
        return {
            "answer": answer,
            "search_mode": search_mode,
            "sources": sources
        }

    def translate_content(self, text: str, target_language: str = "English") -> str:
        """Translates notes or summaries into the requested target language."""
        if not self.is_available():
            return text

        prompt = f"""You are a professional multilingual translator.
Translate the following text into {target_language}.
Preserve all markdown formatting, timestamps like [01:25], code blocks, and technical terminology accurately.

Text to translate:
{text}"""

        raw_text = self._generate_with_fallback(prompt)
        if raw_text:
            return raw_text.strip()
        return text

    def _parse_json_response(self, text: str) -> Optional[Dict[str, Any]]:
        cleaned = text.strip()
        if "```json" in cleaned:
            cleaned = cleaned.split("```json")[1].split("```")[0].strip()
        elif "```" in cleaned:
            cleaned = cleaned.split("```")[1].split("```")[0].strip()

        try:
            return json.loads(cleaned)
        except Exception as e:
            logger.error(f"Failed to parse JSON from Gemini response: {e}\nRaw response: {text}")
            return None
