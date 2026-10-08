# ReelMind — MVP

Turn saved short-form content into searchable, structured knowledge.

## MVP

- Website: login shell, dashboard, saved content, note detail, personal notes, Q&A, search.
- Browser extension: quick-save current Instagram/YouTube URL, injected "Save to ReelMind" affordance near share UI when available, context menu, and link to the web app.
- API: content ingestion, content retrieval/search, personal notes, Q&A.
- AI service: FastAPI boundary for video extraction and note Q&A. Starts in `mock` mode so the UI can be developed without keys; plug in the existing Phase 1 Gemma extractor next.

## Run

1. `npm install`
2. Copy `.env.example` files and fill values as needed.
3. `npm run dev:web`
4. `npm run dev:api`
5. `python -m venv .venv && .venv\\Scripts\\activate` (Windows) or `source .venv/bin/activate` (macOS/Linux)
6. `pip install -r services/ai/requirements.txt`
7. `uvicorn services.ai.app.main:app --reload --port 8000`

For the first demo, the web app uses seeded in-memory data. The DB adapter is intentionally the next slice so we don't block UI work.

## Architecture

```text
Chrome Extension ─────┐
                      ▼
                 Next.js Web
                      │
                      ▼
                 Node API
                      │
             ┌────────┴────────┐
             ▼                 ▼
        PostgreSQL         FastAPI AI
                               │
                               ▼
                           Gemma 4
```

The system keeps the AI service behind a stable HTTP contract so the video model implementation can change without rewriting the website or extension.

## Important AI implementation note

Gemma 4 supports video in the open-weight family, while Google's Gemini API documentation currently lists hosted Gemma 4 API models separately from the video examples. For the MVP we therefore keep the AI implementation behind an adapter: `mock` now, the existing Phase 1 Gemma video runner next, and an API-hosted model only where its modality support is verified.
