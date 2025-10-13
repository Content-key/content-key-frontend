// client/src/hooks/useNotifications.js
// Poll unread notifications and trigger a callback on new items.
// Pauses when tab is hidden. Uses shared axios client (auth + 401 handled).

import { useEffect, useRef } from 'react';
import { api } from '../api/axios';

/**
 * useNotifications
 *
 * @param {Object} options
 * @param {() => Promise<string> | string} options.getToken   - function that returns a JWT (or a string token)
 * @param {(notif: any) => void} options.onAssignment          - called for new "assignment" notifications
 * @param {number} [options.intervalMs=15000]                  - polling interval (ms) when healthy
 * @param {string} [options.endpoint='/api/notifications?unreadOnly=true'] - endpoint path (relative to api baseURL)
 * @param {string[]} [options.types=['assignment']]            - notif types to trigger on
 */
export default function useNotifications({
  getToken,
  onAssignment,
  intervalMs = 15000,
  endpoint = '/api/notifications?unreadOnly=true',
  types = ['assignment'],
}) {
  const seenIdsRef = useRef(new Set());
  const timerRef = useRef(null);
  const backoffRef = useRef(0); // 0 -> healthy; increases on error

  useEffect(() => {
    let cancelled = false;

    const resolveToken = async () => {
      if (typeof getToken === 'function') {
        const maybe = getToken();
        return maybe && typeof maybe.then === 'function' ? await maybe : maybe;
      }
      return getToken || '';
    };

    const shouldPollNow = () => document.visibilityState === 'visible';

    const scheduleNext = (base = intervalMs) => {
      const backoffMs = Math.min(backoffRef.current * 2000, 30000); // cap 30s
      const delay = base + backoffMs;
      timerRef.current = setTimeout(tick, delay);
    };

    const tick = async () => {
      if (cancelled) return;

      // Skip polling while hidden; check again soon
      if (!shouldPollNow()) {
        scheduleNext(Math.max(4000, intervalMs)); // light idle check
        return;
      }

      try {
        const token = await resolveToken();
        if (!token) {
          scheduleNext(); // try again later
          return;
        }

        // Use axios instance (auth header added by interceptor)
        const res = await api.get(endpoint, {
          // mark that this is an authed call so our axios 401 guard knows
          headers: { 'X-CK-Notif': '1' },
        });

        const data = res?.data;
        const list = Array.isArray(data) ? data : (data.items || data.notifications || []);
        const unread = list.filter(n => n && (n.isRead === false || n.isRead === undefined));

        for (const n of unread) {
          const id = n._id || n.id;
          if (!id || seenIdsRef.current.has(id)) continue;

          // Fire only for desired types
          if (types.includes(n.type)) {
            if (n.type === 'assignment' && typeof onAssignment === 'function') {
              onAssignment(n);
            }
          }

          seenIdsRef.current.add(id);
        }

        // success → reset backoff
        backoffRef.current = 0;
        scheduleNext();
      } catch (_err) {
        // quiet fail; increase backoff a bit
        backoffRef.current = Math.min(backoffRef.current + 1, 15);
        scheduleNext();
      }
    };

    // kick once
    tick();

    const onVis = () => {
      if (document.visibilityState === 'visible') {
        // immediate check when returning to the tab
        if (timerRef.current) clearTimeout(timerRef.current);
        backoffRef.current = 0;
        tick();
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVis);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, intervalMs, onAssignment, getToken, types.join('|')]);
}
