// src/api/axios.js
import axios from "axios";

const isLocalhost = window.location.hostname === "localhost";

// Dev → talk to local API; Prod → use env or same-origin /api
const BASE_URL = isLocalhost
  ? "http://localhost:5000"
  : (process.env.REACT_APP_API_URL || "/api");

// Create instance
export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

// Helper: get token from ck_auth storage
function getToken() {
  try {
    const raw = localStorage.getItem("ck_auth"); // { token, user }
    if (!raw) return null;
    const { token } = JSON.parse(raw);
    return token || null;
  } catch {
    return null;
  }
}

// Add Authorization header automatically
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Single-shot 401 redirect guard
let didKickToLogin = false;

// Global response handler
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const hadAuthHeader =
      !!err?.config?.headers?.Authorization ||
      !!err?.config?._hadAuth; // internal fallback

    // Only react to 401s that were actually authenticated requests
    if (status === 401 && hadAuthHeader) {
      try {
        localStorage.removeItem("ck_auth");
      } catch {}
      if (!didKickToLogin) {
        didKickToLogin = true;
        // Small timeout to allow any UI cleanup
        setTimeout(() => {
          window.location.href = "/login";
        }, 0);
      }
    }
    return Promise.reject(err);
  }
);

export default api;
