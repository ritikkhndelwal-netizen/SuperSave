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
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            background: '#161220',
            border: '1px solid #3b2d50',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '14px',
            padding: '13px',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z"
              fill="#4285F4"
            />
            <path
              d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.859-3.0477.859-2.344 0-4.3282-1.5831-5.036-3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18z"
              fill="#34A853"
            />
            <path
              d="M3.964 10.71c-.18-.54-.2823-1.1168-.2823-1.71s.1023-1.17.2823-1.71V4.9582H.9573A8.9965 8.9965 0 0 0 0 9c0 1.4523.3477 2.8268.9573 4.0418l3.0067-2.3318z"
              fill="#FBBC05"
            />
            <path
              d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.9245 11.426 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1627 6.656 3.5795 9 3.5795z"
              fill="#EA4335"
            />
          </svg>
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
