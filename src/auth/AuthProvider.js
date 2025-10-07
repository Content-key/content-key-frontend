// src/auth/AuthProvider.js
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { isTokenExpired } from "../lib/auth";

const STORAGE_KEY = "ck_auth"; // { token, user }
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  // load from localStorage on first render
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const { token: savedToken, user: savedUser } = JSON.parse(raw);
      if (savedToken && !isTokenExpired(savedToken)) {
        setToken(savedToken);
        setUser(savedUser ?? null);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // auto-logout when token expires (checked every 30s)
  useEffect(() => {
    if (!token) return;
    const id = setInterval(() => {
      if (isTokenExpired(token)) logout();
    }, 30 * 1000);
    return () => clearInterval(id);
  }, [token]);

  // cross-tab sync (login/logout reflected across tabs)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY) return;
      if (!e.newValue) {
        setToken(null);
        setUser(null);
        return;
      }
      try {
        const { token: savedToken, user: savedUser } = JSON.parse(e.newValue);
        if (savedToken && !isTokenExpired(savedToken)) {
          setToken(savedToken);
          setUser(savedUser ?? null);
        } else {
          setToken(null);
          setUser(null);
        }
      } catch {
        setToken(null);
        setUser(null);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = (jwt, u) => {
    setToken(jwt);
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: jwt, user: u }));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({ token, user, isAuthed: Boolean(token && user), login, logout }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
