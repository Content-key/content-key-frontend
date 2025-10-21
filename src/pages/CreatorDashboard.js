// src/pages/CreatorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './SponsorDashboard.css';

import { api } from '../api/axios';
import { useAuth } from '../auth/AuthProvider';
import useNotifications from '../hooks/useNotifications';

function CreatorDashboard() {
  const [upForGrabsJobs, setUpForGrabsJobs] = useState([]);
  const [localJobs, setLocalJobs] = useState([]);
  const [outsideRadiusJobs, setOutsideRadiusJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [pendingJobs, setPendingJobs] = useState([]);
  const [pastJobs, setPastJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('upForGrabs');
  const [userName, setUserName] = useState('');
  const [err, setErr] = useState('');

  // allow blank; blank means “0” (show no local jobs)
  const [radiusMiles, setRadiusMiles] = useState('25');

  // 🔹 Request Inbox badge count
  const [reqCount, setReqCount] = useState(0);

  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    const name = authUser?.stageName || authUser?.fullName || 'Creator';
    setUserName(name);
  }, [authUser]);

  // Initial load
  useEffect(() => {
    handleTabClick('upForGrabs');
    fetchCreatorRequestCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- payout helper ----
  const getPayoutString = (job) => {
    const stored = job?.creatorPayoutPerCreator;
    if (stored != null && !Number.isNaN(Number(stored))) {
      return Number(stored).toFixed(2);
    }
    const FEE = 0.15;
    const budgetNum = Number(job?.budget || 0);
    const split = Number(job?.splitCount || 1) || 1;
    const cents = Math.round(budgetNum * 100);
    const netCents = Math.round(cents * (1 - FEE));
    const perCreatorCents = Math.floor(netCents / split);
    return (perCreatorCents / 100).toFixed(2);
  };

  const fetchAcceptedJobs = async () => {
    const { data } = await api.get('/api/jobs/my-jobs');
    return data.jobs || [];
  };

  // Visible jobs from server (server enforces geo & UFG logic)
  const fetchVisibleJobs = async () => {
    setLoading(true);
    setErr('');
    try {
      // normalize radius: blank/invalid -> 0; cap to 5000 like backend
      const n = Number.parseFloat(radiusMiles);
      let radiusParam = Number.isFinite(n) && n >= 0 ? n : 0;
      if (radiusParam > 5000) radiusParam = 5000;

      const { data } = await api.get('/api/jobs/visible', {
        params: { radiusMiles: radiusParam },
      });

      const list = Array.isArray(data?.jobs) ? data.jobs : [];
      const outside = Array.isArray(data?.outsideRadiusJobs)
        ? data.outsideRadiusJobs
        : [];

      setUpForGrabsJobs(list.filter((j) => j?.isUpForGrabs === true));
      setLocalJobs(list.filter((j) => j?.isUpForGrabs !== true));
      setOutsideRadiusJobs(outside);
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to load jobs';
      setErr(msg);
      setUpForGrabsJobs([]);
      setLocalJobs([]);
      setOutsideRadiusJobs([]);
    } finally {
      setLoading(false);
    }
  };

  // kept: my/pending/past flows
  const fetchMyJobs = async () => {
    setLoading(true);
    try {
      const jobs = await fetchAcceptedJobs();
      const filtered = jobs.filter(
        (job) =>
          job.status === 'Pending' &&
          (!job.submittedLinks || job.submittedLinks.length === 0)
      );
      setMyJobs(filtered);
    } catch (err) {
      console.error('Fetch my jobs error:', err);
    }
    setLoading(false);
  };

  const fetchPendingJobs = async () => {
    setLoading(true);
    try {
      const jobs = await fetchAcceptedJobs();
      const pending = jobs.filter(
        (job) =>
          job.status === 'Submitted' &&
          job.submittedLinks &&
          job.submittedLinks.length > 0
      );
      setPendingJobs(pending);
    } catch (err) {
      console.error('Fetch pending jobs error:', err);
    }
    setLoading(false);
  };

  const fetchPastJobs = async () => {
    setLoading(true);
    try {
      const jobs = await fetchAcceptedJobs();
      const past = jobs.filter(
        (job) =>
          job.status === 'Approved' &&
          job.submittedLinks &&
          job.submittedLinks.length > 0
      );
      setPastJobs(past);
    } catch (err) {
      console.error('Fetch past jobs error:', err);
    }
    setLoading(false);
  };

  const handleTabClick = (type) => {
    setView(type);
    if (type === 'upForGrabs' || type === 'localJobs') fetchVisibleJobs();
    if (type === 'myJobs') fetchMyJobs();
    if (type === 'pendingJobs') fetchPendingJobs();
    if (type === 'pastJobs') fetchPastJobs();
  };

  const handleAccept = async (jobId) => {
    try {
      await api.post('/api/accepted-jobs', { jobId });
      alert('✅ Job accepted!');
      fetchVisibleJobs();
      fetchMyJobs();
    } catch (err) {
      const msg = err?.response?.data?.error || '❌ Failed to accept job';
      alert(msg);
      console.error('Accept job error:', err);
    }
  };

  // 🔹 fetch creator's request count (client-filtered as a fallback)
  const fetchCreatorRequestCount = async () => {
    try {
      const res = await api.get('/api/job-requests').catch(() => ({ data: [] }));
      const arr = Array.isArray(res.data?.requests)
        ? res.data.requests
        : Array.isArray(res.data)
        ? res.data
        : [];

      const myId = authUser?._id;
      const mine = arr.filter(
        (r) =>
          r?.requesterId === myId ||
          r?.creatorId === myId ||
          r?.actor === 'creator'
      );

      const active = mine.filter((r) =>
        ['pending', 'approved'].includes(String(r?.status || 'pending').toLowerCase())
      );
      setReqCount(active.length);
    } catch {
      setReqCount(0);
    }
  };

  const handleRequestAccess = async (jobId) => {
    try {
      const note = window.prompt(
        'Optional note to sponsor (why you can do this job):',
        ''
      );
      await api.post('/api/job-requests', { jobId, note: note || '' });
      alert('✅ Request sent to sponsor!');
      setReqCount((n) => (Number.isFinite(n) ? n + 1 : 1));
      fetchCreatorRequestCount();
    } catch (err) {
      const code = err?.response?.status;
      const msg =
        err?.response?.data?.error ||
        (code === 404
          ? 'Request service not available yet.'
          : '❌ Failed to send request');
      alert(msg);
      console.error('Request access error:', err);
    }
  };

  // Token resolver for notifications hook
  const getTokenFromStorage = () => {
    try {
      const raw = localStorage.getItem('ck_auth');
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed?.token || parsed?.accessToken || '';
      }
    } catch {}
    return (
      localStorage.getItem('ck_token') || localStorage.getItem('token') || ''
    );
  };

  // Wire notifications → refresh My Jobs on assignment
  useNotifications({
    getToken: getTokenFromStorage,
    onAssignment: () => {
      setView('myJobs');
      fetchMyJobs();
    },
  });

  const getDisplayedJobs = () => {
    if (view === 'myJobs') return myJobs;
    if (view === 'localJobs') return localJobs;
    if (view === 'upForGrabs') return upForGrabsJobs;
    if (view === 'pendingJobs') return pendingJobs;
    if (view === 'pastJobs') return pastJobs;
    return [];
  };

  // If Local tab has a geo error, show banner but DO NOT block dashboard
  const showLocalGeoBanner =
    view === 'localJobs' && err === 'Your profile is missing latitude/longitude';

  const showFilterBar = view === 'localJobs' || view === 'upForGrabs';

  return (
    <div className="dashboard-wrapper">
      <div className="form-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <h1>Creator Dashboard</h1>
            <h2 style={{ marginBottom: '10px' }}>👋 Welcome, {userName}!</h2>
          </div>

          {/* 📫 Requests Inbox button (purple w/ badge) */}
          <Link
            to="/creator/requests"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 12,
              textDecoration: 'none',
              fontWeight: 800,
              background: '#7c3aed',        // violet-600
              border: '1px solid #7c3aed',
              color: '#ffffff',
              boxShadow: '0 8px 20px rgba(124, 58, 237, 0.25)'
            }}
            onMouseEnter={fetchCreatorRequestCount}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#6d28d9'; // violet-700
              e.currentTarget.style.borderColor = '#6d28d9';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#7c3aed';
              e.currentTarget.style.borderColor = '#7c3aed';
            }}
            aria-label={`Open Requests Inbox${reqCount ? ` (${reqCount})` : ''}`}
          >
            <span>📫 Requests Inbox</span>
            {reqCount > 0 && (
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
                  background: 'rgba(255,255,255,0.18)'
                }}
              >
                {reqCount}
              </span>
            )}
          </Link>
        </div>

        <div className="tabs" style={{ marginTop: 12 }}>
          <button
            className={view === 'upForGrabs' ? 'active-tab' : ''}
            onClick={() => handleTabClick('upForGrabs')}
          >
            Up for Grabs
          </button>
          <button
            className={view === 'localJobs' ? 'active-tab' : ''}
            onClick={() => handleTabClick('localJobs')}
          >
            Local Jobs
          </button>
          <button
            className={view === 'myJobs' ? 'active-tab' : ''}
            onClick={() => handleTabClick('myJobs')}
          >
            My Jobs
          </button>
          <button
            className={view === 'pendingJobs' ? 'active-tab' : ''}
            onClick={() => handleTabClick('pendingJobs')}
          >
            Pending
          </button>
          <button
            className={view === 'pastJobs' ? 'active-tab' : ''}
            onClick={() => handleTabClick('pastJobs')}
          >
            Past Jobs
          </button>
        </div>

        {showLocalGeoBanner && (
          <p style={{ color: 'crimson', marginTop: 6 }}>
            Update your address in Settings to see Local Jobs.
          </p>
        )}

        {/* Radius filter bar */}
        {showFilterBar && (
          <div
            className="filter-bar"
            style={{ display: 'flex', gap: 10, margin: '10px 0' }}
          >
            <label className="inline-label">
              <span>
                <strong>Radius (miles)</strong>
              </span>
              <input
                type="number"
                min="0"
                placeholder="e.g. 25"
                value={radiusMiles}
                onChange={(e) => setRadiusMiles(e.target.value)}
                style={{ padding: 6, width: 120 }}
              />
            </label>
            <button onClick={fetchVisibleJobs} style={{ padding: '8px 12px' }}>
              Refresh
            </button>
          </div>
        )}

        {view === 'pendingJobs' && (
          <>
            <p className="info-text">
              These jobs have been submitted and are awaiting sponsor approval.
            </p>
            <ul className="job-list">
              {pendingJobs.map((job) => (
                <li key={job._id} className="job-card">
                  <h3>{job.title}</h3>
                  <p>{job.description}</p>
                  <p>
                    <strong>Payout:</strong> ${getPayoutString(job)}
                  </p>
                  <ul>
                    {job.submittedLinks?.map((link, index) => (
                      <li key={index}>
                        <a href={link} target="_blank" rel="noopener noreferrer">
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                  <span className="badge-warning">⏳ Pending Sponsor Approval</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {view === 'pastJobs' && (
          <>
            <p className="info-text">These are your completed jobs.</p>
            <ul className="job-list">
              {pastJobs.map((job) => (
                <li key={job._id} className="job-card">
                  <h3>{job.title}</h3>
                  <p>{job.description}</p>
                  <p>
                    <strong>Payout:</strong> ${getPayoutString(job)}
                  </p>
                  <span className="badge-complete">✅ Approved & Paid</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {loading ? (
          <p>Loading jobs...</p>
        ) : (
          <>
            {/* Primary jobs list (UFG or Local eligible) */}
            <ul className="job-list">
              {getDisplayedJobs().map((job) => (
                <li key={job._id} className="job-card">
                  <h3>{job.title}</h3>
                  <p>{job.description}</p>
                  <p>
                    <strong>Payout:</strong> ${getPayoutString(job)}
                  </p>
                  <p>
                    <strong>Agent Name:</strong> {job.agentName}</p>
                  <p>
                    <strong>Agent Contact:</strong> {job.agentPhone}</p>
                  <p>
                    <strong>Location:</strong>{' '}
                    {[job.city, job.state].filter(Boolean).join(', ') || '—'}
                  </p>
                  {job.radiusMiles != null && (
                    <p><strong>Radius:</strong> {job.radiusMiles} miles</p>
                  )}
                  {['upForGrabs', 'localJobs'].includes(view) && (
                    <button onClick={() => handleAccept(job._id)}>
                      Accept Job
                    </button>
                  )}
                  {view === 'myJobs' && (
                    <>
                      <p><em>No content links submitted yet</em></p>
                      <MultiLinkSubmit
                        jobId={job.acceptedJobId}
                        onSubmitSuccess={fetchMyJobs}
                      />
                    </>
                  )}
                </li>
              ))}
            </ul>

            {/* Outside-radius section (request access) */}
            {view === 'localJobs' && outsideRadiusJobs.length > 0 && (
              <>
                <h3 style={{ marginTop: 20 }}>
                  Outside Your Radius (Request Access)
                </h3>
                <p className="info-text">
                  These are within your search distance but outside the sponsor’s
                  radius. Send a request to be considered.
                </p>
                <ul className="job-list">
                  {outsideRadiusJobs.map((job) => (
                    <li key={job._id} className="job-card">
                      <h3>{job.title}</h3>
                      <p>{job.description}</p>
                      <p><strong>Payout:</strong> ${getPayoutString(job)}</p>
                      {typeof job.distanceMiles === 'number' && (
                        <p><strong>Distance:</strong> {job.distanceMiles.toFixed(1)} miles away</p>
                      )}
                      {job.radiusMiles != null && (
                        <p><strong>Sponsor Radius:</strong> {job.radiusMiles} miles</p>
                      )}
                      <p><em>Outside radius — request access</em></p>
                      <button onClick={() => handleRequestAccess(job._id)}>
                        Request Access
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>

      <div className="tips-section">
        <h3>🎓 Creator Tips</h3>
        <ul>
          <li>🏷️ Get a business address — build trust with sponsors</li>
          <li>📛 Earn your Certification Badge to access big-money sponsors</li>
          <li>🎥 Turn your content into income — this is the future of business</li>
          <li>💼 Learn how to treat your videos like a business — <strong>take our class today</strong></li>
        </ul>
        <button
          className="home-btn"
          style={{ marginRight: '10px', backgroundColor: 'black', color: 'white' }}
          onClick={() => navigate('/')}
        >
          Home
        </button>
        <button
          className="settings-btn"
          style={{ backgroundColor: 'blue', color: 'white', marginRight: '10px' }}
          onClick={() => navigate('/settings')}
        >
          Settings
        </button>
        <button
          className="danger-btn"
          style={{ backgroundColor: 'red', color: 'white' }}
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

function MultiLinkSubmit({ jobId, onSubmitSuccess }) {
  const [links, setLinks] = useState([{ type: 'YouTube', url: '' }]);

  const handleChange = (index, field, value) => {
    const updated = [...links];
    updated[index][field] = value;
    setLinks(updated);
  };

  const addField = () => setLinks([...links, { type: 'YouTube', url: '' }]);
  const removeField = (index) => setLinks(links.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedLinks = links.map((link) => link.url);
      await api.post('/api/accepted-jobs/submit-links', {
        jobId,
        contentLinks: formattedLinks,
      });
      alert('Links submitted!');
      onSubmitSuccess();
    } catch (error) {
      console.error(error);
      const msg = error?.response?.data?.error || 'Submission failed.';
      alert(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="multi-link-form">
      {links.map((link, index) => (
        <div key={index} className="link-input-group">
          <select
            value={link.type}
            onChange={(e) => handleChange(index, 'type', e.target.value)}
          >
            <option>YouTube</option>
            <option>Facebook</option>
            <option>Instagram</option>
            <option>Other</option>
          </select>
          <input
            type="url"
            placeholder={`Link ${index + 1}`}
            value={link.url}
            onChange={(e) => handleChange(index, 'url', e.target.value)}
            required
          />
          <button type="button" onClick={() => removeField(index)}>
            ❌
          </button>
        </div>
      ))}
      <button type="button" onClick={addField}>
        + Add Another Link
      </button>
      <button type="submit">Submit Links</button>
    </form>
  );
}

export default CreatorDashboard;
