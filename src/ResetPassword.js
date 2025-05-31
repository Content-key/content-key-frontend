import React, { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './ResetPassword.css';

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleReset = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage('❌ Passwords do not match.');
      return;
    }

    const API_BASE_URL =
      window.location.hostname === 'localhost'
        ? 'http://localhost:5000'
        : process.env.REACT_APP_API_URL;

    try {
      await axios.post(`${API_BASE_URL}/api/reset-password/${token}`, {
        password,
      });

      setMessage('✅ Password reset successful. Redirecting...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error('Reset error:', err.response?.data || err.message);
      setMessage('❌ Error resetting password. Token may be invalid or expired.');
    }
  };

  return (
    <div className="reset-container">
      <form className="reset-form" onSubmit={handleReset}>
        <h2>Reset Your Password</h2>
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <label style={{ display: 'block', marginTop: '10px' }}>
          <input
            type="checkbox"
            checked={showPassword}
            onChange={togglePasswordVisibility}
          /> Show Password
        </label>
        <button type="submit">Reset Password</button>
        {message && <p className="message">{message}</p>}
      </form>
    </div>
  );
}

export default ResetPassword;
