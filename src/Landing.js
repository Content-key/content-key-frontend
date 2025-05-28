import { useNavigate } from 'react-router-dom';
import './Landing.css';

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <img src="/logo.jpeg" alt="Content Key Logo" className="logo" />
      <h1>Unlock Your Journey</h1>

      <p className="story">
        Content Key is here to help creators turn their videos into income — through sponsorships, licensing, and tools that treat your content like a real business.
      </p>

      <div className="button-group">
        <button className="join-button" onClick={() => navigate('/signup')}>
          Join Now
        </button>
        <button className="login-button" onClick={() => navigate('/login')}>
          Login
        </button>
      </div>
    </div>
  );
}

export default Landing;
