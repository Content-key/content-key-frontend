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

  // Wait for auth rehydration to complete
  if (loading) return null; // or a tiny spinner

  // Not authenticated → go to login, preserving where they were headed
  if (!token || !user) {
    const from = `${location.pathname}${location.search || ''}`;
    return <Navigate to="/login" replace state={{ from }} />;
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
