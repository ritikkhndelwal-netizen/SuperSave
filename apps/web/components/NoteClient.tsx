'use client';

import { useState, useEffect } from 'react';
import type { SavedContent } from '../lib/types';

export function NoteClient({ item: initialItem }: { item: SavedContent }) {
  const [item, setItem] = useState<SavedContent>(initialItem);
  const [personalNote, setPersonalNote] = useState(initialItem.personalNote);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveState, setSaveState] = useState('');

  // Live polling if the item is currently processing
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
      setSaveState('Saved locally for demo');
    }
  }

  async function ask() {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer('');
    try {
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${api}/api/content/${item.id}/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await response.json();
      setAnswer(data.answer || 'No answer returned.');
    } catch {
      setAnswer(
        'The AI service is temporarily offline. Make sure the FastAPI service is running on port 8000.'
      );
    } finally {
      setLoading(false);
    }
  }

  const isProcessing = item.status === 'processing';

  return (
    <>
      <header className="note-header">
        <div>
          <div className="card-meta">
            <span>{item.category}</span>
            <span>Saved {item.savedAt}</span>
            {isProcessing && (
              <span style={{ color: '#ffd56b', fontWeight: 700 }}>
                ● GEMINI ANALYZING MEDIA
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
              Gemini is watching & synthesizing this media...
            </strong>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#b9a8cf' }}>
              We captured the initial details instantly. Detailed markdown notes, timestamps, and key takeaways will populate here in a few moments.
            </p>
          </div>
        </div>
      )}

      <div className="note-layout">
        <div className="note-main">
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
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#fff' }}
                >
                  Open Original on {item.source} ↗
                </a>
              ) : (
                'Video preview'
              )}
            </span>
          </div>

          <section className="note-section">
            <div className="section-label">AI STRUCTURED NOTES</div>
            <article className="markdown-card">
              {item.notes ? (
                item.notes.split('\n').map((line, index) => {
                  if (line.startsWith('## '))
                    return (
                      <h2 key={`${line}-${index}`}>
                        {line.replace('## ', '')}
                      </h2>
                    );
                  if (/^\d+\. /.test(line))
                    return (
                      <div className="step" key={`${line}-${index}`}>
                        <span>{line.split('.')[0]}</span>
                        <p>{line.replace(/^\d+\. /, '')}</p>
                      </div>
                    );
                  if (line.startsWith('- '))
                    return (
                      <div className="bullet" key={`${line}-${index}`}>
                        • {line.replace('- ', '')}
                      </div>
                    );
                  return <p key={`${line}-${index}`}>{line || '\u00a0'}</p>;
                })
              ) : (
                <p style={{ color: '#8c8496', fontStyle: 'italic' }}>
                  {isProcessing
                    ? 'Generating timestamped notes from video...'
                    : 'No notes available.'}
                </p>
              )}
            </article>
          </section>

          <section className="note-section">
            <div className="section-label">MY NOTES & ANNOTATIONS</div>
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
            <div className="section-label">ASK ABOUT THIS</div>
            <h3>Talk to your saved knowledge.</h3>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What were the exact steps mentioned?"
            />
            <button
              className="primary-button wide"
              onClick={ask}
              disabled={loading || isProcessing}
            >
              {loading ? 'Thinking with Gemini…' : 'Ask AI'}
            </button>
            {answer && <div className="answer-box">{answer}</div>}
          </div>
        </aside>
      </div>
    </>
  );
}
