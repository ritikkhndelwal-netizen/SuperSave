# SuperSave 🧠⚡

> **Turn saved short-form reels, tutorials, and web videos into searchable, structured knowledge.**

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20.9.0-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.3.0-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20GenAI-gemini--3.5--flash--lite-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Chrome Extension](https://img.shields.io/badge/Manifest-V3-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Monorepo Structure](#-monorepo-structure)
- [Prerequisites](#-prerequisites)
- [Quickstart & Local Setup](#-quickstart--local-setup)
  - [1. Clone and Install Dependencies](#1-clone-and-install-dependencies)
  - [2. Environment Configuration](#2-environment-configuration)
  - [3. Start AI Service (FastAPI)](#3-start-ai-service-fastapi)
  - [4. Start API Gateway (Node.js)](#4-start-api-gateway-nodejs)
  - [5. Start Web Application (Next.js)](#5-start-web-application-nextjs)
  - [6. Load Chrome Extension](#6-load-chrome-extension)
- [14 Dimensions of Video Intelligence](#-14-dimensions-of-video-intelligence)
- [API Reference](#-api-reference)
  - [Node API Gateway (`:4000`)](#node-api-gateway-4000)
  - [FastAPI AI Service (`:8000`)](#fastapi-ai-service-8000)
- [Extraction Modes](#-extraction-modes)
- [Roadmap & MVP Progress](#-roadmap--mvp-progress)
- [License](#-license)

---

## 💡 Overview

Billions of valuable tutorials, recipes, code walk-throughs, workout plans, and insights are consumed daily on **Instagram Reels, YouTube Shorts, TikTok, and X (Twitter)**. However, traditional bookmarking fails:
- Videos get lost in endless save lists.
- You can't search spoken words or on-screen code snippets.
- Taking notes while watching is tedious and breaks focus.

**SuperSave** solves this by providing a unified capture layer and multimodal AI processing pipeline. With a single click from the browser or Chrome extension, SuperSave downloads the media, parses audio and visual frames with Google's Gemini models, and extracts 14 structured intelligence dimensions into an interactive knowledge workspace.

---

## ✨ Key Features

- ⚡ **Universal 1-Click Capture**:
  - **Browser Extension (Manifest V3)**: Save active tabs directly from the popup.
  - **Native In-Page Save Button**: Auto-injected "Save to SuperSave" action buttons directly on Instagram Reels and YouTube interfaces.
  - **Context Menu**: Right-click any video or page link to send straight to SuperSave.
- 🤖 **Deep Multimodal Video Extraction**:
  - Frame-by-frame and audio analysis powered by **Google Gemini Files API** (`gemini-3.5-flash-lite`, `gemini-flash-latest`).
  - Automated fallback chain to maintain high availability and prevent rate limits.
  - Media scraping using `yt-dlp` capped at optimal 480p low-res video or ultra-fast audio-only streams.
- 📊 **14 Dimensions of Extracted Intelligence**:
  - Executive Summaries, TL;DRs, Key Takeaways, Interactive Chapter Timestamps, Code Snippets, Visual Insights (on-screen text, diagrams, tools), Detected Resources (GitHub, books, tools), Detected Products, Fact & Claim Verification, Action Items, and Categorization.
- 🔍 **Interactive Knowledge Hub**:
  - High-performance dark-mode web workspace built with Next.js.
  - Real-time search across titles, transcripts, markdown notes, tags, and takeaways.
  - Interactive video embed player synced with chapter timestamps.
- 💬 **Contextual AI Q&A & Search Grounding**:
  - Ask questions directly against any saved video note.
  - Toggle between **Note Only** mode and **Web Grounded** mode powered by Google Search grounding.
- 🌐 **Instant Multi-Language Translation**:
  - Translate any note and summary on the fly into Spanish, French, Hindi, German, Japanese, and more.
- 📁 **Collections & Organization**:
  - Organize notes into custom or auto-categorized collections (Programming, Cooking, Fitness, Design, etc.).
  - Mark favorites, write editable personal reflections, and export notes as clean Markdown.

---

## 🏗 System Architecture

```text
  ┌──────────────────────────────────────────────────────────────┐
  │                        Capture Layer                         │
  │   Chrome Extension (MV3)  •  In-Page Buttons  •  Web Modal   │
  └──────────────────────────────┬───────────────────────────────┘
                                 │ HTTP / JSON
                                 ▼
  ┌──────────────────────────────────────────────────────────────┐
  │                    Next.js Web Dashboard                     │
  │               (App Router, React 19, Vanilla CSS)            │
  └──────────────────────────────┬───────────────────────────────┘
                                 │ REST
                                 ▼
  ┌──────────────────────────────────────────────────────────────┐
  │                    Node.js API Gateway                       │
  │                  (Express, TypeScript, Port 4000)            │
  └──────────────────────────────┬───────────────────────────────┘
                                 │ Asynchronous Jobs
                                 ▼
  ┌──────────────────────────────────────────────────────────────┐
  │                      FastAPI AI Service                      │
  │                     (Python, Port 8000)                      │
  ├──────────────────────────────┬───────────────────────────────┤
  │   yt-dlp Media Scraper       │   Fast Metadata (<400ms)      │
  │   (Stream 480p / Audio)      │   (oEmbed / OpenGraph Parser) │
  └──────────────────────────────┬───────────────────────────────┘
                                 │ Files API & Multimodal Inference
                                 ▼
  ┌──────────────────────────────────────────────────────────────┐
  │                     Google Gemini Engine                     │
  │        gemini-3.5-flash-lite  /  gemini-flash-latest         │
  │          (Multimodal Video, Audio, OCR, Verification)        │
  └──────────────────────────────────────────────────────────────┘
```

---

## 📂 Monorepo Structure

```text
SuperSave/
├── apps/
│   ├── extension/          # Chrome Extension (Manifest V3)
│   │   ├── manifest.json   # Extension configuration & permissions
│   │   ├── content.js      # In-page UI injection for Instagram & YouTube
│   │   ├── popup.html/js   # Quick save popup dialog
│   │   └── background.js   # Service worker & context menu handlers
│   └── web/                # Next.js Frontend Application
│       ├── app/            # Next.js App Router (Dashboard, Notes detail)
│       ├── components/     # AppShell, DashboardClient, NoteClient, MarkdownView
│       └── lib/            # Shared client types and utilities
├── services/
│   ├── ai/                 # Python FastAPI AI Microservice
│   │   ├── app/
│   │   │   ├── main.py          # FastAPI application routes
│   │   │   ├── downloader.py    # yt-dlp media downloader & temp management
│   │   │   ├── gemini_client.py # Gemini Files API & multimodal reasoning
│   │   │   ├── metadata.py      # Ultra-fast oEmbed & OpenGraph scraper
│   │   │   └── schemas.py       # Pydantic request & response schemas
│   │   └── requirements.txt
│   └── api/                # Node.js API Gateway
│       ├── src/
│       │   └── index.ts    # Express server, content store, orchestration
│       └── db/
│           └── schema.sql  # Target relational PostgreSQL schema
├── docs/                   # Architectural specs & ship checklist
├── package.json            # NPM root workspaces config
└── .env.example            # Environment variables template
```

---

## ⚙️ Prerequisites

Before getting started, ensure you have the following installed on your machine:

- **Node.js**: `v20.9.0` or higher
- **npm**: `v10.0.0` or higher
- **Python**: `v3.10` or higher
- **ffmpeg** *(Optional but recommended)*: Required by `yt-dlp` for media stream remuxing.
- **Google Gemini API Key**: [Get an API Key here](https://aistudio.google.com/). *(Optional: Service starts in mock/graceful mode if no key is supplied).*

---

## 🚀 Quickstart & Local Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-username/supersave.git
cd supersave

# Install Node monorepo dependencies
npm install
```

### 2. Environment Configuration

Copy the example `.env` file to your root:

```bash
cp .env.example .env
```

Configure your `.env` values:

```env
# Web & API Ports
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000
API_PORT=4000
AI_SERVICE_URL=http://localhost:8000

# Google Gemini API (For live multimodal extraction)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash-lite
```

### 3. Start AI Service (FastAPI)

Set up a Python virtual environment and run the FastAPI server:

**On Windows (PowerShell):**
```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r services/ai/requirements.txt
uvicorn services.ai.app.main:app --reload --port 8000
```

**On macOS / Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r services/ai/requirements.txt
uvicorn services.ai.app.main:app --reload --port 8000
```

> The AI service will be live at `http://localhost:8000`. You can test health at `http://localhost:8000/health`.

### 4. Start API Gateway (Node.js)

In a separate terminal window:

```bash
npm run dev:api
```

> The Node API will be live at `http://localhost:4000`.

### 5. Start Web Application (Next.js)

In a third terminal window:

```bash
npm run dev:web
```

> The web client will run at `http://localhost:3000`.

### 6. Load Chrome Extension

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Toggle **Developer mode** on in the top-right corner.
3. Click **Load unpacked**.
4. Select the `apps/extension` folder in this repository.
5. Visit any [Instagram Reel](https://www.instagram.com/reels/) or [YouTube](https://www.youtube.com/) video. You will see an injected **"Save to SuperSave"** button next to the video actions, or click the extension icon to save directly!

---

## 🧬 14 Dimensions of Video Intelligence

Every video ingested through SuperSave is transformed into a multi-dimensional knowledge model:

| # | Dimension | Description |
|---|---|---|
| **1** | **Executive Summary & TL;DR** | High-level synthesis and one-line punchy takeaway. |
| **2** | **Structured Notes** | Comprehensive markdown documentation formatted with headers, steps, and explanations. |
| **3** | **Key Takeaways** | Bulleted high-value insights extracted directly from speech and visuals. |
| **4** | **Chapter Markers & Timestamps** | Clickable timestamps jump directly to exact seconds in the video embed. |
| **5** | **Code Snippets** | Extracted code shown on screen or dictated, formatted with syntax highlighting. |
| **6** | **Visual Insights** | Breakdown of on-screen OCR text, diagrams, presentation slides, and visible UI tools. |
| **7** | **Detected Resources** | Curated external links, GitHub repositories, books, documentation, and tools mentioned. |
| **8** | **Detected Products** | Brands, hardware, gadgets, ingredients, and items featured. |
| **9** | **Fact & Claim Verification** | Claims made in the video annotated with verification notes and reality checks. |
| **10** | **Action Items** | Concrete steps the user can execute immediately. |
| **11** | **Categorization & Deep Metadata** | Multi-tier categorization (Category, Subcategory, Tags, Keywords, Technologies). |
| **12** | **Personal Notes** | User-editable reflection area synced to the note. |
| **13** | **In-Context AI Q&A** | Chat with the video content using semantic context and optional Google Search grounding. |
| **14** | **Multi-Language Translation** | Instant multilingual translation of summaries and notes into over 10 languages. |

---

## 🔌 API Reference

### Node API Gateway (`:4000`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | API health check status |
| `GET` | `/api/content` | List all saved items (supports `?q=` search query) |
| `GET` | `/api/content/:id` | Fetch detailed note and all 14 intelligence fields |
| `POST` | `/api/content` | Ingest new URL (`{ "url": "...", "mode": "video_lowres" \| "audio_fast" }`) |
| `PATCH` | `/api/content/:id/notes` | Update personal user notes (`{ "personalNote": "..." }`) |
| `POST` | `/api/content/:id/qa` | Ask questions (`{ "question": "...", "search_mode": "note_only" \| "note_and_web" }`) |
| `POST` | `/api/content/:id/translate` | Translate note (`{ "language": "Spanish" }`) |

### FastAPI AI Service (`:8000`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Check FastAPI status, Gemini API key presence, and active model |
| `POST` | `/metadata` | Ultra-fast (<400ms) metadata retrieval (title, thumbnail, category) |
| `POST` | `/extract` | Media download, Gemini Files API upload, and deep 14-dimension extraction |
| `POST` | `/qa` | Contextual Q&A with optional Google Search grounding tools |
| `POST` | `/translate` | LLM-powered translation into target language |

---

## ⚡ Extraction Modes

When submitting a URL, SuperSave supports two extraction strategies:

1. **`video_lowres` (Default Multimodal)**:
   - Downloads video at max 480p resolution (capped at 50MB).
   - Uploads directly to the Gemini Files API.
   - Analyzes both visual video frames (OCR, diagrams, UI, products) and audio tracks simultaneously.
2. **`audio_fast` (Ultra-Fast Audio)**:
   - Downloads only the lightweight `.m4a` / audio stream.
   - Drastically cuts download, upload, and token processing time.
   - Best for podcasts, lectures, talking-head shorts, and audio-centric discussions.

---

## 🗺 Roadmap & MVP Progress

- [x] Modern Next.js Dashboard with rich dark theme & responsive layout
- [x] In-page "Save to SuperSave" buttons for Instagram Reels & YouTube
- [x] Manifest V3 Chrome Extension (popup, context menu, storage)
- [x] Fast metadata fetch (<400ms) for instant UI feedback
- [x] Multimodal video pipeline via `yt-dlp` and Google Gemini Files API
- [x] 14 intelligence dimensions extraction
- [x] In-context Q&A with Google Search grounding
- [x] Dynamic multi-language note translation
- [x] Collections, tag filtering, and full-text search
- [ ] Persistent PostgreSQL database adapter (`services/api/db/schema.sql`)
- [ ] User authentication (OAuth2 with Google)
- [ ] Mobile companion PWA and iOS Share Extension

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
