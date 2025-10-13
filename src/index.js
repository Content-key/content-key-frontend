// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './auth/AuthProvider';

// Removed StrictMode to avoid double-mount in dev.
// AuthProvider wraps Router so guarded routes wait for auth rehydrate.

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <AuthProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </AuthProvider>
);
