'use client';

import { useState, useEffect, useRef } from 'react';
import type { SavedContent } from '../lib/types';
import { MarkdownView } from './MarkdownView';

function resolveResourceUrl(reference?: string, name?: string): string {
  const ref = (reference || '').trim();
  const title = (name || '').trim();
  if (ref.startsWith('http://') || ref.startsWith('https://')) {
    return ref;
  }
  if (
    ref.startsWith('www.') ||
    ref.includes('.com') ||
    ref.includes('.org') ||
    ref.includes('.io') ||
    ref.includes('.dev') ||
    ref.includes('.net') ||
    ref.includes('.co')
  ) {
    return `https://${ref.replace(/^\/\//, '')}`;
  }
  if (ref.startsWith('github.com') || ref.startsWith('gitlab.com')) {
    return `https://${ref}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(`${title} ${ref}`.trim())}`;
}

export function NoteClient({ item: initialItem }: { item: SavedContent }) {
  const [item, setItem] = useState<SavedContent>(initialItem);
  const [personalNote, setPersonalNote] = useState(initialItem.personalNote);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveState, setSaveState] = useState('');

  // Q&A Search Mode: 'note_only' | 'note_and_web'
  const [qaSearchMode, setQaSearchMode] = useState<'note_only' | 'note_and_web'>('note_only');
  const [qaSources, setQaSources] = useState<{ title: string; url: string }[]>([]);

  // Active Tab: 'notes' | 'chapters' | 'code' | 'visuals' | 'actions' | 'resources'
  const [activeTab, setActiveTab] = useState<'notes' | 'chapters' | 'code' | 'visuals' | 'actions' | 'resources'>('notes');

  // Translation State
  const [selectedLang, setSelectedLang] = useState('Hindi');
  const [translating, setTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);

  // Action Items Checkbox state
  const [checkedActions, setCheckedActions] = useState<Record<number, boolean>>({});

  // Copied snippet state
  const [copiedSnippet, setCopiedSnippet] = useState<number | null>(null);

  // Iframe player reference for interactive seeking
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Seek video to exact second
  const seekTo = (seconds: number) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'seekTo', args: [seconds, true] }),
        '*'
      );
      iframeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Live polling if the item is still processing
  useEffect(() => {
    if (item.status !== 'processing') return;

    const interval = window.setInterval(() => {
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      fetch(`${api}/api/content/${item.id}`)
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((data: { item: SavedContent }) => {
          if (data.item) {
            setItem(data.item);
            if (data.item.personalNote && !personalNote) {
              setPersonalNote(data.item.personalNote);
            }
          }
        })
        .catch(() => {});
    }, 2500);

    return () => clearInterval(interval);
  }, [item.id, item.status, personalNote]);

  async function savePersonalNote() {
    setSaveState('Saving…');
    try {
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${api}/api/content/${item.id}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personalNote }),
      });
      if (!response.ok) throw new Error('Unable to save');
      setSaveState('Saved ✓');
      window.setTimeout(() => setSaveState(''), 1500);
    } catch {
      setSaveState('Saved locally');
    }
  }

  async function ask() {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer('');
    setQaSources([]);
    try {
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${api}/api/content/${item.id}/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, search_mode: qaSearchMode }),
      });
      const data = await response.json();
      setAnswer(data.answer || 'No answer returned.');
      if (Array.isArray(data.sources)) {
        setQaSources(data.sources);
      }
    } catch {
      setAnswer('The AI service is temporarily offline. Make sure FastAPI is running on port 8000.');
    } finally {
      setLoading(false);
    }
  }

  async function handleTranslate() {
    setTranslating(true);
    try {
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${api}/api/content/${item.id}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: selectedLang }),
      });
      if (!response.ok) throw new Error('Translation failed');
      const data = await response.json();
      setTranslatedText(data.translated_text);
    } catch (err) {
      alert('Translation service unavailable. Ensure FastAPI is running.');
    } finally {
      setTranslating(false);
    }
  }

  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(index);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const isProcessing = item.status === 'processing';

  // Format content-type label
  const formatContentType = (type?: string) => {
    switch (type) {
      case 'code_tutorial':
        return '💻 Code Tutorial';
      case 'recipe':
        return '🍳 Recipe & Cooking';
      case 'fitness':
        return '🏋️ Fitness & Form';
      case 'review':
        return '📦 Product Review';
      case 'lecture':
        return '🎓 Educational Lecture';
      case 'podcast':
        return '🎙️ Podcast / Interview';
      case 'business':
        return '📈 Business & Marketing';
      default:
        return '✦ Video Knowledge';
    }
  };

  return (
    <>
      <header className="note-header">
        <div>
          <div className="card-meta" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className="badge-content-type">{formatContentType(item.content_type)}</span>
            <span>{item.category}</span>
            {item.subcategory && <span style={{ color: '#baa0dc' }}>• {item.subcategory}</span>}
            <span>Saved {item.savedAt}</span>
            {isProcessing && (
              <span style={{ color: '#ffd56b', fontWeight: 700 }}>
                ● GEMINI ANALYZING 14 DIMENSIONS
              </span>
            )}
          </div>
          <h1>{item.title}</h1>
          <p>{item.summary}</p>
          <div className="tag-row large">
            {(item.tags || []).map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        </div>
        <button className="secondary-button">☆ Favorite</button>
      </header>

      {isProcessing && (
        <div
          style={{
            margin: '0 0 24px',
            padding: '14px 18px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(85,32,150,0.3), rgba(30,20,50,0.5))',
            border: '1px solid #5a3a8a',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span className="pulse-dot" style={{ width: '10px', height: '10px' }} />
          <div>
            <strong style={{ fontSize: '13px', color: '#f0e6fa' }}>
              Gemini Multimodal Engine is extracting 14-dimension intelligence...
            </strong>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#b9a8cf' }}>
              Analyzing video frames, OCR slides, code snippets, interactive chapters, and facts. Notes will populate automatically.
            </p>
          </div>
        </div>
      )}

      {/* Multilingual Translation Bar */}
      <div className="translate-bar">
        <span style={{ fontSize: '12px', color: '#c3b5d6' }}>🌐 Multilingual Translation:</span>
        <select
          className="translate-select"
          value={selectedLang}
          onChange={(e) => setSelectedLang(e.target.value)}
        >
          <option value="Hindi">Hindi (हिन्दी)</option>
          <option value="Spanish">Spanish (Español)</option>
          <option value="French">French (Français)</option>
          <option value="German">German (Deutsch)</option>
          <option value="Japanese">Japanese (日本語)</option>
          <option value="Portuguese">Portuguese (Português)</option>
          <option value="Arabic">Arabic (العربية)</option>
          <option value="English">Original English</option>
        </select>
        <button className="secondary-button" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={handleTranslate}>
          {translating ? 'Translating…' : `Translate to ${selectedLang}`}
        </button>
        {translatedText && (
          <button
            className="text-button"
            style={{ fontSize: '11px', marginLeft: 'auto' }}
            onClick={() => setTranslatedText(null)}
          >
            Reset to Original ↺
          </button>
        )}
      </div>

      <div className="note-layout">
        <div className="note-main">
          {/* Feature 1: Video Player Embed */}
          {item.embed_url ? (
            <div className="video-player-container">
              <iframe
                ref={iframeRef}
                src={item.embed_url}
                title={item.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div
              className="video-placeholder"
              style={{
                backgroundImage: item.thumbnail
                  ? `linear-gradient(180deg, rgba(10,6,16,.15), rgba(10,6,16,.8)), url(${item.thumbnail})`
                  : undefined,
              }}
            >
              <div className="play-button">▶</div>
              <span className="video-label">
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noreferrer" style={{ color: '#fff' }}>
                    Open Original on {item.source} ↗
                  </a>
                ) : (
                  'Video preview'
                )}
              </span>
            </div>
          )}

          {/* Intelligence Navigation Tabs */}
          <nav className="intelligence-tabs">
            <button
              className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
              onClick={() => setActiveTab('notes')}
            >
              📝 Notes & Overview
            </button>
            <button
              className={`tab-btn ${activeTab === 'chapters' ? 'active' : ''}`}
              onClick={() => setActiveTab('chapters')}
            >
              ⏱️ Chapters ({item.chapters?.length || 0})
            </button>
            {(item.code_snippets || []).length > 0 && (
              <button
                className={`tab-btn ${activeTab === 'code' ? 'active' : ''}`}
                onClick={() => setActiveTab('code')}
              >
                💻 Code Snippets ({item.code_snippets?.length})
              </button>
            )}
            <button
              className={`tab-btn ${activeTab === 'visuals' ? 'active' : ''}`}
              onClick={() => setActiveTab('visuals')}
            >
              👁️ Visual Intelligence
            </button>
            {(item.action_items || []).length > 0 && (
              <button
                className={`tab-btn ${activeTab === 'actions' ? 'active' : ''}`}
                onClick={() => setActiveTab('actions')}
              >
                ☑️ Action Items ({item.action_items?.length})
              </button>
            )}
            <button
              className={`tab-btn ${activeTab === 'resources' ? 'active' : ''}`}
              onClick={() => setActiveTab('resources')}
            >
              🔗 Resources & Facts
            </button>
          </nav>

          {/* TAB 1: Structured AI Notes */}
          {activeTab === 'notes' && (
            <section className="note-section" style={{ marginTop: '0' }}>
              {translatedText ? (
                <div style={{ marginBottom: '16px' }}>
                  <div className="section-label" style={{ color: '#ba82ff' }}>
                    TRANSLATED INTELLIGENCE ({selectedLang.toUpperCase()})
                  </div>
                  <article className="markdown-card" style={{ borderColor: '#6e44b8' }}>
                    <MarkdownView content={translatedText} />
                  </article>
                </div>
              ) : (
                <>
                  {item.summary_detail && (
                    <div style={{ marginBottom: '18px', padding: '14px 18px', borderRadius: '12px', background: '#14101c', border: '1px solid #282133' }}>
                      <div className="section-label" style={{ color: '#c795ff' }}>EXECUTIVE TL;DR</div>
                      <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#e5dcf1', lineHeight: '1.5' }}>
                        {item.summary_detail.tldr}
                      </p>
                    </div>
                  )}

                  <div className="section-label">AI STRUCTURED NOTES</div>
                  <article className="markdown-card">
                    {item.notes ? (
                      <MarkdownView content={item.notes} />
                    ) : (
                      <p style={{ color: '#8c8496', fontStyle: 'italic' }}>
                        {isProcessing ? 'Generating timestamped notes from video...' : 'No notes available.'}
                      </p>
                    )}
                  </article>
                </>
              )}
            </section>
          )}

          {/* TAB 2: AI Chapters / Timeline Indexing */}
          {activeTab === 'chapters' && (
            <section className="note-section" style={{ marginTop: '0' }}>
              <div className="section-label">INTERACTIVE VIDEO CHAPTERS</div>
              <p className="muted" style={{ fontSize: '12px', margin: '4px 0 14px' }}>
                Click any chapter timestamp to immediately jump the video to that moment.
              </p>
              <div className="chapters-grid">
                {(item.chapters || []).map((ch, idx) => (
                  <div key={idx} className="chapter-item" onClick={() => seekTo(ch.seconds)}>
                    <button type="button" className="chapter-time-btn">
                      ▶ {ch.timestamp}
                    </button>
                    <div>
                      <h4 className="chapter-title">{ch.title}</h4>
                      <p className="chapter-summary">{ch.summary}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* TAB 3: Code Extraction */}
          {activeTab === 'code' && (
            <section className="note-section" style={{ marginTop: '0' }}>
              <div className="section-label">DETECTED CODE & COMMANDS</div>
              <p className="muted" style={{ fontSize: '12px', margin: '4px 0 14px' }}>
                Extracted directly from on-screen video frames with syntax highlighting.
              </p>
              {(item.code_snippets || []).map((cs, idx) => (
                <div key={idx} className="code-card">
                  <div className="code-header">
                    <div>
                      <span className="code-lang">{cs.language}</span>
                      <strong style={{ marginLeft: '10px', color: '#f0e6fa' }}>{cs.title}</strong>
                      {cs.timestamp && (
                        <button
                          type="button"
                          className="chapter-time-btn"
                          style={{ marginLeft: '10px', padding: '2px 6px', fontSize: '10px' }}
                          onClick={() => {
                            const [m, s] = cs.timestamp!.split(':').map(Number);
                            seekTo((m || 0) * 60 + (s || 0));
                          }}
                        >
                          At {cs.timestamp}
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      className="copy-code-btn"
                      onClick={() => copyCode(cs.code, idx)}
                    >
                      {copiedSnippet === idx ? '✓ Copied' : '📋 Copy code'}
                    </button>
                  </div>
                  <pre className="code-pre">
                    <code>{cs.code}</code>
                  </pre>
                </div>
              ))}
            </section>
          )}

          {/* TAB 4: Visual Understanding */}
          {activeTab === 'visuals' && (
            <section className="note-section" style={{ marginTop: '0' }}>
              <div className="section-label">MULTIMODAL VISUAL UNDERSTANDING</div>
              <p className="muted" style={{ fontSize: '12px', margin: '4px 0 14px' }}>
                Detected by Gemini analyzing the visual video frames.
              </p>
              <div className="visual-grid">
                <div className="visual-category-card">
                  <strong>💬 Text on Screen (OCR)</strong>
                  <div className="visual-tag-list">
                    {(item.visual_insights?.on_screen_text || []).length > 0 ? (
                      item.visual_insights!.on_screen_text.map((txt, i) => (
                        <span key={i} className="visual-tag">{txt}</span>
                      ))
                    ) : (
                      <span style={{ fontSize: '11px', color: '#777' }}>No on-screen text detected</span>
                    )}
                  </div>
                </div>

                <div className="visual-category-card">
                  <strong>📊 Diagrams, Slides & UI</strong>
                  <div className="visual-tag-list">
                    {(item.visual_insights?.diagrams_or_slides || []).concat(
                      item.visual_insights?.tools_or_ui_shown || []
                    ).length > 0 ? (
                      item.visual_insights!.diagrams_or_slides.concat(
                        item.visual_insights!.tools_or_ui_shown
                      ).map((d, i) => (
                        <span key={i} className="visual-tag">{d}</span>
                      ))
                    ) : (
                      <span style={{ fontSize: '11px', color: '#777' }}>None detected</span>
                    )}
                  </div>
                </div>

                <div className="visual-category-card">
                  <strong>📦 Objects & Ingredients</strong>
                  <div className="visual-tag-list">
                    {(item.visual_insights?.objects_or_ingredients || []).length > 0 ? (
                      item.visual_insights!.objects_or_ingredients.map((obj, i) => (
                        <span key={i} className="visual-tag">{obj}</span>
                      ))
                    ) : (
                      <span style={{ fontSize: '11px', color: '#777' }}>None detected</span>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* TAB 5: Action Items Checklist */}
          {activeTab === 'actions' && (
            <section className="note-section" style={{ marginTop: '0' }}>
              <div className="section-label">ACTIONABLE TO-DO CHECKLIST</div>
              <p className="muted" style={{ fontSize: '12px', margin: '4px 0 14px' }}>
                Check off tasks and action items from this video as you accomplish them.
              </p>
              <div className="checklist-card">
                {(item.action_items || []).map((action, idx) => {
                  const isDone = !!checkedActions[idx];
                  return (
                    <label
                      key={idx}
                      className={`checklist-item ${isDone ? 'done' : ''}`}
                      onClick={() => setCheckedActions((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                    >
                      <input
                        type="checkbox"
                        className="checklist-checkbox"
                        checked={isDone}
                        onChange={() => {}}
                      />
                      <span>{action}</span>
                    </label>
                  );
                })}
              </div>
            </section>
          )}

          {/* TAB 6: Resources, Products & Fact Checks */}
          {activeTab === 'resources' && (
            <section className="note-section" style={{ marginTop: '0' }}>
              <div className="section-label">DETECTED RESOURCES & EXTERNAL TOOLS</div>
              <div className="resource-list" style={{ marginBottom: '20px' }}>
                {(item.detected_resources || []).length > 0 ? (
                  item.detected_resources!.map((res, i) => {
                    const url = resolveResourceUrl(res.reference, res.name);
                    const isDirect = res.reference?.trim().startsWith('http') || res.reference?.includes('.');
                    return (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="resource-chip clickable-chip"
                        title={isDirect ? `Open ${res.reference}` : `Search ${res.name} on Google`}
                      >
                        {res.type === 'github' ? '🐙' : res.type === 'book' ? '📖' : '🔗'}
                        <strong>{res.name}</strong>
                        {res.reference && <small style={{ color: '#baa8d6' }}>({res.reference})</small>}
                        <span className="chip-external-icon">↗</span>
                      </a>
                    );
                  })
                ) : (
                  <p style={{ color: '#888', fontSize: '12px' }}>No external resources detected in this content.</p>
                )}
              </div>

              {(item.detected_products || []).length > 0 && (
                <>
                  <div className="section-label">DETECTED PRODUCTS & BRANDS</div>
                  <div className="resource-list" style={{ marginBottom: '20px' }}>
                    {item.detected_products!.map((prod, i) => (
                      <a
                        key={i}
                        href={`https://www.google.com/search?q=${encodeURIComponent(`${prod.brand} ${prod.name}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="resource-chip clickable-chip"
                        style={{ background: '#181324' }}
                        title={`Explore ${prod.brand} ${prod.name} on Google`}
                      >
                        🏷️ <strong>{prod.brand}</strong> {prod.name}
                        {prod.category && <small style={{ color: '#a295b9' }}>• {prod.category}</small>}
                        <span className="chip-external-icon">↗</span>
                      </a>
                    ))}
                  </div>
                </>
              )}

              {(item.facts_and_claims || []).length > 0 && (
                <>
                  <div className="section-label">FACTS & CLAIMS CONTEXT CHECK</div>
                  {item.facts_and_claims!.map((fc, i) => (
                    <div key={i} className="claim-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                        <p className="claim-text">⚖️ Claim: &ldquo;{fc.claim}&rdquo;</p>
                        <a
                          href={`https://www.google.com/search?q=${encodeURIComponent(`fact check ${fc.claim}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="claim-verify-link"
                          title="Verify claim on Google"
                        >
                          Verify ↗
                        </a>
                      </div>
                      <p className="claim-note">💡 Reality Check: {fc.verification_note}</p>
                    </div>
                  ))}
                </>
              )}
            </section>
          )}

          {/* Personal Notes Section */}
          <section className="note-section">
            <div className="section-label">MY PERSONAL NOTES & OBSERVATIONS</div>
            <textarea
              className="personal-notes"
              value={personalNote}
              onChange={(e) => setPersonalNote(e.target.value)}
              placeholder="Add what you want to remember, personal observations, or action items…"
            />
            <div className="save-note-row">
              <span>{saveState || 'Keep your own context alongside the AI notes.'}</span>
              <button className="secondary-button" onClick={savePersonalNote}>
                Save note
              </button>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="note-side">
          <div className="side-card">
            <div className="section-label">KEY TAKEAWAYS</div>
            {(item.keyTakeaways || []).length > 0 ? (
              item.keyTakeaways.map((takeaway, index) => (
                <div className="takeaway" key={takeaway}>
                  <span>0{index + 1}</span>
                  <p>{takeaway}</p>
                </div>
              ))
            ) : (
              <p style={{ color: '#888', fontSize: '12px' }}>
                {isProcessing ? 'Extracting takeaways…' : 'None specified.'}
              </p>
            )}
          </div>

          <div className="side-card ai-card">
            <div className="ai-orb">✦</div>
            <div className="section-label">ASK ABOUT THIS VIDEO</div>
            <h3>Talk to your saved knowledge.</h3>

            {/* Q&A Search Mode Toggle */}
            <div className="qa-mode-toggle">
              <button
                type="button"
                className={`qa-mode-btn ${qaSearchMode === 'note_only' ? 'active' : ''}`}
                onClick={() => setQaSearchMode('note_only')}
              >
                🔒 Note Only
              </button>
              <button
                type="button"
                className={`qa-mode-btn ${qaSearchMode === 'note_and_web' ? 'active' : ''}`}
                onClick={() => setQaSearchMode('note_and_web')}
              >
                🌐 Note + Web Search
              </button>
            </div>

            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={
                qaSearchMode === 'note_and_web'
                  ? 'Ask anything! Gemini will combine this video with latest web knowledge & alternatives…'
                  : 'e.g. What were the exact steps mentioned, or at what timestamp is the diagram shown?'
              }
            />
            <button
              className="primary-button wide"
              onClick={ask}
              disabled={loading || isProcessing}
            >
              {loading ? 'Thinking with Gemini…' : qaSearchMode === 'note_and_web' ? 'Ask with Web Search' : 'Ask Note AI'}
            </button>
            {answer && (
              <div className="answer-box">
                <MarkdownView content={answer} />
              </div>
            )}

            {/* Clickable Web Sources */}
            {qaSources.length > 0 && (
              <div className="qa-sources-box">
                <div className="section-label" style={{ fontSize: '10px', marginBottom: '6px' }}>
                  EXPLORE ON WEB & YOUTUBE
                </div>
                <div className="resource-list">
                  {qaSources.map((src, i) => (
                    <a
                      key={i}
                      href={src.url}
                      target="_blank"
                      rel="noreferrer"
                      className="resource-chip"
                      style={{ fontSize: '10px', textDecoration: 'none' }}
                    >
                      🔗 {src.title} ↗
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
