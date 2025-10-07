// src/App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import SponsorRequests from './pages/sponsorrequests'; // <-- lowercase path

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
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

        {/* Sponsor Inbox (Requests) */}
        <Route
          path="/sponsor/requests"
          element={
            <ProtectedRoute roles={['sponsor']}>
              <SponsorRequests />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
