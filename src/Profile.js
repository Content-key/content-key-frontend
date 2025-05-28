import { useNavigate } from 'react-router-dom';

function Profile() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');  // Clear the token
    navigate('/login');                // Redirect to login
  };

  return (
    <div>
      <h2>Welcome to your Profile!</h2>
      <p>This page is protected and only visible to logged-in users.</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default Profile;
