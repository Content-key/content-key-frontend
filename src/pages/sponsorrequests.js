// src/pages/SponsorRequests.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../api/axios';
import { useNavigate } from 'react-router-dom';
import './SponsorDashboard.css';

export default function SponsorRequests() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'resolved' | 'all'
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  // ⬇️ pending badge
  const [pendingCount, setPendingCount] = useState(0);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2400);
  };

  // Inbox always returns { requests: [...] }
  const toArray = (data) => (Array.isArray(data?.requests) ? data.requests : []);

  const refreshPendingCount = async () => {
    try {
      const { data } = await api.get('/api/requests/inbox', {
        params: { status: 'pending' },
      });
      const arr = toArray(data);
      setPendingCount(arr.length);
    } catch {
      // noop
    }
  };

  const fetchData = async (status = activeTab, p = page) => {
    setLoading(true);
    setError('');
    try {
      // Use the rich inbox endpoint for all tabs (supports status=pending|resolved|all)
      const { data } = await api.get('/api/requests/inbox', {
        params: { status },
      });

      const arr = toArray(data);
      setItems(arr);
      setTotal(arr.length);
      setPage(1);

      // keep badge in sync
      if (status === 'pending') setPendingCount(arr.length);
    } catch (e) {
      console.error('Fetch requests error:', e);
      setError(e?.response?.data?.error || 'Failed to load requests');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData('pending', 1);
    refreshPendingCount();
    const t = setInterval(refreshPendingCount, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onTab = (tab) => {
    setActiveTab(tab);
    fetchData(tab, 1);
  };

  const approve = async (id) => {
    const prev = items;
    setItems((list) => list.filter((r) => (r._id || r.id) !== id)); // optimistic remove
    try {
      await api.patch(`/api/requests/${id}/approve`);
      showToast('✅ Request approved');
      if (activeTab !== 'pending') fetchData(activeTab, page);
      refreshPendingCount();
    } catch (e) {
      console.error('Approve error:', e);
      setItems(prev); // rollback
      showToast(e?.response?.data?.error || 'Failed to approve');
    }
  };

  const deny = async (id) => {
    const reason = window.prompt('Optional reason:', '') || undefined;
    const prev = items;
    setItems((list) => list.filter((r) => (r._id || r.id) !== id)); // optimistic remove
    try {
      await api.patch(`/api/requests/${id}/deny`, reason ? { reason } : {});
      showToast('🛑 Request denied');
      if (activeTab !== 'pending') fetchData(activeTab, page);
      refreshPendingCount();
    } catch (e) {
      console.error('Deny error:', e);
      setItems(prev); // rollback
      showToast(e?.response?.data?.error || 'Failed to deny');
    }
  };

  // 🧹 NEW: soft-archive resolved requests (optionally older than N days)
  const clearResolved = async () => {
    const older = window.prompt('Archive resolved requests older than how many days? (Leave blank for ALL)', '');
    const olderNum = older && !Number.isNaN(Number(older)) && Number(older) > 0 ? Number(older) : null;

    const proceed = window.confirm(
      olderNum
        ? `Archive resolved requests older than ${olderNum} day(s)?`
        : 'Archive ALL resolved requests?'
    );
    if (!proceed) return;

    try {
      const q = olderNum ? `?olderThanDays=${olderNum}` : '';
      const { data } = await api.delete(`/api/requests/resolved${q}`);
      showToast(`🧹 Archived ${data?.archived ?? 0} resolved`);
      if (activeTab === 'resolved') fetchData('resolved', 1);
    } catch (e) {
      console.error('Clear resolved error:', e);
      showToast(e?.response?.data?.error || 'Failed to clear resolved');
    }
  };

  const prevPage = () => {
    if (page <= 1) return;
    fetchData(activeTab, page - 1);
  };
  const nextPage = () => {
    if (page * pageSize >= total) return;
    fetchData(activeTab, page + 1);
  };

  // ------- format helpers -------
  const fmtMiles = (n) => (typeof n === 'number' ? `${n.toFixed(1)} miles away` : '—');
  const cityState = (city, state) =>
    [city, state].filter(Boolean).join(', ') || '—';
  const when = (d) => (d ? new Date(d).toLocaleString() : '—');

  return (
    <div className="dashboard-wrapper">
      <div className="form-section">
        <h1>
          Requests Inbox{' '}
          {pendingCount > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 8,
                minWidth: 20,
                height: 20,
                padding: '0 6px',
                borderRadius: 12,
                background: '#e60023',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                lineHeight: 1
              }}
            >
              {pendingCount}
            </span>
          )}
        </h1>

        {/* Nav buttons */}
        <div style={{ marginBottom: 10, display: 'flex', gap: 10 }}>
          <button className="home-btn" onClick={() => navigate('/')}>Home</button>
          <button onClick={() => fetchData(activeTab, page)}>Refresh</button>
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ marginBottom: 16 }}>
          <button
            className={activeTab === 'pending' ? 'active-tab' : ''}
            onClick={() => onTab('pending')}
          >
            Pending{' '}
            {pendingCount > 0 && (
              <span
                style={{
                  marginLeft: 6,
                  minWidth: 22,
                  height: 22,
                  padding: '0 6px',
                  borderRadius: 999,
                  fontSize: 12,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.15)'
                }}
              >
                {pendingCount}
              </span>
            )}
          </button>
          <button
            className={activeTab === 'resolved' ? 'active-tab' : ''}
            onClick={() => onTab('resolved')}
          >
            Resolved
          </button>
          <button
            className={activeTab === 'all' ? 'active-tab' : ''}
            onClick={() => onTab('all')}
          >
            All
          </button>
        </div>

        {/* 🧹 Clear Resolved (only show on Resolved tab) */}
        {activeTab === 'resolved' && (
          <div style={{ marginBottom: 10 }}>
            <button className="danger-btn" onClick={clearResolved}>
              🧹 Clear Resolved
            </button>
          </div>
        )}

        {error && <p style={{ color: 'crimson' }}>{error}</p>}

        {/* List */}
        <div className="job-results">
          {loading ? (
            <p>Loading…</p>
          ) : items.length === 0 ? (
            <p>No {activeTab} requests.</p>
          ) : (
            <ul className="job-list">
              {items.map((r) => {
                const id = r.id || r._id;

                return (
                  <li key={id} className="job-card" style={{ padding: 16 }}>
                    <h3>{r.jobTitle || 'Job'}</h3>

                    <p>
                      <strong>Agent:</strong> {r.agentName || '—'}
                    </p>
                    <p>
                      <strong>Creator:</strong>{' '}
                      {r.creatorName || r.stageName || '—'}{' '}
                      <span style={{ color: '#555' }}>
                        ({cityState(r.creatorCity, r.creatorState)})
                      </span>
                    </p>
                    <p>
                      <strong>Distance:</strong> {fmtMiles(r.distanceMiles)}
                    </p>

                    <p style={{ marginTop: 6 }}>
                      <strong>Job Location:</strong>{' '}
                      {cityState(r.jobCity, r.jobState)}
                      {r.jobRadiusMiles != null && (
                        <> · <strong>Radius:</strong> {r.jobRadiusMiles} miles</>
                      )}
                    </p>

                    {r.note ? (
                      <p style={{ marginTop: 6 }}>
                        <strong>Note from creator:</strong> {r.note}
                      </p>
                    ) : null}

                    <p style={{ marginTop: 6 }}>
                      <strong>Requested:</strong> {when(r.createdAt)}
                    </p>

                    {activeTab === 'pending' ? (
                      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                        <button
                          className="active-tab"
                          style={{ background: 'green', color: '#fff' }}
                          onClick={() => approve(id)}
                        >
                          Approve
                        </button>
                        <button className="danger-btn" onClick={() => deny(id)}>
                          Deny
                        </button>
                      </div>
                    ) : (
                      <p style={{ marginTop: 6 }}>
                        <strong>Status:</strong> {r.status || '—'}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {/* Pagination controls kept for parity (not needed for inbox right now) */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={prevPage} disabled={page <= 1}>Prev</button>
            <span style={{ alignSelf: 'center' }}>
              Page {page} · {total} total
            </span>
            <button
              onClick={nextPage}
              disabled={page * pageSize >= total}
            >
              Next
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast && <div className="success-popup">{toast}</div>}
      </div>
    </div>
  );
}
