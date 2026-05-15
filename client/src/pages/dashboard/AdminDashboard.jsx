import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { getSchool } from '../../services/schoolService';
import './Dashboard.css';

const StatCard = ({ label, value, trend, icon, isDanger }) => (
  <div className={`stat-card-premium ${isDanger ? 'danger' : ''}`}>
    <div className="stat-card-header">
      <div className="stat-card-icon-wrap">{icon}</div>
      {trend != null && trend !== '' && (
        <div className={`stat-trend ${isDanger ? 'danger' : ''}`}>{trend}</div>
      )}
    </div>
    <div className="stat-card-body">
      <h5>{label}</h5>
      <h2>{value ?? '—'}</h2>
    </div>
  </div>
);

const AdminDashboard = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [school, setSchool] = useState(null);

  useEffect(() => {
    axios.get('/api/analytics/dashboard').then(({ data }) => setStats(data)).catch(() => {});
    getSchool().then(({ data }) => setSchool(data)).catch(() => {});
  }, []);

  const displayName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Admin';
  const curriculumProgress = stats?.curriculumProgress ?? 0;
  const alerts = stats?.recentAnnouncements ?? [];

  return (
    <div className="admin-dashboard-content">
      <section className="welcome-section">
        <h1>Welcome back, {displayName}</h1>
        <p>
          {school?.name ? `${school.name} dashboard` : 'School dashboard'}
          {stats?.avgAttendance != null ? ` · Term attendance average ${stats.avgAttendance}%` : ''}
        </p>
      </section>

      <section className="stats-grid-dashboard">
        <StatCard label="Total Students" value={stats?.totalStudents} icon="👥" />
        <StatCard label="Total Teachers" value={stats?.totalTeachers} icon="🎓" />
        <StatCard label="Classes" value={stats?.totalClasses} icon="📖" />
        <StatCard label="Fee Defaulters" value={stats?.feeDefaulters} icon="💸" isDanger />
      </section>

      <div className="dashboard-content-grid">
        <div className="main-column">
          <div className="ai-features-card">
            <div className="ai-card-title">
              <span>✨</span> AI Features
            </div>
            <div className="ai-features-grid">
              <Link to="/lesson-plans/generate" className="ai-feature-item">
                <div className="ai-feature-icon">📝</div>
                <div className="ai-feature-text">
                  <h4>Generate Lesson Plan</h4>
                  <p>Create structured curriculum-aligned plans in seconds.</p>
                </div>
              </Link>
              <Link to="/exams/question-bank" className="ai-feature-item">
                <div className="ai-feature-icon">❓</div>
                <div className="ai-feature-text">
                  <h4>AI Question Bank</h4>
                  <p>Instant exam questions tailored to class difficulty levels.</p>
                </div>
              </Link>
            </div>
          </div>

          <div className="academic-overview-card">
            <div className="academic-header">
              <div className="academic-title">
                <h2>Academic Overview</h2>
                <p>
                  {school?.settings?.currentTerm
                    ? `${school.settings.currentTerm[0].toUpperCase()}${school.settings.currentTerm.slice(1)} Term`
                    : '—'}
                  {', '}
                  {school?.settings?.academicSession || '—'} Academic Session
                </p>
              </div>
            </div>

            <div className="academic-body-grid">
              <div className="progress-stats">
                <div className="prog-item">
                  <div className="prog-header">
                    <span>Lesson plans approved</span>
                    <span className="prog-percent">{curriculumProgress}%</span>
                  </div>
                  <div className="prog-bar-bg">
                    <div className="prog-bar-fill" style={{ width: `${curriculumProgress}%` }} />
                  </div>
                </div>
                <div className="prog-item">
                  <div className="prog-header">
                    <span>Attendance (school average)</span>
                    <span className="prog-percent">
                      {stats?.avgAttendance != null ? `${stats.avgAttendance}%` : '—'}
                    </span>
                  </div>
                  <div className="prog-bar-bg">
                    <div
                      className="prog-bar-fill"
                      style={{ width: stats?.avgAttendance != null ? `${stats.avgAttendance}%` : '0%' }}
                    />
                  </div>
                </div>
              </div>
              <div className="academic-chart-side">
                {stats?.classPerformance?.length > 0 ? (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '1.2rem' }}>
                    {stats.classPerformance.map((c) => (
                      <li key={c.className} style={{ marginBottom: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{c.className}</span>
                        <strong>{c.average}%</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: '#64748b', margin: 0 }}>No class performance data yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <aside className="side-column">
          <div className="widget-card dark">
            <h3 className="widget-title">Quick Actions</h3>
            <div className="action-list">
              <Link to="/students/add" className="action-btn">
                <span>➕</span> Add New Student
              </Link>
              <Link to="/attendance" className="action-btn">
                <span>✅</span> Mark Attendance
              </Link>
              <Link to="/exams/create" className="action-btn">
                <span>📝</span> Create Exam
              </Link>
            </div>
          </div>

          <div className="widget-card">
            <h3 className="widget-title">Recent announcements</h3>
            <div className="alert-list">
              {alerts.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '1.2rem' }}>No announcements yet.</p>
              ) : (
                alerts.map((a) => (
                  <div key={a.id} className="alert-item">
                    <div className={`alert-dot ${a.priority === 'urgent' ? '' : a.priority === 'high' ? 'orange' : 'green'}`} />
                    <div className="alert-text">
                      <h5>{a.title}</h5>
                      <p>{(a.body || '').slice(0, 120)}{(a.body?.length > 120 ? '…' : '')}</p>
                      <span className="alert-status">{a.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link to="/announcements" className="view-all-alerts">View all announcements</Link>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AdminDashboard;
