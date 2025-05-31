import React, { useState } from 'react';
import axios from 'axios';
import './ForgotPassword.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const API_BASE_URL =
      window.location.hostname === 'localhost'
        ? 'http://localhost:5000'
        : process.env.REACT_APP_API_URL;

    try {
      await axios.post(`${API_BASE_URL}/api/forgot-password`, { email });
      setMessage('✅ Reset link sent! Check your email.');
    } catch (err) {
      console.error('Forgot password error:', err.response?.data || err.message);
      setMessage('❌ Something went wrong. Please try again.');
    }
  };

  return (
    <div className="forgot-container">
      <form className="forgot-form" onSubmit={handleSubmit}>
        <h2>Forgot Password</h2>
        <p>Enter your email and we’ll send you a reset link.</p>
        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Send Reset Link</button>
        {message && <p className="message">{message}</p>}
      </form>
    </div>
  );
}

export default ForgotPassword;
