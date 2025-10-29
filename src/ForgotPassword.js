// src/ForgotPassword.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from './api/axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');       // success/info
  const [err, setErr] = useState('');       // error (rare)
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(''); setErr('');
    if (!email) return setErr('Please enter your email.');

    try {
      setBusy(true);
      await api.post('/api/auth/forgot-password', { email: email.trim().toLowerCase() });
      // Always show the generic success copy; do NOT navigate
      setMsg('If that email exists, a reset link has been sent. Check your inbox.');
    } catch (e2) {
      // Backend returns 200 even on unknown email, but just in case:
      const m = e2?.response?.data?.message || e2?.message || 'Something went wrong';
      setErr(m);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#FFF8E1' }}>
      <form onSubmit={handleSubmit} style={{
        width: 560, maxWidth: '92vw',
        background: '#E5BC3F', borderRadius: 18,
        boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
        padding: 24, boxSizing: 'border-box'
      }}>
        <h2 style={{ textAlign: 'center', margin: '6px 0 18px', fontWeight: 800 }}>
          Forgot your password?
        </h2>

        <p style={{ textAlign: 'center', marginTop: -8, marginBottom: 14, opacity: 0.9 }}>
          Enter your email and we’ll send you a reset link.
        </p>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          style={{
            display: 'block', width: '100%',
            margin: '0 0 12px 0', padding: 14,
            borderRadius: 10, border: '1px solid #ddd', background: '#fff',
            boxSizing: 'border-box', outline: 'none'
          }}
        />

        <button
          type="submit"
          disabled={busy}
          style={{
            display: 'block', width: '100%',
            padding: '13px 18px', borderRadius: 12, border: 'none',
            background: '#000', color: '#fff', fontWeight: 800,
            cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.8 : 1
          }}
        >
          {busy ? 'Sending…' : 'Send Reset Link'}
        </button>

        {msg && <p style={{ color: '#0a0', fontWeight: 700, marginTop: 14 }}>✔ {msg}</p>}
        {err && <p style={{ color: '#c00', fontWeight: 700, marginTop: 14 }}>✘ {err}</p>}

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{
              flex: 1, padding: '10px 12px', borderRadius: 10,
              border: '1px solid #111', background: '#111', color: '#fff', fontWeight: 700
            }}
          >
            Home / Login
          </button>
          <button
            type="button"
            onClick={() => navigate('/signup')}
            style={{
              flex: 1, padding: '10px 12px', borderRadius: 10,
              border: '1px solid #111', background: '#fff', color: '#111', fontWeight: 700
            }}
          >
            Sign Up
          </button>
        </div>
      </form>
    </div>
  );
}
