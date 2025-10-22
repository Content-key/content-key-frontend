import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Signup.css';
import useRedirectIfAuthed from './hooks/useRedirectIfAuthed';

function Signup() {
  const navigate = useNavigate();
  useRedirectIfAuthed();

  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phone: '',
    role: 'creator',
    fullName: '',
    stageName: '',
    businessName: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    contentType: '',
    platforms: [],
    platformUrls: { YouTube:'', Instagram:'', TikTok:'', Facebook:'', Other:'' }
  });

  const platformsList = ['YouTube','Instagram','TikTok','Facebook','Other'];
  const usStates = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    if (platformsList.includes(name)) {
      setFormData(prev => ({
        ...prev,
        platforms: checked ? [...prev.platforms, name] : prev.platforms.filter(p => p !== name)
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    const API_BASE_URL =
      window.location.hostname === 'localhost'
        ? 'http://localhost:5000'
        : process.env.REACT_APP_API_URL;

    try {
      const res = await axios.post(`${API_BASE_URL}/api/signup`, formData, { withCredentials: true });
      console.log('[Signup] success payload:', res?.data);

      // Prefill login email + redirect
      localStorage.setItem('ck_prefill_email', formData.email || '');
      const emailQS = encodeURIComponent(formData.email || '');
      const dest = `/login?flash=signup_success&email=${emailQS}`;
      navigate(dest, { replace: true });
      setTimeout(() => {
        if (!/\/login(\?|$)/.test(window.location.pathname + window.location.search)) {
          window.location.assign(dest);
        }
      }, 250);
    } catch (err) {
      const backendMsg = err?.response?.data?.message;
      console.error('[Signup] failed:', backendMsg || err.message);
      if (backendMsg === 'User already exists') {
        alert('❌ A user with this email already exists. Please log in or use a different email.');
      } else {
        alert(`Signup failed: ${backendMsg || 'Something went wrong. Please try again.'}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="signup-container">

      {/* ---- Top bar with Home button ---- */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 10
      }}>
        <Link
          to="/"
          style={{
            textDecoration: 'none',
            background: '#111827',
            color: '#fff',
            border: '1px solid #111827',
            padding: '8px 12px',
            borderRadius: 10,
            fontWeight: 800,
            boxShadow: '0 6px 16px rgba(0,0,0,0.15)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#0b1220';
            e.currentTarget.style.borderColor = '#0b1220';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = '#111827';
            e.currentTarget.style.borderColor = '#111827';
          }}
        >
          ← Home
        </Link>
      </div>

      <form className="signup-form" onSubmit={handleSubmit}>
        <h1><strong>Join Content Key</strong></h1>
        <p style={{ textAlign:'center', fontSize:'16px', marginTop:'-10px', marginBottom:'20px' }}>
          You’re one of the first to join the future of content creation and sponsorship.<br />
          <em>This is a trial version – your feedback shapes the platform.</em>
        </p>

        <div className="row">
          <input name="email" placeholder="Email" onChange={handleChange} required />
          <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
          <input name="phone" placeholder="Phone" onChange={handleChange} />
          <select name="role" onChange={handleChange} defaultValue="creator">
            <option value="creator">Creator</option>
            <option value="sponsor">Sponsor</option>
          </select>
        </div>

        <div className="row">
          <input name="fullName" placeholder="Full Name" onChange={handleChange} />
          <input name="stageName" placeholder="Stage Name (if any)" onChange={handleChange} />
          <input name="businessName" placeholder="Business Name (Sponsors Only)" onChange={handleChange} />
        </div>

        <div className="row">
          <input name="streetAddress" placeholder="Street Address" onChange={handleChange} />
        </div>

        {/* City, State, Zip on one row */}
        <div className="row row-compact">
          <input name="city" placeholder="City" onChange={handleChange} />
          <select name="state" value={formData.state} onChange={handleChange}>
            <option value="">State</option>
            {usStates.map((abbr) => (
              <option key={abbr} value={abbr}>{abbr}</option>
            ))}
          </select>
          <input name="zipCode" placeholder="Zip Code" onChange={handleChange} />
        </div>

        <div className="row">
          <input name="contentType" placeholder="What kind of content do you post?" onChange={handleChange} />
        </div>

        <div className="checkbox-row">
          <label>Where do you post content?</label>
          {['YouTube','Instagram','TikTok','Facebook','Other'].map((platform) => (
            <div key={platform}>
              <label>
                <input
                  type="checkbox"
                  name={platform}
                  checked={formData.platforms.includes(platform)}
                  onChange={handleChange}
                />
                {platform}
              </label>
              <input
                type="url"
                name={`platformUrl-${platform}`}
                placeholder={`${platform} URL`}
                value={formData.platformUrls[platform]}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    platformUrls: { ...prev.platformUrls, [platform]: value }
                  }));
                }}
              />
            </div>
          ))}
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Joining…' : 'Join Now'}
        </button>
      </form>
    </div>
  );
}

export default Signup;
