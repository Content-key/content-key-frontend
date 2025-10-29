// src/pages/SponsorDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './SponsorDashboard.css';

import { api } from '../api/axios';
import { useAuth } from '../auth/AuthProvider';

function SponsorDashboard() {
  const [jobs, setJobs] = useState([]);
  const [linksSubs, setLinksSubs] = useState([]); // one card per submission
  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);

  const [activeTab, setActiveTab] = useState('posted');
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [pendingReqCount, setPendingReqCount] = useState(0);
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
    radiusMiles: '25',
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ck_auth');
      if (raw) {
        const { user } = JSON.parse(raw);
        if (user) setUserName(user.fullName || user.businessName || 'Sponsor');
      }
    } catch {}
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bootstrap = async () => {
    setLoading(true);
    await Promise.all([fetchJobs(), fetchLinksSubmitted(), refreshPendingCount()]);
    startSponsorPolling();
    setLoading(false);
  };

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
      const perJobBudget = formData.multiple
        ? Number((totalBudget / repeat).toFixed(2))
        : totalBudget;

      const payload = {
        ...formData,
        repeatCount: repeat,
        budget: perJobBudget,
        multiple: Boolean(formData.multiple),
        agentName: 'Curtis Mckinney',
        agentPhone: '540-642-6867',
      };

      if (payload.radiusMiles !== '' && payload.radiusMiles !== undefined && payload.radiusMiles !== null) {
        payload.radiusMiles = Number(payload.radiusMiles);
      }

      const { data } = await api.post('/api/jobs', payload);

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
      await fetchJobs();
    } catch (err) {
      const msg = err?.response?.data?.error || 'Something went wrong';
      setMessage(msg);
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
      console.error('Job post error:', err);
    }
  };

  const fetchJobs = async () => {
    try {
      const { data } = await api.get('/api/jobs/sponsor/posted-jobs');
      setJobs(data.jobs || []);
    } catch (err) {
      console.error('Fetch jobs error:', err);
    }
  };

  // 🔹 Fetch one-card-per-submission dataset for the Links tab
  const fetchLinksSubmitted = async () => {
    try {
      const { data } = await api.get('/api/jobs/sponsor/links-submitted');
      setLinksSubs(Array.isArray(data?.submissions) ? data.submissions : []);
    } catch (err) {
      console.error('Fetch links-submitted error:', err);
      setLinksSubs([]);
    }
  };

  const refreshPendingCount = async () => {
    try {
      const { data } = await api.get('/api/requests', {
        params: { status: 'pending', page: 1, pageSize: 1 },
      });
      setPendingReqCount(Number(data?.total || 0));
    } catch {
      // non-blocking
    }
  };

  const startSponsorPolling = () => {
    const poll = async () => {
      try {
        const { data } = await api.get('/api/notifications', {
          params: { unreadOnly: true },
        });
        const list = Array.isArray(data) ? data : (data.items || data.notifications || []);
        const candidate = list.filter(
          (n) => n && (n.type === 'creator_request' || n.type === 'request')
        );

        let newOnes = 0;
        for (const n of candidate) {
          const id = n._id || n.id;
          if (!id || seenNotifIdsRef.current.has(id)) continue;

          const jobId = n?.meta?.jobId || 'a job';
          const who = n?.meta?.creatorName || n?.meta?.creator || 'a creator';

          setMessage(`🔔 New request from ${who} on ${jobId}`);
          setShowPopup(true);
          setTimeout(() => setShowPopup(false), 3000);

          seenNotifIdsRef.current.add(id);
          newOnes++;
        }
        if (newOnes > 0) refreshPendingCount();
      } catch {
        // silent
      }
    };

    poll();
    const t = setInterval(poll, 12000);
    // dashboard persists in SPA; a full route reload reboots polling
    return () => clearInterval(t);
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    try {
      await api.delete(`/api/jobs/${jobId}`);
      alert('✅ Job deleted');
      await fetchJobs();
      await fetchLinksSubmitted();
    } catch (err) {
      console.error('Delete job error:', err);
      const msg = err?.response?.data?.error || '❌ Failed to delete job';
      alert(msg);
    }
  };

  // 🔹 Approve / Reject handlers for one-card-per-submission
  const handleApprove = async (acceptedJobId) => {
    try {
      await api.patch(`/api/jobs/sponsor/submissions/${acceptedJobId}/approve`);
      setMessage('✅ Submission approved');
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
      await fetchLinksSubmitted();
      await fetchJobs(); // keep other tabs in sync
    } catch (err) {
      console.error('Approve error:', err);
      const msg = err?.response?.data?.error || '❌ Failed to approve submission';
      alert(msg);
    }
  };

  const handleReject = async (acceptedJobId) => {
    try {
      await api.patch(`/api/jobs/sponsor/submissions/${acceptedJobId}/reject`);
      setMessage('❌ Submission rejected');
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
      await fetchLinksSubmitted();
      await fetchJobs();
    } catch (err) {
      console.error('Reject error:', err);
      const msg = err?.response?.data?.error || '❌ Failed to reject submission';
      alert(msg);
    }
  };

  // ✅ Tabbing logic without duplicate “two boxes for one job”
  const computeFilteredJobs = () => {
    const posted = jobs.filter((job) => (job.submissions?.length ?? 0) === 0);

    const accepted = jobs.filter((job) =>
      job.submissions?.some(
        (sub) =>
          String(sub.status) === 'Pending' &&
          (!Array.isArray(sub.submittedLinks) || sub.submittedLinks.length === 0)
      )
    );

    const past = jobs.filter((job) =>
      job.submissions?.some((sub) => String(sub.status) === 'Approved')
    );

    return { posted, accepted, past };
  };

  const renderTab = () => {
    if (loading) return <p>Loading jobs...</p>;

    const { posted, accepted, past } = computeFilteredJobs();

    if (activeTab === 'links') {
      // 🔹 Single card per submission, fed by dedicated endpoint
      return (
        <ul className="job-list">
          {linksSubs.map((sub) => (
            <li key={sub.acceptedJobId} className="job-card">
              <h3>{sub.title || 'Untitled Job'}</h3>
              <p>{sub.description}</p>
              <p><strong>Budget:</strong> ${sub.budget}</p>
              {sub.dueDate && (
                <p><strong>Due Date:</strong> {String(sub.dueDate).split('T')[0]}</p>
              )}
              <p><strong>Type:</strong> {sub.jobType}</p>

              {/* Consistent info block */}
              {typeof sub.radiusMiles === 'number' && (
                <p><strong>Radius:</strong> {sub.radiusMiles} miles</p>
              )}
              <p><strong>Agent Name:</strong> {sub.agentName || '—'}</p>
              <p><strong>Agent Contact:</strong> {sub.agentPhone || '—'}</p>

              <div className="submission-section" style={{ marginTop: 10 }}>
                <p><strong>Creator ID:</strong> {sub.creatorId}</p>
                <p><strong>Status:</strong> {sub.status}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(sub.submittedLinks || []).map((href, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <a href={href} target="_blank" rel="noopener noreferrer">{href}</a>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: '#e6f7ec',
                          color: '#1a7f37',
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        ✅ Submitted
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button
                    className="approve-btn"
                    onClick={() => handleApprove(sub.acceptedJobId)}
                    title="Approve submission"
                  >
                    ✅ Approve
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => handleReject(sub.acceptedJobId)}
                    title="Reject submission"
                  >
                    ❌ Reject
                  </button>
                </div>
              </div>
            </li>
          ))}
          {linksSubs.length === 0 && <p>No submissions yet.</p>}
        </ul>
      );
    }

    if (activeTab === 'posted') {
      return (
        <ul className="job-list">
          {posted.map((job) => (
            <li key={job._id} className="job-card">
              <h3>{job.title}</h3>
              <p>{job.description}</p>
              <p><strong>Budget:</strong> ${job.budget}</p>
              {job.dueDate && <p><strong>Due Date:</strong> {String(job.dueDate).split('T')[0]}</p>}
              <p><strong>Type:</strong> {job.jobType}</p>
              {job.radiusMiles !== undefined && (
                <p><strong>Radius:</strong> {job.radiusMiles} miles</p>
              )}
              <p><strong>Agent Name:</strong> {job.agentName || '—'}</p>
              <p><strong>Agent Contact:</strong> {job.agentPhone || '—'}</p>

              {/* No nested submissions here to avoid double boxes */}
              <p className="no-submissions">No submissions yet.</p>

              <button
                className="danger-btn"
                style={{ marginTop: '10px' }}
                onClick={() => handleDelete(job._id)}
              >
                Delete Job
              </button>
            </li>
          ))}
          {posted.length === 0 && <p>No posted jobs.</p>}
        </ul>
      );
    }

    if (activeTab === 'accepted') {
      return (
        <ul className="job-list">
          {accepted.map((job) => (
            <li key={job._id} className="job-card">
              <h3>{job.title}</h3>
              <p>{job.description}</p>
              <p><strong>Budget:</strong> ${job.budget}</p>
              {job.dueDate && <p><strong>Due Date:</strong> {String(job.dueDate).split('T')[0]}</p>}
              <p><strong>Type:</strong> {job.jobType}</p>
              {job.radiusMiles !== undefined && (
                <p><strong>Radius:</strong> {job.radiusMiles} miles</p>
              )}
              <p><strong>Agent Name:</strong> {job.agentName || '—'}</p>
              <p><strong>Agent Contact:</strong> {job.agentPhone || '—'}</p>

              {/* Simple status note */}
              <span className="badge-warning">⏳ Accepted — awaiting links</span>

              <button
                className="danger-btn"
                style={{ marginTop: '10px' }}
                onClick={() => handleDelete(job._id)}
              >
                Delete Job
              </button>
            </li>
          ))}
          {accepted.length === 0 && <p>No accepted jobs waiting for links.</p>}
        </ul>
      );
    }

    if (activeTab === 'past') {
      return (
        <ul className="job-list">
          {past.map((job) => (
            <li key={job._id} className="job-card">
              <h3>{job.title}</h3>
              <p>{job.description}</p>
              <p><strong>Budget:</strong> ${job.budget}</p>
              {job.dueDate && <p><strong>Due Date:</strong> {String(job.dueDate).split('T')[0]}</p>}
              <p><strong>Type:</strong> {job.jobType}</p>
              {job.radiusMiles !== undefined && (
                <p><strong>Radius:</strong> {job.radiusMiles} miles</p>
              )}
              <p><strong>Agent Name:</strong> {job.agentName || '—'}</p>
              <p><strong>Agent Contact:</strong> {job.agentPhone || '—'}</p>

              {/* Summary only — no nested submission items */}
              <span className="badge-success">✅ At least one submission approved</span>
            </li>
          ))}
          {past.length === 0 && <p>No past (approved) jobs yet.</p>}
        </ul>
      );
    }

    return null;
  };

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
        <h1>Sponsor Dashboard</h1>
        <h2 style={{ marginBottom: '10px' }}>👋 Welcome, {userName}!</h2>

        {/* TABS */}
        <div className="tabs" style={{ marginBottom: '20px' }}>
          <button
            className={activeTab === 'posted' ? 'active-tab' : ''}
            onClick={() => setActiveTab('posted')}
          >
            Posted Jobs
          </button>
          <button
            className={activeTab === 'accepted' ? 'active-tab' : ''}
            onClick={() => setActiveTab('accepted')}
          >
            Accepted Jobs
          </button>
          <button
            className={activeTab === 'links' ? 'active-tab' : ''}
            onClick={() => {
              setActiveTab('links');
              fetchLinksSubmitted();
            }}
          >
            Links Submitted
          </button>
          <button
            className={activeTab === 'past' ? 'active-tab' : ''}
            onClick={() => setActiveTab('past')}
          >
            Past Jobs
          </button>
        </div>

        {/* FORM (only in Posted tab) */}
        {activeTab === 'posted' && (
          <form onSubmit={handleSubmit} className="job-form">
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Job Title"
              required
            />
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Job Description"
              required
            />
            <input
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              placeholder="Budget"
              type="number"
              required
            />
            <input
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              type="date"
              required
            />

            <label>
              <strong>Job Type:</strong>
              <select name="jobType" value={formData.jobType} onChange={handleChange}>
                <option value="upForGrabs">Up for Grabs</option>
                <option value="locationBased">Location Based</option>
              </select>
            </label>

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
              <input
                type="checkbox"
                name="multiple"
                checked={formData.multiple}
                onChange={handleChange}
              />
              Post this job multiple times?
            </label>
            {formData.multiple && (
              <input
                type="number"
                name="repeatCount"
                value={formData.repeatCount}
                onChange={handleChange}
                placeholder="Repeat Count"
                min="1"
              />
            )}
            <button type="submit">Submit Job</button>
          </form>
        )}

        {showPopup && <div className="success-popup">✅ {message}</div>}

        {/* Lists */}
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
