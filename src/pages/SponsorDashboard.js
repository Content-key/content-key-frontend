import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SponsorDashboard.css';

function SponsorDashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [activeTab, setActiveTab] = useState('posted');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    jobType: 'upForGrabs',
    dueDate: '',
    repeatCount: '1',
    multiple: false,
    agentName: 'Curtis Mckinney',
    agentPhone: '540-642-6867'
  });

  const [userName, setUserName] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserName(parsedUser.fullName || parsedUser.businessName || 'Sponsor');
    }
    fetchJobs();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
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
      const token = localStorage.getItem('token');
      const repeat = parseInt(formData.repeatCount) || 1;
      const totalBudget = parseFloat(formData.budget);
      const perJobBudget = formData.multiple ? Number((totalBudget / repeat).toFixed(2)) : totalBudget;

      const payload = {
        ...formData,
        repeatCount: repeat,
        budget: perJobBudget,
        multiple: Boolean(formData.multiple),
        agentName: 'Curtis Mckinney',
        agentPhone: '540-642-6867'
      };

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
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
          agentPhone: '540-642-6867'
        });
        setActiveTab('posted');
        fetchJobs();
      } else {
        setMessage(data.error || 'Something went wrong');
      }
    } catch (err) {
      console.error('Job post error:', err);
      setMessage('Server error');
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/jobs/sponsor/posted-jobs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setJobs(data.jobs);
      } else {
        console.error('Failed to fetch jobs');
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
    setLoading(false);
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        alert('✅ Job deleted');
        fetchJobs();
      } else {
        alert(data.error || '❌ Failed to delete job');
      }
    } catch (err) {
      console.error('Delete job error:', err);
      alert('Server error');
    }
  };

  const renderTab = () => {
    if (loading) return <p>Loading jobs...</p>;
    const filteredJobs = {
      posted: jobs.filter(job => job.submissions.length === 0),
      accepted: jobs.filter(job => job.submissions.some(sub => sub.status === 'Pending' && (!sub.submittedLinks || sub.submittedLinks.length === 0))),
      links: jobs.filter(job => job.submissions.some(sub => sub.status === 'Submitted' && sub.submittedLinks?.length > 0)),
      past: jobs.filter(job => job.submissions.some(sub => sub.status === 'Approved'))
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

  return (
    <div className="dashboard-wrapper">
      <div className="form-section">
        <h1>Sponsor Dashboard</h1>
        <h2 style={{ marginBottom: '10px' }}>👋 Welcome, {userName}!</h2>

        {/* ✅ TABS AT THE TOP */}
        <div className="tabs" style={{ marginBottom: '20px' }}>
          <button className={activeTab === 'posted' ? 'active-tab' : ''} onClick={() => setActiveTab('posted')}>Posted Jobs</button>
          <button className={activeTab === 'accepted' ? 'active-tab' : ''} onClick={() => setActiveTab('accepted')}>Accepted Jobs</button>
          <button className={activeTab === 'links' ? 'active-tab' : ''} onClick={() => setActiveTab('links')}>Links Submitted</button>
          <button className={activeTab === 'past' ? 'active-tab' : ''} onClick={() => setActiveTab('past')}>Past Jobs</button>
        </div>

        {/* ✅ FORM UNDER TABS ONLY WHEN 'posted' TAB IS ACTIVE */}
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

{showPopup && <div className="success-popup">✅ {message}</div>}

{/* Separated Job List Section */}
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
