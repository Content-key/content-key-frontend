// src/lib/auth.js

// Decode a JWT payload (no verification, client-side only)
export function decodeJWT(token) {
    try {
      const payload = token.split(".")[1];
      // base64url -> base64
      const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
      const json = atob(b64);
      // handle potential utf-8 chars
      const utf8 = decodeURIComponent(
        Array.prototype.map
          .call(json, (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(utf8);
    } catch {
      return null;
    }
  }
  
  export function isTokenExpired(token) {
    const decoded = decodeJWT(token);
    if (!decoded || typeof decoded.exp !== "number") return true;
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp <= now;
  }
  