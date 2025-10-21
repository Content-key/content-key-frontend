// src/hooks/useRedirectIfAuthed.js
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function useRedirectIfAuthed() {
  const { user, token, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    const isAuthed = Boolean(token && user);
    if (!isAuthed) return;

    const params = new URLSearchParams(location.search);
    const qsRedirect = params.get("redirect");
    const stateFrom = location.state?.from;

    const roleDefault =
      user?.role === "sponsor" ? "/dashboard/sponsor" : "/dashboard/creator";

    navigate(qsRedirect || stateFrom || roleDefault, { replace: true });
  }, [loading, token, user, location, navigate]);
}
