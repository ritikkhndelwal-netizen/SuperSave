'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { SavedContent } from '../lib/types';

export function DashboardClient({ items: initialItems }: { items: SavedContent[] }) {
  const [items, setItems] = useState<SavedContent[]>(initialItems);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [showAdd, setShowAdd] = useState(false);
  const [url, setUrl] = useState('');
  const [message, setMessage] = useState('');
  const [extractionMode, setExtractionMode] = useState<'video_lowres' | 'audio_fast'>('video_lowres');

  // Load user preference for extraction mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('supersave_extraction_mode');
    if (saved === 'audio_fast' || saved === 'video_lowres') {
      setExtractionMode(saved);
    }
  }, []);

  const handleModeChange = (mode: 'video_lowres' | 'audio_fast') => {
    setExtractionMode(mode);
    localStorage.setItem('supersave_extraction_mode', mode);
  };

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const haystack = `${item.title} ${item.summary} ${item.notes} ${(item.tags || []).join(' ')}`.toLowerCase();
      const matchText = haystack.includes(query.toLowerCase());
      const matchCategory = category === 'All' || item.category === category;
      return matchText && matchCategory;
    });
  }, [items, query, category]);

  const categories = ['All', ...Array.from(new Set(items.map((i) => i.category).filter(Boolean)))];

  // Initial fetch from API
  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    fetch(`${api}/api/content`)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { items: SavedContent[] }) => {
        if (data.items && data.items.length) {
          setItems(data.items);
        }
      })
      .catch(() => setItems(initialItems));
  }, [initialItems]);

  // Polling mechanism: If any item is in 'processing' status, poll every 3s until ready
  useEffect(() => {
    const hasProcessing = items.some((item) => item.status === 'processing');
    if (!hasProcessing) return;

    const interval = window.setInterval(() => {
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      fetch(`${api}/api/content`)
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((data: { items: SavedContent[] }) => {
          if (data.items) {
            setItems(data.items);
          }
        })
        .catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
  }, [items]);

  async function saveUrl() {
    if (!url.trim()) return;
    setMessage('Capturing metadata & starting Gemini multimodal analysis…');
    try {
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${api}/api/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), mode: extractionMode }),
      });

      if (!response.ok) throw new Error('Unable to save');
      const data = await response.json();

      // Immediately prepend the returned item so user sees thumbnail + title instantly
      setItems((current) => [
        {
          ...data.item,
          savedAt: 'Just now',
          status: 'processing',
        },
        ...current.filter((i) => i.id !== data.item.id),
      ]);

      setMessage(
        extractionMode === 'audio_fast'
          ? 'Saved! Audio extracted & Gemini analyzing…'
          : 'Saved! 480p video stream downloaded & Gemini analyzing…'
      );
      setUrl('');
      setTimeout(() => setShowAdd(false), 1200);
    } catch {
      setMessage('Captured locally for demo. Connect the API to process live.');
    }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">YOUR KNOWLEDGE LIBRARY</div>
          <h1>Good evening, Ritik.</h1>
          <p className="muted">Turn the things you save into things you remember.</p>
        </div>
        <button className="primary-button" onClick={() => setShowAdd(true)}>
          + Save content
        </button>
      </header>

      <section className="hero-stat-grid">
        <div className="stat-card accent">
          <span>Saved content</span>
          <strong>{items.length}</strong>
          <small>Across your library</small>
        </div>
        <div className="stat-card">
          <span>AI notes</span>
          <strong>{items.filter((i) => i.status !== 'processing').length}</strong>
          <small>Ready to revisit</small>
        </div>
        <div className="stat-card">
          <span>Topics</span>
          <strong>{Math.max(categories.length - 1, 1)}</strong>
          <small>Auto-detected by Gemini</small>
        </div>
      </section>

      <section className="toolbar">
        <div className="search-box">
          <span>⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your saved knowledge…"
          />
        </div>
        <div className="chip-row">
          {categories.map((item) => (
            <button
              key={item}
              className={`chip ${category === item ? 'selected' : ''}`}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="section-head">
        <div>
          <h2>Recently saved</h2>
          <span>{filtered.length} items</span>
        </div>
        <button className="text-button" onClick={() => setCategory('All')}>
          View all →
        </button>
      </section>

      <section className="content-grid">
        {filtered.map((item) => (
          <Link href={`/note/${item.id}`} key={item.id} className="content-card">
            <div
              className="thumbnail"
              style={{
                backgroundImage: item.thumbnail
                  ? `linear-gradient(180deg, rgba(13,7,20,.1), rgba(13,7,20,.85)), url(${item.thumbnail})`
                  : undefined,
              }}
            >
              <span className="source-pill">{item.source}</span>
              {item.duration && <span className="duration-pill">{item.duration}</span>}
              {item.status === 'processing' && (
                <span className="processing-pill">
                  <span className="pulse-dot" />
                  Gemini Analyzing...
                </span>
              )}
            </div>
            <div className="card-body">
              <div className="card-meta">
                <span>{item.category}</span>
                <span>{item.savedAt || 'Recently'}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
              <div className="tag-row">
                {(item.tags || []).slice(0, 3).map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </section>

      {showAdd && (
        <div className="modal-backdrop" onMouseDown={() => setShowAdd(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAdd(false)}>
              ×
            </button>
            <div className="eyebrow">QUICK CAPTURE</div>
            <h2>Save something useful.</h2>
            <p className="muted">
              Paste a Reel, YouTube, or article URL. We will save its details immediately and extract structured knowledge using Gemini.
            </p>

            <input
              className="modal-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... or https://instagram.com/reel/..."
              autoFocus
            />

            <div style={{ marginTop: '10px' }}>
              <div className="eyebrow" style={{ fontSize: '10px', marginBottom: '6px' }}>
                AI EXTRACTION SETTING
              </div>
              <div className="mode-toggle-group">
                <button
                  type="button"
                  className={`mode-btn ${extractionMode === 'video_lowres' ? 'active' : ''}`}
                  onClick={() => handleModeChange('video_lowres')}
                >
                  <strong>🎬 Visual Mode (480p Video)</strong>
                  <small>Multimodal: watches visual slides, text, diagrams, and video edits</small>
                </button>
                <button
                  type="button"
                  className={`mode-btn ${extractionMode === 'audio_fast' ? 'active' : ''}`}
                  onClick={() => handleModeChange('audio_fast')}
                >
                  <strong>⚡ Fast Mode (Audio Track)</strong>
                  <small>Fastest extraction (~3s). Best for talks, lectures, and narrated reels</small>
                </button>
              </div>
            </div>

            <button className="primary-button wide" onClick={saveUrl}>
              Save & Analyze with Gemini
            </button>
            {message && <div className="status-message">{message}</div>}
            <div className="modal-tip">
              Tip: The SuperSave browser extension also lets you save with 1 click directly inside YouTube or Instagram.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
