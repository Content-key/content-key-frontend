import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
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
        password
      });

      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Redirect based on role
      if (user.role === 'creator') {
        navigate('/creator-dashboard');
      } else if (user.role === 'sponsor') {
        navigate('/sponsor-dashboard');
      }
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      setMessage('❌ Invalid email or password');
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Login</h2>
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
        <label style={{ display: 'block', marginTop: '10px' }}>
          <input
            type="checkbox"
            checked={showPassword}
            onChange={togglePasswordVisibility}
          /> Show Password
        </label>
        <button type="submit">Login</button>
        {message && <p className="message">{message}</p>}
      </form>
    </div>
  );
}

export default Login;
