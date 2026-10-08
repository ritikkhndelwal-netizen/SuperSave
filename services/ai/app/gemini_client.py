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
        and generates structured notes and takeaways directly from the media content.
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

            prompt = f"""You are an expert AI knowledge synthesizer for SuperSave.
Analyze this video/audio carefully. Watch the visual content and listen to the audio.
Original Source URL: {url}

Create high-yield, structured personal knowledge notes from what actually happens in this video/audio.
Return a STRICT JSON object with these exact keys:
- "title": Concise, accurate title describing the actual content (avoid generic titles).
- "category": One relevant category (e.g. "Programming & Tech", "Fitness & Health", "Cooking & Food", "Productivity", "Marketing", "Design", "Entertainment").
- "summary": A high-clarity 2-3 sentence executive summary explaining what this video teaches or demonstrates.
- "notes": Markdown formatted notes. Include timestamped section headers if applicable (e.g. '## [00:15] Key Concept'), step-by-step points, bullet highlights, and code/tips shown on screen.
- "tags": Array of 3-5 relevant lowercase tags (e.g. ["react", "webdev", "performance"]).
- "key_takeaways": Array of 3 specific, memorable bullet points a person should remember.

Only return raw JSON without markdown formatting."""

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

        prompt = f"""You are an expert AI knowledge synthesizer for SuperSave.
Analyze this web content link and its metadata:
URL: {url}
Title: {page_title or 'Unknown'}
Description: {page_desc or 'None'}

Synthesize structured knowledge notes from this link.
Return a STRICT JSON object with these exact keys:
- "title": Concise accurate title.
- "category": Relevant category string.
- "summary": 2-3 sentence overview.
- "notes": Structured markdown notes with sections and bullet points.
- "tags": Array of 3-5 tags.
- "key_takeaways": Array of 3 punchy takeaways.

Only return raw JSON."""

        raw_text = self._generate_with_fallback(prompt)
        if raw_text:
            return self._parse_json_response(raw_text)
        return None

    def answer_question(self, question: str, context: str) -> str:
        """Grounded Q&A against the saved note context."""
        if not self.is_available():
            return f"Based on this note: {context[:250]}… (Gemini API key not configured)."

        prompt = f"""You are a helpful knowledge assistant for SuperSave.
Context from saved note:
{context}

User Question: {question}

Answer the question accurately based on the note context above. If the context does not contain the answer, say so politely while offering general guidance."""

        raw_text = self._generate_with_fallback(prompt)
        if raw_text:
            return raw_text.strip()
        return "Sorry, I could not generate an answer at this time. Please try again."

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
