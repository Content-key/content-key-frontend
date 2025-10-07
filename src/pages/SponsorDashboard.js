// src/pages/SponsorDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './SponsorDashboard.css';

import { api } from '../api/axios';            // ⬅️ shared axios instance
import { useAuth } from '../auth/AuthProvider'; // ⬅️ auth context

function SponsorDashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reuse message/popup for notifications too
  const [message, setMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);

  const [activeTab, setActiveTab] = useState('posted');
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();
  const { logout } = useAuth();

  // ⬇️ NEW: live badge for pending requests
  const [pendingReqCount, setPendingReqCount] = useState(0);

  // ⬇️ Track which notification IDs we've already surfaced (avoid duplicate popups)
  const seenNotifIdsRef = useRef(new Set());

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    jobType: 'upForGrabs',
    dueDate: '',
    repeatCount: '1',
    multiple: false,
    agentName: 'Curtis Mckinney',
    agentPhone: '540-642-6867',
    // radius in miles for location-based jobs
    radiusMiles: '25',
  });

  useEffect(() => {
    // read user from ck_auth (AuthProvider storage)
    const raw = localStorage.getItem('ck_auth');
    if (raw) {
      try {
        const { user } = JSON.parse(raw);
        if (user) setUserName(user.fullName || user.businessName || 'Sponsor');
      } catch {}
    }
    fetchJobs();
    refreshPendingCount();     // ⬅️ keep badge in sync on load
    startSponsorPolling();     // ⬅️ begin notification polling
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const repeat = parseInt(formData.repeatCount) || 1;
      const totalBudget = parseFloat(formData.budget);
      const perJobBudget = formData.multiple ? Number((totalBudget / repeat).toFixed(2)) : totalBudget;

      const payload = {
        ...formData,
        repeatCount: repeat,
        budget: perJobBudget,
        multiple: Boolean(formData.multiple),
        agentName: 'Curtis Mckinney',
        agentPhone: '540-642-6867',
      };

      // Ensure radiusMiles is a number
      if (payload.radiusMiles !== '' && payload.radiusMiles !== undefined && payload.radiusMiles !== null) {
        payload.radiusMiles = Number(payload.radiusMiles);
      }

      const { data } = await api.post('/api/jobs', payload);

      // Use the same popup for success messages
      setMessage(data.message || 'Job posted');
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);

      setFormData({
        title: '',
        description: '',
        budget: '',
        jobType: 'upForGrabs',
        dueDate: '',
        repeatCount: '1',
        multiple: false,
        agentName: 'Curtis Mckinney',
        agentPhone: '540-642-6867',
        radiusMiles: '25',
      });
      setActiveTab('posted');
      fetchJobs();
    } catch (err) {
      const msg = err?.response?.data?.error || 'Something went wrong';
      setMessage(msg);
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
      console.error('Job post error:', err);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/jobs/sponsor/posted-jobs');
      setJobs(data.jobs || []);
    } catch (err) {
      console.error('Fetch error:', err);
    }
    setLoading(false);
  };

  // ⬇️ NEW: lightweight fetch to keep the Pending badge updated everywhere
  const refreshPendingCount = async () => {
    try {
      // tiny page; we only need total
      const { data } = await api.get('/api/requests', {
        params: { status: 'pending', page: 1, pageSize: 1 },
      });
      setPendingReqCount(Number(data?.total || 0));
    } catch {
      // ignore; badge is non-blocking
    }
  };

  // ⬇️ NEW: poll sponsor notifications and raise a toast when a creator request arrives
  const startSponsorPolling = () => {
    const poll = async () => {
      try {
        // Prefer unread only; if backend ignores, we filter below
        const { data } = await api.get('/api/notifications', {
          params: { unreadOnly: true },
        });
        const list = Array.isArray(data) ? data : (data.items || data.notifications || []);

        // We only care about sponsor-side alerts when creators request access
        const candidate = list.filter(
          n => n && (n.type === 'creator_request' || n.type === 'request')
        );

        let newOnes = 0;
        for (const n of candidate) {
          const id = n._id || n.id;
          if (!id || seenNotifIdsRef.current.has(id)) continue;

          // Basic message (fallbacks if meta doesn’t include names)
          const jobId = n?.meta?.jobId || 'a job';
          const who = n?.meta?.creatorName || n?.meta?.creator || 'a creator';

          setMessage(`🔔 New request from ${who} on ${jobId}`);
          setShowPopup(true);
          setTimeout(() => setShowPopup(false), 3000);

          seenNotifIdsRef.current.add(id);
          newOnes++;
        }

        // If we saw new ones, bump the badge
        if (newOnes > 0) {
          refreshPendingCount();
        }
      } catch {
        // silent; dashboard shouldn’t spam console
      }
    };

    // fire immediately, then every ~12s
    poll();
    const t = setInterval(poll, 12000);
    // clean up on unmount
    return () => clearInterval(t);
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    try {
      await api.delete(`/api/jobs/${jobId}`);
      alert('✅ Job deleted');
      fetchJobs();
    } catch (err) {
      console.error('Delete job error:', err);
      const msg = err?.response?.data?.error || '❌ Failed to delete job';
      alert(msg);
    }
  };

  const renderTab = () => {
    if (loading) return <p>Loading jobs...</p>;
    const filteredJobs = {
      posted: jobs.filter(job => (job.submissions?.length ?? 0) === 0),
      accepted: jobs.filter(job => job.submissions?.some(sub => sub.status === 'Pending' && (!sub.submittedLinks || sub.submittedLinks.length === 0))),
      links: jobs.filter(job => job.submissions?.some(sub => sub.status === 'Submitted' && sub.submittedLinks?.length > 0)),
      past: jobs.filter(job => job.submissions?.some(sub => sub.status === 'Approved'))
    }[activeTab];

    return (
      <ul className="job-list">
        {filteredJobs.map((job) => (
          <li key={job._id} className="job-card">
            <h3>{job.title}</h3>
            <p>{job.description}</p>
            <p><strong>Budget:</strong> ${job.budget}</p>
            <p><strong>Due Date:</strong> {job.dueDate?.split('T')[0]}</p>
            <p><strong>Type:</strong> {job.jobType}</p>
            {job.radiusMiles !== undefined && (
              <p><strong>Radius:</strong> {job.radiusMiles} miles</p>
            )}
            <p><strong>Agent:</strong> {job.agentName} ({job.agentPhone})</p>

            {job.submissions?.length > 0 ? (
              <div className="submission-section">
                <h4>Submitted Content:</h4>
                {job.submissions.map((sub, index) => (
                  <div key={index} className="submission-item">
                    <p><strong>Creator ID:</strong> {sub.creatorId}</p>
                    <p><strong>Status:</strong> {sub.status}</p>
                    {sub.submittedLinks?.map((link, idx) => (
                      <a key={idx} href={link} target="_blank" rel="noopener noreferrer">{link}</a>
                    ))}
                    <span className="badge-success">✅ Submitted</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-submissions">No submissions yet.</p>
            )}

            <button className="danger-btn" style={{ marginTop: '10px' }} onClick={() => handleDelete(job._id)}>Delete Job</button>
          </li>
        ))}
      </ul>
    );
  };

  // ⬇️ tiny badge element (inline styles so we don’t touch CSS file)
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
          Sponsor Dashboard
        </h1>
        <h2 style={{ marginBottom: '10px' }}>👋 Welcome, {userName}!</h2>

        {/* TABS */}
        <div className="tabs" style={{ marginBottom: '20px' }}>
          <button className={activeTab === 'posted' ? 'active-tab' : ''} onClick={() => setActiveTab('posted')}>Posted Jobs</button>
          <button className={activeTab === 'accepted' ? 'active-tab' : ''} onClick={() => setActiveTab('accepted')}>Accepted Jobs</button>
          <button className={activeTab === 'links' ? 'active-tab' : ''} onClick={() => setActiveTab('links')}>Links Submitted</button>
          <button className={activeTab === 'past' ? 'active-tab' : ''} onClick={() => setActiveTab('past')}>Past Jobs</button>
        </div>

        {/* FORM */}
        {activeTab === 'posted' && (
          <form onSubmit={handleSubmit} className="job-form">
            <input name="title" value={formData.title} onChange={handleChange} placeholder="Job Title" required />
            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Job Description" required />
            <input name="budget" value={formData.budget} onChange={handleChange} placeholder="Budget" type="number" required />
            <input name="dueDate" value={formData.dueDate} onChange={handleChange} type="date" required />

            <label>
              <strong>Job Type:</strong>
              <select name="jobType" value={formData.jobType} onChange={handleChange}>
                <option value="upForGrabs">Up for Grabs</option>
                <option value="locationBased">Location Based</option>
              </select>
            </label>

            {/* Radius (miles) for Location Based */}
            {formData.jobType === 'locationBased' && (
              <label className="inline-label">
                <span><strong>Radius (miles):</strong></span>
                <input
                  name="radiusMiles"
                  value={formData.radiusMiles}
                  onChange={handleChange}
                  placeholder="Radius (miles)"
                  type="number"
                  min="1"
                />
              </label>
            )}

            <label>
              <input type="checkbox" name="multiple" checked={formData.multiple} onChange={handleChange} />
              Post this job multiple times?
            </label>
            {formData.multiple && (
              <input type="number" name="repeatCount" value={formData.repeatCount} onChange={handleChange} placeholder="Repeat Count" min="1" />
            )}
            <button type="submit">Submit Job</button>
          </form>
        )}

        {/* Success / popup messages (job posted OR new request) */}
        {showPopup && <div className="success-popup">✅ {message}</div>}

        {/* Posted/Accepted/Links/Past lists */}
        <div className="job-results" style={{ marginTop: '40px' }}>
          {renderTab()}
        </div>
      </div>

      <div className="tips-section">
        <h3>💼 Sponsor Tips</h3>
        <ul>
          <li>🎯 Use “Up For Grabs” to reach all creators</li>
          <li>📍 Use “Location Based” for local campaigns</li>
          <li>🔁 Use “Post Multiple” to run recurring ads</li>
          <li>📣 Encourage creators to earn a certification badge</li>
        </ul>
        <button
          className="home-btn"
          style={{ backgroundColor: 'black', color: 'white', marginRight: '10px' }}
          onClick={() => navigate('/')}
        >
          Home
        </button>

        {/* ⬇️ Requests Inbox with live badge */}
        <button
          className="inbox-btn"
          style={{ backgroundColor: 'purple', color: 'white', marginRight: '10px', position: 'relative' }}
          onClick={() => navigate('/sponsor/requests')}
        >
          Requests Inbox {badge(pendingReqCount)}
        </button>

        <button
          className="settings-btn"
          style={{ backgroundColor: 'blue', color: 'white', marginRight: '10px' }}
          onClick={() => navigate('/settings')}
        >
          Settings
        </button>
        <button
          className="logout-btn"
          style={{ backgroundColor: 'red', color: 'white' }}
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default SponsorDashboard;
