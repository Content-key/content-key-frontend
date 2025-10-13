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
  const { token, user, authReady } = useAuth();
  const location = useLocation();

  // ✅ Wait for localStorage rehydration before making any decision
  if (!authReady) return null; // or a tiny spinner

  // Not authenticated → go to login (preserve where we came from)
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Optional role gating
  if (roles && roles.length > 0 && user && !roles.includes(user.role)) {
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
