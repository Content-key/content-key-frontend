import React, { useState } from 'react';
import axios from 'axios';
import '../Login.css'; // ✅ Corrected path to access Login.css from parent folder

function ResendEmail() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const API_BASE_URL =
    window.location.hostname === 'localhost'
      ? 'http://localhost:5000'
      : process.env.REACT_APP_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/api/resend-confirmation`, { email });
      setMessage('✅ ' + res.data.message);
    } catch (err) {
      const msg = err.response?.data?.message || 'Server error';
      setMessage('❌ ' + msg);
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
          />
          <button type="submit">Resend</button>
        </form>
        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}

export default ResendEmail;
