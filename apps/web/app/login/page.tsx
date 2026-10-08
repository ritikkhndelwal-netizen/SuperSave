'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  return <main className="auth-page">
    <div className="auth-glow" />
    <div className="auth-card">
      <Link href="/dashboard" className="brand auth-brand"><span className="brand-mark">R</span><span>ReelMind</span></Link>
      <div className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'CREATE YOUR LIBRARY'}</div>
      <h1>{mode === 'login' ? 'Your saved content, waiting for you.' : 'Build a knowledge library from what you save.'}</h1>
      <p className="muted">Capture from the web, turn content into notes, then ask your own library questions.</p>
      <button className="google-button" onClick={() => setMode('login')}>G <span>Continue with Google</span></button>
      <div className="divider"><span>or</span></div>
      <label>Email<input placeholder="you@example.com" /></label>
      <label>Password<input type="password" placeholder="••••••••" /></label>
      <button className="primary-button wide">{mode === 'login' ? 'Log in' : 'Create account'}</button>
      <button className="switch-auth" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>{mode === 'login' ? 'Create a free account →' : 'Already have an account? Log in →'}</button>
    </div>
  </main>;
}
