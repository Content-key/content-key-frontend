// src/Login.js
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Login.css';

import { api } from './api/axios';
import { useAuth } from './auth/AuthProvider';

// 🔹 Redirect-away if already authenticated
import useRedirectIfAuthed from './hooks/useRedirectIfAuthed';

function Login() {
  // Redirect signed-in users off this page (respects ?redirect= and state.from)
  useRedirectIfAuthed();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [showResend, setShowResend] = useState(false);

  // ✅ NEW: banners
  const [showVerified, setShowVerified] = useState(false);
  const [showSignupSuccess, setShowSignupSuccess] = useState(false);

  const navigate = useNavigate();
  const { search } = useLocation();
  const { login } = useAuth();
  const passwordRef = useRef(null);

  // Read query params: verified + email + flash (signup_success)
  useEffect(() => {
    const params = new URLSearchParams(search);

    // If they just clicked the email verify link and returned: ?verified=1
    if (params.get('verified') === '1') {
      setShowVerified(true);
      // focus password for quick login
      setTimeout(() => passwordRef.current?.focus(), 0);
    }

    // If they just signed up and we redirected here: ?flash=signup_success&email=...
    if (params.get('flash') === 'signup_success') {
      setShowSignupSuccess(true);
    }

    // Prefill email: querystring first, then localStorage fallback
    const emailFromQuery = params.get('email');
    const storedEmail = localStorage.getItem('ck_prefill_email') || '';
    if (emailFromQuery) setEmail(emailFromQuery);
    else if (storedEmail) setEmail(storedEmail);

    // Clear the stored prefill after a bit so it doesn't linger
    if (storedEmail) {
      const t = setTimeout(() => localStorage.removeItem('ck_prefill_email'), 30000);
      return () => clearTimeout(t);
    }
  }, [search]);

  // Auto-dismiss the signup success banner
  useEffect(() => {
    if (!showSignupSuccess) return;
    const t = setTimeout(() => setShowSignupSuccess(false), 6000);
    return () => clearTimeout(t);
  }, [showSignupSuccess]);

  const togglePasswordVisibility = () => setShowPassword((p) => !p);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    setShowResend(false);

    try {
      const res = await api.post('/api/login', { email, password });
      const { token, user } = res.data;

      login(token, user);

      // Role-based redirect (original behavior)
      if (user.role === 'creator') navigate('/dashboard/creator');
      else if (user.role === 'sponsor') navigate('/dashboard/sponsor');
      else navigate('/');
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Something went wrong. Please try again.';

      setMessage(`❌ ${errorMsg}`);
      if (errorMsg.toLowerCase().includes('confirm your email')) {
        setShowResend(true);
      }
      console.error('Login error:', errorMsg);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="brand-title">Content Key</h1>

        {/* ✅ NEW: “Congrats, check email” banner after signup */}
        {showSignupSuccess && (
          <div
            role="status"
            style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              padding: '10px 12px',
              borderRadius: 8,
              marginBottom: 12,
              fontWeight: 700,
              textAlign: 'center',
            }}
          >
            🎉 Congratulations! Your account was created. Please check your email to confirm, then log in here.
          </div>
        )}

        {/* Existing: “Email verified” banner */}
        {showVerified && (
          <div
            style={{
              background: '#e8f7ee',
              border: '1px solid #b6ebc1',
              color: '#0a7a2f',
              padding: '10px 12px',
              borderRadius: 8,
              marginBottom: 12,
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            ✅ Email verified — you can log in now.
          </div>
        )}

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            ref={passwordRef}
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label style={{ marginTop: '10px', display: 'block', fontSize: '14px' }}>
            <input
              type="checkbox"
              checked={showPassword}
              onChange={togglePasswordVisibility}
              style={{ marginRight: '5px' }}
            />
            Show Password
          </label>

          <button type="submit" style={{ marginTop: 12 }}>Login</button>

          {message && <p className="message">{message}</p>}

          {showResend && (
            <p className="resend-note">
              Didn’t get the confirmation email?{' '}
              <a href="/resend-confirmation">Resend Email</a>
            </p>
          )}
        </form>

        {/* Sign Up button */}
        <p className="footer-note" style={{ marginTop: 10 }}>
          New here?{' '}
          <button
            type="button"
            onClick={() => navigate('/signup')}
            style={{
              background: 'black',
              color: 'white',
              border: 'none',
              padding: '8px 14px',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            Sign Up
          </button>
        </p>

        <p className="footer-note">
          Forgot your password? <a href="/forgot-password">Reset it</a>
        </p>
      </div>
    </div>
  );
}

export default Login;
