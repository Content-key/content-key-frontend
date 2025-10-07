// client/src/hooks/useNotifications.js
// Poll unread notifications and trigger a callback on new "assignment" items.
// Minimal, no side effects beyond calling your onAssignment() handler.
// Does NOT mark notifications read (to avoid backend changes).

import { useEffect, useRef } from 'react';

/**
 * useNotifications
 *
 * @param {Object} options
 * @param {() => Promise<string> | string} options.getToken  - function that returns a JWT (or a string token)
 * @param {(notif: any) => void} options.onAssignment         - called when a new assignment notification appears
 * @param {number} [options.intervalMs=15000]                 - polling interval
 * @param {string} [options.baseUrl]                          - API base; defaults to REACT_APP_API_BASE or http://localhost:5000
 * @param {string} [options.endpoint]                         - notifications endpoint path
 *
 * Endpoint defaults to `/api/notifications?unreadOnly=true`.
 * If your API doesn’t support that filter yet, you can pass `/api/notifications`
 * and we’ll client-filter by `isRead === false`.
 */
export default function useNotifications({
  getToken,
  onAssignment,
  intervalMs = 15000,
  baseUrl = process.env.REACT_APP_API_BASE || 'http://localhost:5000',
  endpoint = '/api/notifications?unreadOnly=true',
}) {
  const seenIdsRef = useRef(new Set());
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function resolveToken() {
      if (typeof getToken === 'function') {
        const maybe = getToken();
        // support async getToken
        return maybe && typeof maybe.then === 'function' ? await maybe : maybe;
      }
      return getToken || '';
    }

    async function fetchNotifications() {
      try {
        const token = await resolveToken();
        if (!token) return;

        const url = `${baseUrl}${endpoint}`;
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (!res.ok) return;
        const data = await res.json();

        // Support either { items: [...] } or raw array
        const list = Array.isArray(data) ? data : (data.items || data.notifications || []);

        // If server didn’t filter unread, do a light client-side filter
        const unread = list.filter(n => n && (n.isRead === false || n.isRead === undefined));

        for (const n of unread) {
          const id = n._id || n.id;
          if (!id || seenIdsRef.current.has(id)) continue;

          // Only react to assignment notifications
          if (n.type === 'assignment' && typeof onAssignment === 'function') {
            onAssignment(n);
          }

          // Mark as seen locally so we don't spam the callback
          seenIdsRef.current.add(id);
        }
      } catch {
        // quiet fail; avoid console spam in production UI
      }
    }

    // kick once immediately
    fetchNotifications();

    // start interval
    timerRef.current = setInterval(fetchNotifications, intervalMs);

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, endpoint, intervalMs, onAssignment, getToken]);
}
