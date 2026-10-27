'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  async function handleGoogleLogin() {
    setErrorMsg('');
    setSubmitting(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setErrorMsg(error.message);
      setSubmitting(false);
    }
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);

    if (mode === 'signup') {
      const { error } = await signUpWithEmail(email, password, name);
      setSubmitting(false);
      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Account created! Check your email to confirm or log in directly.');
        setMode('login');
      }
    } else {
      const { error } = await signInWithEmail(email, password);
      setSubmitting(false);
      if (error) {
        setErrorMsg(error.message);
      } else {
        router.push('/dashboard');
      }
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-glow" />
      <div className="auth-card">
        <Link href="/dashboard" className="brand auth-brand">
          <span className="brand-mark">S</span>
          <span>SuperSave</span>
        </Link>
        <div className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'CREATE YOUR LIBRARY'}</div>
        <h1>
          {mode === 'login'
            ? 'Your saved content, waiting for you.'
            : 'Build a knowledge library from what you save.'}
        </h1>
        <p className="muted">
          Capture from Instagram, YouTube & the web, turn content into notes, then ask questions.
        </p>

        {errorMsg && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#f87171',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              color: '#4ade80',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {successMsg}
          </div>
        )}

        <button
          className="google-button"
          onClick={handleGoogleLogin}
          disabled={submitting}
          type="button"
        >
          <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#ea4335' }}>G</span>
          <span>Continue with Google</span>
        </button>

        <div className="divider">
          <span>or</span>
        </div>

        <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === 'signup' && (
            <label>
              Full name
              <input
                type="text"
                placeholder="Ritik Khandelwal"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button
            className="primary-button wide"
            type="submit"
            disabled={submitting}
            style={{ marginTop: '6px' }}
          >
            {submitting ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create free account'}
          </button>
        </form>

        <button
          className="switch-auth"
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setErrorMsg('');
            setSuccessMsg('');
          }}
        >
          {mode === 'login'
            ? 'Need an account? Create a free account →'
            : 'Already have an account? Log in →'}
        </button>
      </div>
    </main>
  );
}
