// src/pages/SponsorRequests.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../api/axios';
import { useNavigate } from 'react-router-dom';
import './SponsorDashboard.css';

export default function SponsorRequests() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'resolved'
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

  const refreshPendingCount = async () => {
    try {
      // Use inbox count for accuracy with new endpoint
      const { data } = await api.get('/api/requests/inbox');
      setPendingCount(Array.isArray(data?.requests) ? data.requests.length : 0);
    } catch {/* noop */}
  };

  const fetchData = async (status = activeTab, p = page) => {
    setLoading(true);
    setError('');
    try {
      if (status === 'pending') {
        // ✅ Use the new snapshot-based endpoint
        const { data } = await api.get('/api/requests/inbox');
        const arr = Array.isArray(data?.requests) ? data.requests : [];
        setItems(arr);
        setTotal(arr.length);
        setPage(1);
      } else {
        // Keep existing resolved listing w/ pagination
        const { data } = await api.get('/api/requests', {
          params: { status, page: p, pageSize }
        });
        setItems(Array.isArray(data?.items) ? data.items : []);
        setTotal(Number(data?.total || 0));
        setPage(Number(data?.page || 1));
      }

      if (status === 'pending') setPendingCount((prev) => prev); // already refreshed by inbox
    } catch (e) {
      console.error('Fetch requests error:', e);
      setError(e?.response?.data?.error || 'Failed to load requests');
      setItems([]);
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
      if (activeTab === 'resolved') fetchData('resolved', page);
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
      if (activeTab === 'resolved') fetchData('resolved', page);
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

  // ------- helpers to render either shape (inbox snapshots or resolved list) -------
  const getJobTitle = (r) => r.jobTitle || r.jobId?.title || 'Request';
  const getJobIdStr = (r) => (typeof r.jobId === 'object' ? r.jobId?._id : r.jobId);
  const getCreatorDisplay = (r) =>
    r.stageName || r.creatorName ||
    r.creatorId?.stageName || r.creatorId?.fullName || r.creatorId?.email ||
    (typeof r.creatorId === 'string' ? r.creatorId : 'Unknown');
  const getDistance = (r) => {
    const v = r.distanceMiles ?? r.creatorToJobMiles ?? r.sponsorToJobMiles;
    return typeof v === 'number' ? `${v.toFixed(1)} mi` : null;
  };
  const getLocation = (r) =>
    r.city || r.state ? `${r.city || ''}${r.city && r.state ? ', ' : ''}${r.state || ''}` : null;

  const badge = (count) =>
    count > 0 ? (
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
          lineHeight: 1,
        }}
        aria-label={`${count} pending request${count === 1 ? '' : 's'}`}
        role="status"
      >
        {count}
      </span>
    ) : null;

  return (
    <div className="dashboard-wrapper">
      <div className="form-section">
        <h1>
          Requests Inbox {badge(pendingCount)}
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
            Pending {badge(pendingCount)}
          </button>
          <button
            className={activeTab === 'resolved' ? 'active-tab' : ''}
            onClick={() => onTab('resolved')}
          >
            Resolved
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
                const id = r._id || r.id;
                const title = getJobTitle(r);
                const jobIdStr = getJobIdStr(r);
                const creator = getCreatorDisplay(r);
                const distance = getDistance(r);
                const loc = getLocation(r);

                return (
                  <li key={id} className="job-card" style={{ padding: 16 }}>
                    <h3>{title}</h3>

                    <p><strong>Request ID:</strong> {id}</p>
                    <p><strong>Job ID:</strong> {jobIdStr}</p>
                    <p><strong>Creator:</strong> {creator}</p>
                    {loc && <p><strong>Location:</strong> {loc}</p>}
                    {distance && <p><strong>Distance:</strong> {distance}</p>}
                    {r.note ? <p><strong>Note:</strong> {r.note}</p> : null}
                    <p><strong>Created:</strong> {new Date(r.createdAt).toLocaleString()}</p>

                    {activeTab === 'pending' ? (
                      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
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
                      <>
                        <p><strong>Status:</strong> {r.status}</p>
                        <p><strong>Resolved:</strong> {r.resolvedAt ? new Date(r.resolvedAt).toLocaleString() : '—'}</p>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {/* Pagination (resolved tab only effectively) */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={prevPage} disabled={page <= 1 || activeTab === 'pending'}>Prev</button>
            <span style={{ alignSelf: 'center' }}>
              Page {page} · {total} total
            </span>
            <button
              onClick={nextPage}
              disabled={activeTab === 'pending' || page * pageSize >= total}
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
