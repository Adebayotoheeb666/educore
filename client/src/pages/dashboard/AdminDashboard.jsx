import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { getSchool } from '../../services/schoolService';
import './Dashboard.css';

const StatCard = ({ label, value, trend, icon, isDanger }) => (
  <div className={`stat-card-premium ${isDanger ? 'danger' : ''}`}>
    <div className="stat-card-header">
      <div className="stat-card-icon-wrap">{icon}</div>
      {trend && <div className={`stat-trend ${isDanger ? 'danger' : ''}`}>{trend}</div>}
    </div>
    <div className="stat-card-body">
      <h5>{label}</h5>
      <h2>{value || '—'}</h2>
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

  const displayName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim();

  return (
    <div className="admin-dashboard-content">
      
      {/* Welcome Section */}
      <section className="welcome-section">
        <h1>Welcome back, {displayName || 'Principal Okonkwo'}</h1>
        <p>Manage your school ecosystem efficiently. AI insights show that attendance is up by 4% compared to last term.</p>
      </section>

      {/* Stats Grid */}
      <section className="stats-grid-dashboard">
        <StatCard 
          label="Total Students" 
          value={stats?.totalStudents} 
          trend={stats?.studentTrend} 
          icon="👥" 
        />
        <StatCard 
          label="Total Teachers" 
          value={stats?.totalTeachers} 
          trend={stats?.teacherTrend} 
          icon="🎓" 
        />
        <StatCard 
          label="Classes" 
          value={stats?.totalClasses} 
          trend={stats?.classTrend} 
          icon="📖" 
        />
        <StatCard 
          label="Fee Defaulters" 
          value={stats?.feeDefaulters} 
          trend={stats?.feeTrend} 
          icon="💸" 
          isDanger={true}
        />
      </section>

      {/* Content Grid */}
      <div className="dashboard-content-grid">
        
        {/* Main Column */}
        <div className="main-column">
          
          {/* AI Features */}
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

          {/* Academic Overview */}
          <div className="academic-overview-card">
            <div className="academic-header">
              <div className="academic-title">
                <h2>Academic Overview</h2>
                <p>
                  {school?.settings?.currentTerm ? `${school.settings.currentTerm[0].toUpperCase()}${school.settings.currentTerm.slice(1)} Term` : '—'}
                  {', '}
                  {school?.settings?.academicSession || '—'} Academic Session
                </p>
              </div>
              <div className="academic-tags">
                <span className="tag-badge light">WEEK 8</span>
                <span className="tag-badge green">LIVE TERM</span>
              </div>
            </div>

            <div className="academic-body-grid">
              <div className="progress-stats">
                <div className="prog-item">
                  <div className="prog-header">
                    <span>Curriculum Progress</span>
                    <span className="prog-percent">78%</span>
                  </div>
                  <div className="prog-bar-bg">
                    <div className="prog-bar-fill" style={{ width: '78%' }}></div>
                  </div>
                </div>
                <div className="prog-item">
                  <div className="prog-header">
                    <span>Attendance (Term Avg)</span>
                    <span className="prog-percent">{stats?.avgAttendance != null ? `${stats.avgAttendance}%` : '—'}</span>
                  </div>
                  <div className="prog-bar-bg">
                    <div className="prog-bar-fill" style={{ width: stats?.avgAttendance != null ? `${stats.avgAttendance}%` : '0%' }}></div>
                  </div>
                </div>
              </div>
              <div className="academic-chart-side">
                <div className="chart-placeholder">📊</div>
                <p className="chart-quote">"High student engagement detected this week"</p>
              </div>
            </div>
          </div>

        </div>

        {/* Side Column */}
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
            <h3 className="widget-title">Critical Alerts</h3>
            <div className="alert-list">
              <div className="alert-item">
                <div className="alert-dot"></div>
                <div className="alert-text">
                  <h5>Fee Deadline Missed</h5>
                  <p>SS3 Science fees outstanding for 12 students.</p>
                  <span className="alert-status">IMMEDIATE ACTION</span>
                </div>
              </div>
              <div className="alert-item">
                <div className="alert-dot orange"></div>
                <div className="alert-text">
                  <h5>Teacher Appraisal Due</h5>
                  <p>Complete appraisals for Mr. Bello and Ms. Adewale.</p>
                  <span className="alert-status" style={{color: '#FFD700'}}>TODAY, 4:00 PM</span>
                </div>
              </div>
              <div className="alert-item">
                <div className="alert-dot green"></div>
                <div className="alert-text">
                  <h5>Inventory Check</h5>
                  <p>Science lab stock report is ready for review.</p>
                  <span className="alert-status" style={{color: '#6A5ACD'}}>YESTERDAY</span>
                </div>
              </div>
            </div>
            <Link to="/notifications" className="view-all-alerts">View All Notifications</Link>
          </div>

          <div className="ai-recommendation-card">
            <div className="recommend-img">
              <img src="/assets/analytics-chart.png" alt="Rec" />
            </div>
            <div className="recommend-text">
              <h5>AI Recommendation</h5>
              <p>Schedule a staff meeting for JSS2 Mathematics performance review.</p>
            </div>
          </div>

        </aside>

      </div>
    </div>
  );
};

export default AdminDashboard;
