import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Signup from './Signup';
import Login from './Login';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import Profile from './Profile';
import PrivateRoute from './PrivateRoute';
import Landing from './Landing';
import ProtectedRoute from './ProtectedRoute';
import CreatorDashboard from './pages/CreatorDashboard';
import SponsorDashboard from './pages/SponsorDashboard';
import DashboardIntro from './DashboardIntro';
import EmailConfirm from './pages/EmailConfirm'; // ✅ Email confirmation page
import ResendEmail from './pages/ResendEmail'; // ✅ (Create this page for resending confirmation email)

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
        <Route path="/resend-confirmation" element={<ResendEmail />} /> {/* ✅ New route */}
        <Route path="/intro" element={<DashboardIntro />} />

        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/creator"
          element={
            <ProtectedRoute>
              <CreatorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/sponsor"
          element={
            <ProtectedRoute>
              <SponsorDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
