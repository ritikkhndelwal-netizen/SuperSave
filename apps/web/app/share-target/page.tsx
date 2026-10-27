'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

function ShareTargetContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [status, setStatus] = useState<'parsing' | 'saving' | 'success' | 'error'>('parsing');
  const [extractedUrl, setExtractedUrl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [savedId, setSavedId] = useState<string>('');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setStatus('error');
      setErrorMessage('Please log in to SuperSave first to save content to your personal library.');
      return;
    }

    const rawUrl = searchParams.get('url') || '';
    const rawText = searchParams.get('text') || '';
    const rawTitle = searchParams.get('title') || '';

    // Regex to extract valid HTTP/HTTPS URL from text or url parameter
    const combined = `${rawUrl} ${rawText}`.trim();
    const urlMatch = combined.match(/https?:\/\/[^\s<>"'\)]+/i);

    if (urlMatch) {
      const targetUrl = urlMatch[0];
      setExtractedUrl(targetUrl);
      saveContent(targetUrl, rawTitle);
    } else {
      setStatus('error');
      setErrorMessage('No valid URL found in the shared content. Make sure to share a link from Instagram, YouTube, or browser.');
    }
  }, [searchParams, user, authLoading]);

  async function saveContent(url: string, title?: string) {
    setStatus('saving');
    try {
      const res = await apiFetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          client_meta: title ? { title } : undefined,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || `Failed to save (Status ${res.status})`);
      }

      setStatus('success');
      const id = data?.item?.id;
      if (id) {
        setSavedId(id);
        setTimeout(() => {
          router.push(`/note/${id}`);
        }, 1200);
      } else {
        setTimeout(() => {
          router.push('/dashboard?saved=1');
        }, 1200);
      }
    } catch (err: unknown) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Could not connect to SuperSave API.');
    }
  }

  return (
    <main className="share-target-screen" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(circle at top, rgba(124, 58, 237, 0.15), #09090b 80%)',
      color: '#f4f4f5',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '420px',
        width: '100%',
        background: 'rgba(24, 24, 27, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '32px 24px',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #c58cff, #7444d7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#ffffff',
          margin: '0 auto 20px',
          boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)'
        }}>
          S
        </div>

        <h1 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 8px' }}>
          {status === 'saving' && 'Saving to SuperSave…'}
          {status === 'success' && 'Saved to Your Library! 🪄'}
          {status === 'error' && 'Could Not Save'}
          {status === 'parsing' && 'Reading shared link…'}
        </h1>

        <p style={{ fontSize: '13px', color: '#a1a1aa', margin: '0 0 20px', wordBreak: 'break-all' }}>
          {extractedUrl ? extractedUrl : 'Analyzing shared content from your device'}
        </p>

        {status === 'saving' && (
          <div style={{ padding: '16px 0' }}>
            <div style={{
              width: '36px',
              height: '36px',
              border: '3px solid rgba(124, 58, 237, 0.2)',
              borderTopColor: '#a855f7',
              borderRadius: '50%',
              margin: '0 auto 12px',
              animation: 'spin 0.8s linear infinite'
            }} />
            <span style={{ fontSize: '12px', color: '#a855f7', fontWeight: 500 }}>
              Gemini is starting multimodal intelligence extraction…
            </span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {status === 'success' && (
          <div style={{ padding: '12px 0' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.15)',
              color: '#4ade80',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              margin: '0 auto 12px'
            }}>
              ✓
            </div>
            <p style={{ fontSize: '13px', color: '#4ade80', margin: 0 }}>
              Redirecting to your note in a moment…
            </p>
          </div>
        )}

        {status === 'error' && (
          <div style={{ padding: '8px 0' }}>
            <div style={{
              padding: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '12px',
              color: '#f87171',
              fontSize: '13px',
              marginBottom: '16px'
            }}>
              {errorMessage}
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                onClick={() => extractedUrl && saveContent(extractedUrl)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  background: '#7c3aed',
                  color: '#fff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Retry
              </button>
              <Link
                href="/dashboard"
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#e4e4e7',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 500
                }}
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ShareTargetPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b', color: '#fff' }}>
        Opening SuperSave…
      </div>
    }>
      <ShareTargetContent />
    </Suspense>
  );
}
