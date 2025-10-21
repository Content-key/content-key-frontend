// src/App.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Signup from './Signup';
import Login from './Login';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import Profile from './Profile';
import PrivateRoute from './PrivateRoute';
import Landing from './Landing';
import ProtectedRoute from './auth/ProtectedRoute';
import CreatorDashboard from './pages/CreatorDashboard';
import SponsorDashboard from './pages/SponsorDashboard';
import DashboardIntro from './DashboardIntro';
import EmailConfirm from './pages/EmailConfirm';
import ResendEmail from './pages/ResendEmail';
import Settings from './pages/Settings';
import SponsorRequests from './pages/sponsorrequests';
import CreatorRequests from './pages/CreatorRequests.js'; // MUST match the file below

// useAuth must be called unconditionally
import { useAuth } from './auth/AuthProvider';

function App() {
  const { user, loading } = useAuth(); // <-- unconditioned hook call

  // Wait for auth rehydrate to avoid false redirects on refresh
  if (loading) return null;

  const dashFor = (u) => {
    if (!u) return '/login';
    if (u.role === 'creator') return '/dashboard/creator';
    if (u.role === 'sponsor') return '/dashboard/sponsor';
    return '/intro';
  };

  return (
    <Routes>
      {/* Smart Home */}
      <Route
        path="/"
        element={user ? <Navigate to={dashFor(user)} replace /> : <Landing />}
      />
      <Route
        path="/home"
        element={user ? <Navigate to={dashFor(user)} replace /> : <Landing />}
      />

      {/* Public */}
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/confirm-email/:token" element={<EmailConfirm />} />
      <Route path="/resend-confirmation" element={<ResendEmail />} />
      <Route path="/intro" element={<DashboardIntro />} />

      {/* Protected (any logged-in user) */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        }
      />

      {/* Role-gated dashboards */}
      <Route
        path="/dashboard/creator"
        element={
          <ProtectedRoute roles={['creator']}>
            <CreatorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/sponsor"
        element={
          <ProtectedRoute roles={['sponsor']}>
            <SponsorDashboard />
          </ProtectedRoute>
        }
      />

      {/* Sponsor Inbox */}
      <Route
        path="/sponsor/requests"
        element={
          <ProtectedRoute roles={['sponsor']}>
            <SponsorRequests />
          </ProtectedRoute>
        }
      />

      {/* Creator Inbox */}
      <Route
        path="/creator/requests"
        element={
          <ProtectedRoute roles={['creator']}>
            <CreatorRequests />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route
        path="*"
        element={
          user ? (
            <Navigate to={dashFor(user)} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;
