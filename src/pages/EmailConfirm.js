// src/pages/EmailConfirm.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/axios';

export default function EmailConfirm() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('pending'); // 'pending' | 'ok' | 'error'
  const [message, setMessage] = useState('Confirming your email…');

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const res = await api.get(`/api/confirm-email/${encodeURIComponent(token)}`);
        if (cancelled) return;

        // Backend returns 200 + { message }
        setStatus('ok');
        setMessage(res?.data?.message || '✅ Email confirmed successfully!');
      } catch (err) {
        if (cancelled) return;
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          'Invalid or expired confirmation link.';
        setStatus('error');
        setMessage(`❌ ${msg}`);
      }
    }

    if (token) run();
    return () => { cancelled = true; };
  }, [token]);

  return (
    <div style={{ padding: '2rem', maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
      <h1>📧 Email Confirmation</h1>
      <p style={{ marginTop: 8 }}>{message}</p>

      {status === 'ok' && (
        <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/login')}
            style={{ padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
          >
            Go to Login
          </button>
          <button
            onClick={() => navigate('/')}
            style={{ padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'black', color: 'white' }}
          >
            Home
          </button>
        </div>
      )}

      {status === 'error' && (
        <>
          <p style={{ color: '#666', marginTop: 10 }}>
            If your link expired, you can request a new confirmation email.
          </p>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/resend-confirmation"
              style={{ padding: '8px 12px', borderRadius: 8, background: '#1d4ed8', color: 'white', textDecoration: 'none' }}
            >
              Request New Email
            </Link>
            <button
              onClick={() => navigate('/')}
              style={{ padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
            >
              Home
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{ padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
            >
              Go to Login
            </button>
          </div>
        </>
      )}
    </div>
  );
}
