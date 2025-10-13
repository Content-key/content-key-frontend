// src/auth/AuthProvider.js
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { isTokenExpired } from "../lib/auth";
import { api } from "../api/axios";

const STORAGE_KEY = "ck_auth";
const AuthContext = createContext(null);

// Server rehydrate
async function fetchMe() {
  const res = await api.get("/api/users/me");
  return res.data?.user || null;
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false); // ✅ important

  // Load from localStorage on first render
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { token: savedToken, user: savedUser } = JSON.parse(raw);
        if (savedToken && !isTokenExpired(savedToken)) {
          setToken(savedToken);
          setUser(savedUser ?? null);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setAuthReady(true); // ✅ allow routes to render after storage read
    }
  }, []);

  // Rehydrate user from server whenever token changes
  useEffect(() => {
    let cancelled = false;
    async function rehydrate() {
      if (!token) return;
      if (isTokenExpired(token)) {
        logout();
        return;
      }
      try {
        const freshUser = await fetchMe();
        if (!cancelled && freshUser) {
          setUser(freshUser);
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user: freshUser }));
        }
      } catch (err) {
        // Don’t force logout on transient errors; 401s handled by axios interceptor
        console.warn("Rehydrate warning:", err?.message || err);
      }
    }
    rehydrate();
    return () => { cancelled = true; };
  }, [token]);

  // Auto-logout when token expires (checked every 30s)
  useEffect(() => {
    if (!token) return;
    const id = setInterval(() => {
      if (isTokenExpired(token)) logout();
    }, 30 * 1000);
    return () => clearInterval(id);
  }, [token]);

  // Cross-tab sync
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

  const refreshUser = useCallback(async () => {
    if (!token || isTokenExpired(token)) {
      logout();
      return null;
    }
    try {
      const freshUser = await fetchMe();
      setUser(freshUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user: freshUser }));
      return freshUser;
    } catch (err) {
      console.warn("refreshUser warning:", err?.message || err);
      return null;
    }
  }, [token]);

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      authReady,                 // ✅ expose to guards
      isAuthed: Boolean(token),  // ✅ token alone is enough for routing
      login,
      logout,
      refreshUser,
    }),
    [token, user, authReady, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
