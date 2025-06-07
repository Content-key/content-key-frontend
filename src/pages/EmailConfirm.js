// src/pages/EmailConfirm.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

function EmailConfirm() {
  const { token } = useParams();
  const [message, setMessage] = useState('Confirming...');

  // Force local server for now until Render backend is redeployed
  const API_BASE_URL =
    window.location.hostname === 'localhost'
      ? 'http://localhost:5000'
      : process.env.REACT_APP_API_URL;

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/confirm-email/${token}`);
        const data = await res.json();

        if (res.ok) {
          setMessage('✅ Email confirmed successfully!');
        } else {
          setMessage(`❌ ${data.message || 'Failed to confirm email.'}`);
        }
      } catch (err) {
        setMessage('❌ Server error.');
      }
    };

    confirmEmail();
  }, [token, API_BASE_URL]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>📧 Email Confirmation</h1>
      <p>{message}</p>
    </div>
  );
}

export default EmailConfirm;

