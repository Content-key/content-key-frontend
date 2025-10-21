import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/axios';

function Pill({ value }) {
  const v = String(value || '').toLowerCase();
  const base = {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '.02em',
    border: '1px solid',
    textTransform: 'capitalize',
  };
  if (v === 'approved') {
    return <span style={{ ...base, background: '#e6ffed', color: '#05632a', borderColor: '#b6f0c2' }}>{v}</span>;
  }
  if (v === 'denied' || v === 'declined') {
    return <span style={{ ...base, background: '#ffecec', color: '#841b1b', borderColor: '#f5b5b5' }}>{v}</span>;
  }
  return <span style={{ ...base, background: '#eef2ff', color: '#273492', borderColor: '#c7cffc' }}>{v || 'pending'}</span>;
}

export default function CreatorRequests() {
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all'); // all | pending | resolved
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // Prefer Mongo _id; then common alternates; never synthesize an id that the API can't delete.
  const canonicalId = (raw) => {
    const cands = [
      raw?._id,
      raw?.id,
      raw?.requestId,
      raw?.reqId,
      raw?.uuid,
    ];
    return cands.find(Boolean) || null;
  };

  const normalize = (raw) => {
    const id = canonicalId(raw);
    const status = String(raw?.status || 'pending').toLowerCase();
    const jobTitle = raw?.jobTitle || raw?.job?.title || 'Untitled Job';
    const createdAt = raw?.createdAt || raw?.requestedAt || raw?.created_on || raw?.timestamp;
    const resolvedAt = raw?.resolvedAt || raw?.updatedAt;
    const reason = raw?.reason || raw?.note || raw?.message;
    return { id, status, jobTitle, createdAt, resolvedAt, reason, _raw: raw };
  };

  const fetchFromMy = async (signal) => {
    const res = await api.get(
      `/api/requests/my?status=${encodeURIComponent(statusFilter)}&page=1&pageSize=50`,
      { signal }
    );
    const arr = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : [];
    return arr.map(normalize);
  };

  const fetchFromGeneric = async (signal) => {
    const res = await api.get('/api/job-requests', { signal }).catch(() => ({ data: [] }));
    const arr = Array.isArray(res.data?.requests) ? res.data.requests : Array.isArray(res.data) ? res.data : [];
    const norm = arr.map(normalize);
    if (statusFilter === 'pending') return norm.filter((r) => (r.status || 'pending') === 'pending');
    if (statusFilter === 'resolved') return norm.filter((r) => (r.status || 'pending') !== 'pending');
    return norm;
  };

  const load = async (signal) => {
    setErr(''); setLoading(true);
    try {
      let data = [];
      try { data = await fetchFromMy(signal); }
      catch { data = await fetchFromGeneric(signal); }
      setItems(data);
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
    const t = setInterval(() => load(ctrl.signal), 15000);
    return () => { ctrl.abort(); clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const emptyText = useMemo(() => {
    if (statusFilter === 'pending') return "You don't have any pending requests yet.";
    if (statusFilter === 'resolved') return 'No approved/denied requests yet.';
    return 'No requests yet.';
  }, [statusFilter]);

  // ---- Delete logic ----
  // Always try /api/requests/:id with the canonical Mongo _id; if 404 at route-level, fall back.
  const attemptDelete = async (idLike, raw) => {
    // choose the most reliable id at call-time too (covers optimistic state edits)
    const id = canonicalId(raw) || idLike;

    // Primary (our real backend)
    try {
      await api.delete(`/api/requests/${encodeURIComponent(id)}`);
      return;
    } catch (e) {
      // If it was anything other than 404, bubble up (auth/network/server)
      if (e?.response?.status && e.response.status !== 404) throw e;
    }

    // Fallback (legacy alias some environments still expose)
    await api.delete(`/api/job-requests/${encodeURIComponent(id)}`);
  };

  const handleDelete = async (id, title) => {
    const ok = window.confirm(
      `Delete this request?\n\n${title || 'Request'}\n\nThis cannot be undone.`
    );
    if (!ok) return;

    const prev = items;
    const target = items.find((r) => r.id === id);
    setItems((cur) => cur.filter((r) => r.id !== id)); // optimistic

    try {
      await attemptDelete(id, target?._raw);
      console.log('Request deleted:', id);
    } catch (e) {
      setItems(prev); // revert
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        'Delete failed.';
      alert(msg);
      console.error('Delete request error:', e);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '40px auto', padding: 16 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
        <div>
          <h1 style={{ marginBottom: 8 }}>My Requests</h1>
          <p style={{ color: '#6b7280', marginTop: 0 }}>
            See whether your job requests were <strong>approved</strong> or <strong>denied</strong>.
          </p>
        </div>
        <Link
          to="/dashboard/creator"
          style={{
            textDecoration:'none',
            background:'#7c3aed',
            color:'#fff',
            border:'1px solid #7c3aed',
            borderRadius:12,
            padding:'10px 14px',
            fontWeight:800,
            boxShadow:'0 8px 20px rgba(124,58,237,0.25)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#6d28d9';
            e.currentTarget.style.borderColor = '#6d28d9';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = '#7c3aed';
            e.currentTarget.style.borderColor = '#7c3aed';
          }}
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div style={{ display:'flex', gap:8, alignItems:'center', margin:'12px 0 20px' }}>
        <label htmlFor="statusSel" style={{ fontSize: 14, color:'#6b7280' }}>Filter</label>
        <select
          id="statusSel"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding:'10px 12px',
            border:'1px solid #e5e7eb',
            borderRadius:10,
            background:'#fff',
            color:'#0b0b0b',
            outline:'none'
          }}
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved (Approved/Denied)</option>
        </select>
      </div>

      {loading && <div style={{ color:'#6b7280' }}>Loading…</div>}

      {err && !loading && (
        <div style={{ background:'#fff7e6', border:'1px solid #ffd591', color:'#8a5a00', padding:10, borderRadius:12, marginBottom:12 }}>
          {err}
        </div>
      )}

      {!loading && !err && items.length === 0 && (
        <div style={{ color:'#6b7280', padding:16, border:'1px dashed #e5e7eb', borderRadius:12 }}>
          {emptyText}
        </div>
      )}

      {!loading && !err && items.length > 0 && (
        <div style={{ display:'grid', gap:12 }}>
          {items.map((r) => (
            <div
              key={r.id || r._raw?._id || r._raw?.id}
              style={{
                border:'1px solid #e5e7eb',
                borderRadius:14,
                padding:14,
                display:'grid',
                gridTemplateColumns:'1fr auto',
                gap:8,
                alignItems:'center',
                background:'#fff',
                boxShadow:'0 8px 24px rgba(0,0,0,0.08)'
              }}
            >
              <div>
                <div style={{ fontWeight:800, fontSize:16.5, letterSpacing:'-0.01em' }}>{r.jobTitle}</div>
                <div style={{ fontSize:12.5, color:'#6b7280', marginTop:4 }}>
                  Requested: {r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}
                  {r.resolvedAt ? ` · Resolved: ${new Date(r.resolvedAt).toLocaleString()}` : ''}
                </div>
                {r.reason && (
                  <div style={{ fontSize:12.5, color:'#8a5a00', marginTop:8 }}>
                    Reason: {r.reason}
                  </div>
                )}
              </div>
              <div style={{ display:'grid', gap:8, justifyItems:'end', alignItems:'center' }}>
                <Pill value={r.status} />
                <button
                  onClick={() => handleDelete(r.id, r.jobTitle)}
                  title="Delete this request"
                  style={{
                    background:'#ef4444',
                    color:'#fff',
                    border:'1px solid #ef4444',
                    padding:'8px 12px',
                    borderRadius:12,
                    fontWeight:700,
                    cursor:'pointer'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#dc2626';
                    e.currentTarget.style.borderColor = '#dc2626';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#ef4444';
                    e.currentTarget.style.borderColor = '#ef4444';
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
