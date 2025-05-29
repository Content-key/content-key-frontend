import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div style={styles.container}>
      <img
        src="/logo192.png"
        alt="Content Key Logo"
        style={styles.logo}
      />
      <h1 style={styles.title}>Unlock Your Journey</h1>
      <p style={styles.subtitle}>
        Content Key is here to help creators turn their videos into income —
        through sponsorships, licensing, and tools that treat your content like a real business.
      </p>

      <div style={styles.buttonGroup}>
        <Link to="/signup" style={styles.joinButton}>Join Now</Link>
        <Link to="/login" style={styles.loginButton}>Login</Link>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#ffeb3b',
    color: '#1a1a1a',
    textAlign: 'center',
    minHeight: '100vh',
    padding: '40px 20px',
    fontFamily: 'sans-serif',
  },
  logo: {
    width: '100px',
    marginBottom: '20px',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '1.2rem',
    maxWidth: '600px',
    margin: '0 auto 30px',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    flexWrap: 'wrap',
  },
  joinButton: {
    backgroundColor: '#000',
    color: '#ffeb3b',
    padding: '12px 24px',
    borderRadius: '6px',
    fontWeight: 'bold',
    textDecoration: 'none',
  },
  loginButton: {
    backgroundColor: '#fff',
    color: '#000',
    padding: '12px 24px',
    borderRadius: '6px',
    fontWeight: 'bold',
    textDecoration: 'none',
    border: '2px solid #000',
  }
};

export default Home;
