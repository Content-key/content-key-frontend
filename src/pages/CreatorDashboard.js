import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SponsorDashboard.css';

function CreatorDashboard() {
  const [upForGrabsJobs, setUpForGrabsJobs] = useState([]);
  const [localJobs, setLocalJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [pendingJobs, setPendingJobs] = useState([]);
  const [pastJobs, setPastJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('upForGrabs');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const fetchAcceptedJobs = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/jobs/my-jobs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return data.jobs || [];
  };

  const fetchAllJobs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/jobs/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      const filtered = data.jobs.filter(job => job.isUpForGrabs === true);
      setUpForGrabsJobs(filtered);
    } catch (err) {
      console.error('Fetch all jobs error:', err);
    }
    setLoading(false);
  };

  const fetchLocalJobs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/jobs/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      const filtered = data.jobs.filter(job => job.isUpForGrabs === false);
      setLocalJobs(filtered);
    } catch (err) {
      console.error('Fetch local jobs error:', err);
    }
    setLoading(false);
  };

  const fetchMyJobs = async () => {
    setLoading(true);
    try {
      const jobs = await fetchAcceptedJobs();
      const filtered = jobs.filter(
        job => job.status === 'Pending' && (!job.submittedLinks || job.submittedLinks.length === 0)
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
        job => job.status === 'Submitted' && job.submittedLinks && job.submittedLinks.length > 0
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
        job => job.status === 'Approved' && job.submittedLinks && job.submittedLinks.length > 0
      );
      setPastJobs(past);
    } catch (err) {
      console.error('Fetch past jobs error:', err);
    }
    setLoading(false);
  };

  const handleTabClick = (type) => {
    setView(type);
    if (type === 'upForGrabs') fetchAllJobs();
    if (type === 'localJobs') fetchLocalJobs();
    if (type === 'myJobs') fetchMyJobs();
    if (type === 'pendingJobs') fetchPendingJobs();
    if (type === 'pastJobs') fetchPastJobs();
  };

  const handleAccept = async (jobId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/accepted-jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jobId }),
      });
      const result = await response.json();
      if (response.ok) {
        alert('✅ Job accepted!');
        fetchAllJobs();
        fetchMyJobs();
        fetchLocalJobs();
      } else {
        alert(result.error || '❌ Failed to accept job');
      }
    } catch (err) {
      console.error('Accept job error:', err);
    }
  };

  useEffect(() => {
    handleTabClick(view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getDisplayedJobs = () => {
    if (view === 'myJobs') return myJobs;
    if (view === 'localJobs') return localJobs;
    if (view === 'upForGrabs') return upForGrabsJobs;
    return [];
  };

  return (
    <div className="dashboard-wrapper">
      <div className="form-section">
        <h1>Creator Dashboard</h1>
        <div className="tabs">
          <button className={view === 'upForGrabs' ? 'active-tab' : ''} onClick={() => handleTabClick('upForGrabs')}>Up for Grabs</button>
          <button className={view === 'localJobs' ? 'active-tab' : ''} onClick={() => handleTabClick('localJobs')}>Local Jobs</button>
          <button className={view === 'myJobs' ? 'active-tab' : ''} onClick={() => handleTabClick('myJobs')}>My Jobs</button>
          <button className={view === 'pendingJobs' ? 'active-tab' : ''} onClick={() => handleTabClick('pendingJobs')}>Pending</button>
          <button className={view === 'pastJobs' ? 'active-tab' : ''} onClick={() => handleTabClick('pastJobs')}>Past Jobs</button>
        </div>

        {view === 'pendingJobs' && (
          <>
            <p className="info-text">These jobs have been submitted and are awaiting sponsor approval.</p>
            <ul className="job-list">
              {pendingJobs.map((job) => (
                <li key={job._id} className="job-card">
                  <h3>{job.title}</h3>
                  <p>{job.description}</p>
                  <ul>
                    {job.submittedLinks?.map((link, index) => (
                      <li key={index}><a href={link} target="_blank" rel="noopener noreferrer">{link}</a></li>
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
                  <p><strong>Budget:</strong> ${job.budget}</p>
                  <span className="badge-complete">✅ Approved & Paid</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {loading ? <p>Loading jobs...</p> : (
          <ul className="job-list">
            {getDisplayedJobs().map((job) => (
              <li key={job._id} className="job-card">
                <h3>{job.title}</h3>
                <p>{job.description}</p>
                <p><strong>Budget:</strong> ${job.budget}</p>
                <p><strong>Agent Name:</strong> {job.agentName}</p>
                <p><strong>Agent Contact:</strong> {job.agentPhone}</p>
                <p><strong>Location:</strong> {job.city}, {job.state}</p>
                {['upForGrabs', 'localJobs'].includes(view) && (
                  <button onClick={() => handleAccept(job._id)}>Accept Job</button>
                )}
                {view === 'myJobs' && (
                  <>
                    <p><em>No content links submitted yet</em></p>
                    <MultiLinkSubmit jobId={job.acceptedJobId} onSubmitSuccess={fetchMyJobs} />
                  </>
                )}
              </li>
            ))}
          </ul>
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
        <button className="home-btn" style={{ marginRight: '10px', backgroundColor: 'black', color: 'white' }} onClick={() => navigate('/')}>Home</button>
        <button className="danger-btn" style={{ backgroundColor: 'red', color: 'white' }} onClick={handleLogout}>Logout</button>
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
    const token = localStorage.getItem('token');

    try {
      const formattedLinks = links.map(link => link.url);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/accepted-jobs/submit-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jobId, contentLinks: formattedLinks }),
      });

      const result = await response.json();
      if (response.ok) {
        alert('Links submitted!');
        onSubmitSuccess();
      } else {
        alert(result.error || 'Submission failed.');
      }
    } catch (error) {
      console.error(error);
      alert('Server error.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="multi-link-form">
      {links.map((link, index) => (
        <div key={index} className="link-input-group">
          <select value={link.type} onChange={(e) => handleChange(index, 'type', e.target.value)}>
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
          <button type="button" onClick={() => removeField(index)}>❌</button>
        </div>
      ))}
      <button type="button" onClick={addField}>+ Add Another Link</button>
      <button type="submit">Submit Links</button>
    </form>
  );
}

export default CreatorDashboard;

