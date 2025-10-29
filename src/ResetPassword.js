// src/ResetPassword.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { api } from './api/axios';

export default function ResetPassword() {
  const { token: tokenFromParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Accept either /reset-password?token=...&email=... or /reset-password/:token
  const { token, email } = useMemo(() => {
    const qs = new URLSearchParams(location.search);
    return {
      token: tokenFromParam || qs.get('token') || '',
      email: (qs.get('email') || '').toLowerCase(),
    };
  }, [location.search, tokenFromParam]);

  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  // 🚦 If there is no token (user clicked "Reset it" on Login), send them to the email request page
  useEffect(() => {
    if (!token) navigate('/forgot-password', { replace: true });
  }, [token, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    setOk('');

    if (!token) return; // safety
    if (!pwd || pwd.length < 8) return setErr('Password must be at least 8 characters.');
    if (pwd !== pwd2) return setErr('Passwords do not match.');

    try {
      setBusy(true);
      const res = await api.post('/api/auth/reset-password', {
        token,
        email,            // present when coming from the email link; harmless if empty
        newPassword: pwd, // backend expects newPassword
      });

      if (res.status !== 200) throw new Error(res.data?.message || 'Reset failed');

      setOk('Password reset successful! Redirecting to login…');
      setTimeout(() => navigate('/login'), 1000);
    } catch (e2) {
      const msg =
        e2?.response?.data?.message ||
        e2?.response?.data?.error ||
        e2?.message ||
        'Reset failed';
      setErr(/expired|invalid/i.test(msg)
        ? 'Token may be invalid or expired. Please request a new link.'
        : `Error resetting password. ${msg}`);
    } finally {
      setBusy(false);
    }
  }

  // ===== UI (consistent with your Login card; inputs sit fully inside the gold panel) =====
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#FFF8E1' }}>
      <form onSubmit={handleSubmit} style={{
        width: 760,
        maxWidth: '92vw',
        background: '#E5BC3F',
        borderRadius: 18,
        boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
        padding: 24,
        boxSizing: 'border-box'
      }}>
        <h2 style={{ textAlign: 'center', margin: '6px 0 18px', fontWeight: 800 }}>
          Reset Your Password
        </h2>

        {!!email && (
          <p style={{ textAlign: 'center', marginTop: -8, marginBottom: 14, opacity: 0.85 }}>
            for <strong>{email}</strong>
          </p>
        )}

        <input
          type={show ? 'text' : 'password'}
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          placeholder="New password"
          style={{
            display: 'block',
            width: '100%',
            margin: '0 0 12px 0',
            padding: 14,
            borderRadius: 10,
            border: '1px solid #ddd',
            outline: 'none',
            boxSizing: 'border-box',
            background: '#fff'
          }}
        />

        <input
          type={show ? 'text' : 'password'}
          value={pwd2}
          onChange={(e) => setPwd2(e.target.value)}
          placeholder="Confirm new password"
          style={{
            display: 'block',
            width: '100%',
            margin: '0 0 12px 0',
            padding: 14,
            borderRadius: 10,
            border: '1px solid #ddd',
            outline: 'none',
            boxSizing: 'border-box',
            background: '#fff'
          }}
        />

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 14px 0' }}>
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
          <span>Show Password</span>
        </label>

        <button
          type="submit"
          disabled={busy}
          style={{
            display: 'block',
            width: '100%',
            padding: '13px 18px',
            borderRadius: 12,
            border: 'none',
            background: '#000',
            color: '#fff',
            fontWeight: 800,
            cursor: busy ? 'not-allowed' : 'pointer',
            opacity: busy ? 0.8 : 1
          }}
        >
          {busy ? 'Working…' : 'Reset Password'}
        </button>

        {err && <p style={{ color: '#c00', fontWeight: 700, marginTop: 14 }}>✘ {err}</p>}
        {ok  && <p style={{ color: '#0a0', fontWeight: 700, marginTop: 14 }}>✔ {ok}</p>}
      </form>
    </div>
  );
}
