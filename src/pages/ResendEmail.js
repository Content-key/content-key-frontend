// src/pages/ResendEmail.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../Login.css'; // keep using the shared styles
import { api } from '../api/axios';

export default function ResendEmail() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // lightweight email format check
    const looksEmail = /\S+@\S+\.\S+/.test(email);
    if (!looksEmail) {
      setMessage('❌ Please enter a valid email address.');
      return;
    }

    setSending(true);
    try {
      const res = await api.post('/api/resend-confirmation', { email });
      setMessage('✅ ' + (res?.data?.message || 'Confirmation email sent.'));
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Server error';
      setMessage('❌ ' + msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Resend Confirmation Email</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={sending}
          />
          <button type="submit" disabled={sending}>
            {sending ? 'Sending…' : 'Resend'}
          </button>
        </form>

        {message && <p className="message" style={{ marginTop: 10 }}>{message}</p>}

        <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/')}
            style={{ padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
          >
            Home
          </button>
          <Link
            to="/login"
            style={{ padding: '8px 12px', borderRadius: 8, background: '#1d4ed8', color: 'white', textDecoration: 'none' }}
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
