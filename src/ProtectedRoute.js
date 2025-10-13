// src/auth/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

/**
 * Usage:
 * <ProtectedRoute roles={['creator']}>
 *   <CreatorDashboard/>
 * </ProtectedRoute>
 */
export default function ProtectedRoute({ children, roles }) {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  // Critical: don't decide until auth rehydration completes
  if (loading) return null; // or a tiny spinner

  // Not authenticated → go to login (preserve where we came from)
  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Optional role gating
  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    const fallback =
      user.role === 'sponsor'
        ? '/dashboard/sponsor'
        : user.role === 'creator'
        ? '/dashboard/creator'
        : '/intro';
    return <Navigate to={fallback} replace />;
  }

  return children;
}
