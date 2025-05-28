import React, { useState } from 'react';
import axios from 'axios';

function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phone: '',
    role: 'creator',
    businessAddress: '',
    homeAddress: '',
    contentType: '',
    platforms: [],
    otherPlatform: '',
  });

  const platformsList = ['YouTube', 'TikTok', 'Instagram', 'Facebook', 'Twitch'];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      let updated = [...formData.platforms];
      if (checked) {
        updated.push(value);
      } else {
        updated = updated.filter((p) => p !== value);
      }
      setFormData({ ...formData, platforms: updated });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/signup`, formData);
      alert('Signup successful!');
    } catch (err) {
      console.error('Signup failed:', err);
      alert('There was an issue. Please try again.');
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#ffeb3b',
        color: '#1a1a1a',
        minHeight: '100vh',
        padding: '40px 20px',
        maxWidth: '600px',
        margin: '0 auto',
        fontFamily: 'sans-serif',
      }}
    >
      <h2 style={{ textAlign: 'center' }}>Join Content Key</h2>
      <p style={{ textAlign: 'center', marginBottom: '30px' }}>
        You’re one of the first to join the future of content creation and sponsorship.
        This is a trial version — your feedback shapes the platform.
      </p>

      <form onSubmit={handleSubmit}>
        <label>Email:</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} required style={inputStyle} />

        <label>Password:</label>
        <input type="password" name="password" value={formData.password} onChange={handleChange} required style={inputStyle} />

        <label>Phone:</label>
        <input type="text" name="phone" value={formData.phone} onChange={handleChange} required style={inputStyle} />

        <label>Role:</label>
        <select name="role" value={formData.role} onChange={handleChange} style={inputStyle}>
          <option value="creator">Creator</option>
          <option value="sponsor">Sponsor</option>
        </select>

        {formData.role === 'sponsor' && (
          <>
            <label>Business Address:</label>
            <input type="text" name="businessAddress" value={formData.businessAddress} onChange={handleChange} style={inputStyle} />
          </>
        )}

        {formData.role === 'creator' && (
          <>
            <label>Home Address:</label>
            <input type="text" name="homeAddress" value={formData.homeAddress} onChange={handleChange} style={inputStyle} />

            <label>Type of Content:</label>
            <input type="text" name="contentType" value={formData.contentType} onChange={handleChange} style={inputStyle} />

            <label>What platforms do you post on?</label>
            {platformsList.map((platform) => (
              <div key={platform}>
                <input
                  type="checkbox"
                  name="platforms"
                  value={platform}
                  checked={formData.platforms.includes(platform)}
                  onChange={handleChange}
                />
                <label style={{ marginLeft: '8px' }}>{platform}</label>
              </div>
            ))}

            <label>Other Platform:</label>
            <input type="text" name="otherPlatform" value={formData.otherPlatform} onChange={handleChange} style={inputStyle} />
          </>
        )}

        <button
          type="submit"
          style={{
            backgroundColor: '#000',
            color: '#ffeb3b',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginTop: '20px',
            width: '100%',
          }}
        >
          Sign Up
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  display: 'block',
  width: '100%',
  padding: '10px',
  marginBottom: '15px',
  border: '1px solid #ccc',
  borderRadius: '4px',
};

export default Signup;
