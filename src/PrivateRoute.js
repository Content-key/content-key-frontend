// src/PrivateRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';

export default function PrivateRoute({ children }) {
  const auth = useAuth();
  const { user, token, loading, isAuthed, authReady } = auth || {};
  const location = useLocation();

  // Normalize flags across older/newer AuthProvider shapes
  const ready = typeof loading === 'boolean' ? !loading : !!authReady;
  const authed = typeof isAuthed === 'boolean' ? isAuthed : !!(token && user);

  // Wait for auth rehydration to finish to avoid false redirects on refresh
  if (!ready) return null; // or a tiny spinner

  return authed ? (
    children
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  );
}
