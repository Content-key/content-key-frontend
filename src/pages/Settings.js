// src/pages/Settings.js
import React, { useEffect, useState } from "react";
import { api } from "../api/axios";
import { useAuth } from "../auth/AuthProvider";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const { login } = useAuth(); // reuse to refresh stored user after saving
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Prefill from ck_auth (AuthProvider storage)
  const [form, setForm] = useState({
    fullName: "",
    stageName: "",
    businessName: "",
    phone: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    platformUrls: {
      YouTube: "",
      Instagram: "",
      TikTok: "",
      Facebook: "",
      Other: "",
    },
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ck_auth");
      if (!raw) return;
      const { user } = JSON.parse(raw);
      if (!user) return;

      setForm((prev) => ({
        ...prev,
        fullName: user.fullName || "",
        stageName: user.stageName || "",
        businessName: user.businessName || "",
        phone: user.phone || "",
        streetAddress: user.streetAddress || "",
        city: user.city || "",
        state: user.state || "",
        zipCode: user.zipCode || "",
        platformUrls: {
          YouTube: user.platformUrls?.YouTube || "",
          Instagram: user.platformUrls?.Instagram || "",
          TikTok: user.platformUrls?.TikTok || "",
          Facebook: user.platformUrls?.Facebook || "",
          Other: user.platformUrls?.Other || "",
        },
      }));
    } catch {
      /* ignore */
    }
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("platformUrls.")) {
      const key = name.split(".")[1];
      setForm((f) => ({
        ...f,
        platformUrls: { ...f.platformUrls, [key]: value },
      }));
      return;
    }
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const payload = {
        fullName: form.fullName,
        stageName: form.stageName,
        businessName: form.businessName,
        phone: form.phone,
        streetAddress: form.streetAddress,
        city: form.city,
        state: form.state,
        zipCode: form.zipCode,
        platformUrls: { ...form.platformUrls },
      };

      // ✅ call self-update route (no :id in URL)
      const { data } = await api.put(`/api/users/me`, payload);

      // Refresh ck_auth with the updated user while keeping the same token
      const raw = localStorage.getItem("ck_auth");
      const currentToken = raw ? JSON.parse(raw).token : null;
      const updatedUser = data.user || payload;
      if (currentToken && updatedUser) {
        login(currentToken, updatedUser);
      }

      setMessage("✅ Settings saved!");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Save failed.";
      setMessage(`❌ ${msg}`);
      console.error("Settings save error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 20 }}>
      {/* Header row with title + Home button */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ marginBottom: 6 }}>Settings</h1>
          <p style={{ marginTop: 0, color: "#666" }}>Update your profile and address details.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="home-btn"
            onClick={() => navigate("/")}
            style={{ backgroundColor: "black", color: "white", padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer" }}
          >
            Home
          </button>
        </div>
      </div>

      {message && (
        <div
          style={{
            margin: "12px 0",
            padding: "10px 12px",
            borderRadius: 8,
            background: "#f7f7f7",
          }}
        >
          {message}
        </div>
      )}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gap: 8 }}>
          <label>Full Name</label>
          <input
            name="fullName"
            value={form.fullName}
            onChange={onChange}
            placeholder="Jane Doe"
          />
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label>Stage Name</label>
          <input
            name="stageName"
            value={form.stageName}
            onChange={onChange}
            placeholder="Creator alias"
          />
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label>Business Name</label>
          <input
            name="businessName"
            value={form.businessName}
            onChange={onChange}
            placeholder="LLC or brand"
          />
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label>Phone</label>
          <input
            name="phone"
            value={form.phone}
            onChange={onChange}
            placeholder="(555) 555-5555"
          />
        </div>

        <hr style={{ margin: "12px 0" }} />

        <div style={{ display: "grid", gap: 8 }}>
          <label>Street Address</label>
          <input
            name="streetAddress"
            value={form.streetAddress}
            onChange={onChange}
            placeholder="123 Main St"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ display: "grid", gap: 8 }}>
            <label>City</label>
            <input
              name="city"
              value={form.city}
              onChange={onChange}
              placeholder="City"
            />
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            <label>State</label>
            <input
              name="state"
              value={form.state}
              onChange={onChange}
              placeholder="State"
            />
          </div>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label>Zip Code</label>
          <input
            name="zipCode"
            value={form.zipCode}
            onChange={onChange}
            placeholder="ZIP"
          />
        </div>

        <hr style={{ margin: "12px 0" }} />

        <div style={{ display: "grid", gap: 8 }}>
          <label>YouTube URL</label>
          <input
            name="platformUrls.YouTube"
            value={form.platformUrls.YouTube}
            onChange={onChange}
            placeholder="https://youtube.com/@yourchannel"
          />
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label>Instagram URL</label>
          <input
            name="platformUrls.Instagram"
            value={form.platformUrls.Instagram}
            onChange={onChange}
            placeholder="https://instagram.com/you"
          />
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label>TikTok URL</label>
          <input
            name="platformUrls.TikTok"
            value={form.platformUrls.TikTok}
            onChange={onChange}
            placeholder="https://tiktok.com/@you"
          />
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label>Facebook URL</label>
          <input
            name="platformUrls.Facebook"
            value={form.platformUrls.Facebook}
            onChange={onChange}
            placeholder="https://facebook.com/you"
          />
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label>Other URL</label>
          <input
            name="platformUrls.Other"
            value={form.platformUrls.Other}
            onChange={onChange}
            placeholder="Any other link"
          />
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button
            type="submit"
            disabled={saving}
            className="settings-btn"
            style={{
              backgroundColor: "blue",
              color: "white",
              padding: "8px 12px",
              borderRadius: 8,
              border: "none",
              cursor: saving ? "default" : "pointer",
              opacity: saving ? 0.75 : 1,
            }}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
          <button
            type="button"
            onClick={() => window.history.back()}
            style={{
              backgroundColor: "#ddd",
              color: "#222",
              padding: "8px 12px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
