import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api/axios';

function StatusPill({ value }) {
  const v = String(value || '').toLowerCase();
  const style = {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'capitalize',
  };
  if (v === 'approved') Object.assign(style, { background: '#e6ffed', color: '#05632a', border: '1px solid #b6f0c2' });
  else if (v === 'denied' || v === 'declined') Object.assign(style, { background: '#ffecec', color: '#841b1b', border: '1px solid #f5b5b5' });
  else Object.assign(style, { background: '#eef2ff', color: '#273492', border: '1px solid #c7cffc' }); // pending/default
  return <span style={style}>{v || 'pending'}</span>;
}

export default function CreatorRequests() {
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all'); // all | pending | resolved
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async (signal) => {
    setErr('');
    setLoading(true);
    try {
      const res = await api.get(
        `/api/requests/my?status=${encodeURIComponent(statusFilter)}&page=1&pageSize=50`,
        { signal }
      );
      setItems(res.data?.items || []);
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to load requests';
      setErr(String(msg));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    const t = setInterval(() => load(ctrl.signal), 15000); // refresh every 15s
    return () => { ctrl.abort(); clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const emptyText = useMemo(() => {
    if (statusFilter === 'pending') return "You don't have any pending requests yet.";
    if (statusFilter === 'resolved') return 'No approved/denied requests yet.';
    return 'No requests yet.';
  }, [statusFilter]);

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 16 }}>
      <h1 style={{ marginBottom: 8 }}>My Requests</h1>
      <p style={{ color: '#555', marginTop: 0 }}>
        See whether your job requests were <strong>approved</strong> or <strong>denied</strong>.
      </p>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '12px 0 20px' }}>
        <label htmlFor="statusSel" style={{ fontSize: 14 }}>Filter</label>
        <select
          id="statusSel"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd' }}
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved (Approved/Denied)</option>
        </select>
      </div>

      {loading && <div>Loading…</div>}

      {err && !loading && (
        <div style={{ background: '#fff7e6', border: '1px solid #ffd591', color: '#8a5a00', padding: 10, borderRadius: 8, marginBottom: 12 }}>
          {err}
        </div>
      )}

      {!loading && !err && items.length === 0 && (
        <div style={{ color: '#666', padding: 12, border: '1px dashed #ddd', borderRadius: 8 }}>
          {emptyText}
        </div>
      )}

      {!loading && !err && items.length > 0 && (
        <div style={{ display: 'grid', gap: 10 }}>
          {items.map((r) => (
            <div
              key={r.id}
              style={{
                border: '1px solid #eee',
                borderRadius: 12,
                padding: 12,
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>{r.jobTitle || 'Untitled Job'}</div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                  Requested: {new Date(r.createdAt).toLocaleString()}
                  {r.resolvedAt ? ` · Resolved: ${new Date(r.resolvedAt).toLocaleString()}` : ''}
                </div>
                {r.reason && (
                  <div style={{ fontSize: 12, color: '#8a5a00', marginTop: 6 }}>
                    Reason: {r.reason}
                  </div>
                )}
              </div>
              <div style={{ justifySelf: 'end' }}>
                <StatusPill value={r.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
