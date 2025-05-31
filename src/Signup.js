import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Signup.css';

function Signup() {
  const navigate = useNavigate();

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
    platformUrls: {
      YouTube: '',
      Instagram: '',
      TikTok: '',
      Facebook: '',
      Other: ''
    }
  });

  const platformsList = ['YouTube', 'Instagram', 'TikTok', 'Facebook', 'Other'];
  const usStates = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

  const handleChange = (e) => {
    const { name, value, checked } = e.target;

    if (platformsList.includes(name)) {
      setFormData((prev) => {
        const updatedPlatforms = checked
          ? [...prev.platforms, name]
          : prev.platforms.filter((p) => p !== name);
        return { ...prev, platforms: updatedPlatforms };
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const API_BASE_URL =
      window.location.hostname === 'localhost'
        ? 'http://localhost:5000'
        : process.env.REACT_APP_API_URL;

    try {
      const res = await axios.post(`${API_BASE_URL}/api/signup`, formData);
      console.log('Signup successful:', res.data);
      alert('✅ Signup successful! Please check your email for confirmation.');
      navigate('/');
    } catch (err) {
      console.error('Signup failed:', err.response?.data || err.message);
      alert('Signup failed. Please check your information and try again.');
    }
  };

  return (
    <div className="signup-container">
      <form className="signup-form" onSubmit={handleSubmit}>
        <h1><strong>Join Content Key</strong></h1>
        <p style={{ textAlign: 'center', fontSize: '16px', marginTop: '-10px', marginBottom: '20px' }}>
          You’re one of the first to join the future of content creation and sponsorship.<br />
          <em>This is a trial version – your feedback shapes the platform.</em>
        </p>

        <div className="row">
          <input name="email" placeholder="Email" onChange={handleChange} required />
          <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
          <input name="phone" placeholder="Phone" onChange={handleChange} />
          <select name="role" onChange={handleChange}>
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

        {/* ✅ City, State, Zip on one row */}
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
          {platformsList.map((platform) => (
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
                  setFormData((prev) => ({
                    ...prev,
                    platformUrls: {
                      ...prev.platformUrls,
                      [platform]: value
                    }
                  }));
                }}
              />
            </div>
          ))}
        </div>

        <button type="submit">Join Now</button>
      </form>
    </div>
  );
}

export default Signup;
