// src/api/axios.js
import axios from "axios";

const BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : process.env.REACT_APP_API_URL;

// Create instance
export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper: get token from ck_auth storage
function getToken() {
  try {
    const raw = localStorage.getItem("ck_auth"); // { token, user }
    if (!raw) return null;
    const { token } = JSON.parse(raw);
    return token || null;
  } catch (e) {
    console.error("Error parsing auth storage", e);
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

// Global response handler
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("ck_auth");
      window.location.href = "/login"; // redirect to login
    }
    return Promise.reject(err);
  }
);

export default api;
