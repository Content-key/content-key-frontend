import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [showResend, setShowResend] = useState(false);
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const API_BASE_URL =
      window.location.hostname === 'localhost'
        ? 'http://localhost:5000'
        : process.env.REACT_APP_API_URL;

    try {
      const res = await axios.post(`${API_BASE_URL}/api/login`, {
        email,
        password,
      });

      const { token, user } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      if (user.role === 'creator') {
        navigate('/dashboard/creator');
      } else if (user.role === 'sponsor') {
        navigate('/dashboard/sponsor');
      } else {
        navigate('/');
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Something went wrong. Please try again.';

      setMessage(`❌ ${errorMsg}`);

      // If the backend said it's an unconfirmed email, trigger resend
      if (errorMsg.includes('confirm your email')) {
        setShowResend(true);
      } else {
        setShowResend(false);
      }

      console.error('Login error:', errorMsg);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="brand-title">Content Key</h1>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
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
              Didn’t get the confirmation email? <a href="/resend-confirmation">Resend Email</a>
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
