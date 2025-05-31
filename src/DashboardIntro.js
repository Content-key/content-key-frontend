// DashboardIntro.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardIntro.css';

function DashboardIntro() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUserRole(storedUser.role);
      setUserName(storedUser.fullName || storedUser.stageName || storedUser.businessName || '');
    }
  }, []);

  const handleGoToDashboard = () => {
    if (userRole === 'creator') {
      navigate('/dashboard/creator');
    } else if (userRole === 'sponsor') {
      navigate('/dashboard/sponsor');
    } else {
      navigate('/profile');
    }
  };

  return (
    <div className="dashboard-intro-container">
      <h1>Welcome {userName} 🎉</h1>
      <p>You’ve successfully logged in as a <strong>{userRole}</strong>.</p>
      <p>Let’s get you moving toward that next sponsorship deal!</p>
      <button onClick={handleGoToDashboard}>Go to Dashboard</button>
    </div>
  );
}

export default DashboardIntro;
