import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Login.css';

import { api } from './api/axios';
import { useAuth } from './auth/AuthProvider';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [showVerified, setShowVerified] = useState(false);

  const navigate = useNavigate();
  const { search } = useLocation();
  const { login } = useAuth();
  const passwordRef = useRef(null);

  // Read query params: verified + email
  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get('verified') === '1') {
      setShowVerified(true);
      // Optional: move focus to password for quick login
      setTimeout(() => passwordRef.current?.focus(), 0);
    }
    const emailFromQuery = params.get('email');
    if (emailFromQuery) setEmail(emailFromQuery);
  }, [search]);

  const togglePasswordVisibility = () => setShowPassword((p) => !p);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    setShowResend(false);

    try {
      const res = await api.post('/api/login', { email, password });
      const { token, user } = res.data;

      login(token, user);

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
          <button type="submit">Login</button>

          {message && <p className="message">{message}</p>}

          {showResend && (
            <p className="resend-note">
              Didn’t get the confirmation email?{' '}
              <a href="/resend-confirmation">Resend Email</a>
            </p>
          )}
        </form>

        <p className="footer-note">
          Forgot your password? <a href="/forgot-password">Reset it</a>
        </p>
      </div>
    </div>
  );
}

export default Login;
