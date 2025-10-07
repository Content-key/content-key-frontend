import { useNavigate } from 'react-router-dom';

function Profile() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');  // Clear the token
    navigate('/login');                // Redirect to login
  };

  const goToSettings = () => {
    navigate('/settings');             // Redirect to settings page
  };

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>Welcome to your Profile!</h2>
      <p>This page is protected and only visible to logged-in users.</p>

      <div style={{ marginTop: "1.5rem" }}>
        <button 
          onClick={goToSettings} 
          style={{ marginRight: "1rem", padding: "0.5rem 1rem" }}
        >
          Settings
        </button>

        <button 
          onClick={handleLogout} 
          style={{ padding: "0.5rem 1rem", backgroundColor: "red", color: "white", border: "none" }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Profile;
