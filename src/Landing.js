// Trigger Vercel redeploy (minor update – extra space)

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

function Landing() {
  const navigate = useNavigate();

  // Set the tab title
  useEffect(() => {
    document.title = 'Content Key – Unlock Your Journey';
  }, []);

  return (
    <div className="landing-container">
      <img src="/logo192.png" alt="Content Key Logo" className="logo" />

      <h1 className="main-headline">Launching Something Big – Almost Ready</h1>

      <p className="story">
        Content Key is almost here — a platform built to help creators work with real sponsors,
        monetize videos, and treat content like a business. You're not just posting... you're preparing.
      </p>

      <div className="button-group">
        <button className="join-button" onClick={() => navigate('/signup')}>
          Join Now
        </button>
        <button className="login-button" onClick={() => navigate('/login')}>
          Login
        </button>
      </div>

      <p className="motivation-line">
        This is your early look. Testing in progress. Let’s build the future together.
      </p>
    </div>
  );
}

export default Landing;

// Triggered on May 29 at 4:45 PM
// ⏱️ Triggered redeploy at 4:50 PM on May 29
