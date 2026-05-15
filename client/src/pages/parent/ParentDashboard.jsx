import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Parent.css';

const ParentDashboard = () => {
  const { user } = useSelector(s => s.auth);
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState({ 
    children: [], 
    announcements: [], 
    totalOutstandingFees: 0, 
    overallAttendance: 0 
  });

  useEffect(() => {
    axios.get('/api/analytics/parent-dashboard')
      .then(({ data }) => setData(data))
      .catch((err) => console.error("Failed to fetch parent dashboard:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="parent-dashboard-container d-flex justify-content-center align-items-center"><div className="spinner-border text-success" /></div>;

  const { children, announcements } = data;

  return (
    <div className="parent-dashboard-container">
      <header className="ann-page-header">
        <div className="ann-header-left">
          <h1>Welcome back, {user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Parent'}</h1>
          <p>Monitor your children's academic progress, attendance, and administrative status in real-time.</p>
        </div>
        <button className="btn-new-ann" style={{ background: '#5849b8' }}>
           📅 School Calendar
        </button>
      </header>

      <div className="parent-main-layout">
        {/* Top Metrics Row */}
        <section className="parent-metrics-row">
          <div className="metric-card-premium">
            <div className="metric-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}>👨‍🎓</div>
            <div className="metric-info">
              <h5>Total Children</h5>
              <h3>{data.children?.length || 0}</h3>
            </div>
          </div>
          <div className="metric-card-premium">
            <div className="metric-icon" style={{ background: '#fce7f3', color: '#db2777' }}>💰</div>
            <div className="metric-info">
              <h5>Outstanding Fees</h5>
              <h3>₦{(data.totalOutstandingFees || 0).toLocaleString()}</h3>
            </div>
          </div>
          <div className="metric-card-premium">
            <div className="metric-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>📊</div>
            <div className="metric-info">
              <h5>Avg. Attendance</h5>
              <h3>{data.overallAttendance || 0}%</h3>
            </div>
          </div>
          <div className="metric-card-premium">
            <div className="metric-icon" style={{ background: '#fef3c7', color: '#d97706' }}>📢</div>
            <div className="metric-info">
              <h5>Announcements</h5>
              <h3>{data.announcements?.length || 0}</h3>
            </div>
          </div>
        </section>

        <div className="parent-dashboard-grid">
          <section className="children-cards-list">
            {children.map(child => (
              <div key={child.id} className="child-card-elevated">
                <div className="child-card-header">
                  <div className="child-avatar-box">
                    <img src={child.avatar} alt={child.name} />
                  </div>
                  <div className="child-header-text">
                    <h2>{child.name}</h2>
                    <span className="child-class-tag">{child.class}</span>
                  </div>
                  <div className="child-quick-actions">
                    <button className="btn-icon-circular" title="Message Teacher">✉️</button>
                  </div>
                </div>
                
                <div className="child-stats-grid">
                  <div className="child-stat-box">
                    <label><span>👤</span> ATTENDANCE</label>
                    <div className="child-stat-val">{child.attendance}%</div>
                    <div className="perf-bar-bg">
                      <div className="perf-bar-fill" style={{ width: `${child.attendance}%`, background: child.attendance > 80 ? '#10b981' : '#f59e0b' }}></div>
                    </div>
                  </div>
                  <div className="child-stat-box">
                    <label><span>📈</span> CURRENT AVG.</label>
                    <div className="child-stat-val">{child.avg}%</div>
                    <div className="perf-bar-bg">
                      <div className="perf-bar-fill" style={{ width: `${child.avg}%`, background: '#6A5ACD' }}></div>
                    </div>
                  </div>
                  <div className="child-stat-box highlight">
                    <label><span>💳</span> FEE BALANCE</label>
                    <div className={`child-stat-val ${child.outstandingBalance > 0 ? 'text-danger' : 'text-success'}`}>
                      {child.outstandingBalance > 0 ? `₦${child.outstandingBalance.toLocaleString()}` : 'Fully Paid'}
                    </div>
                    {child.outstandingBalance > 0 && <span className="fee-alert-pill">DUE</span>}
                  </div>
                </div>

                <div className="child-actions-row">
                   <Link to={`/results/${child.id}`} className="btn-child-action">📊 View Results</Link>
                   <Link to={`/fees/${child.id}`} className="btn-child-action outline">💳 Manage Fees</Link>
                </div>
              </div>
            ))}
          </section>

          <aside className="parent-sidebar-content">
            <div className="sidebar-widget-premium">
              <div className="widget-header-row">
                <h3><span>📢</span> School Updates</h3>
                <Link to="/announcements">View All</Link>
              </div>
              <div className="sidebar-ann-list">
                {announcements.map(ann => (
                  <div key={ann.id} className="sidebar-ann-item">
                    <span className={`ann-type-badge ${ann.type?.toLowerCase()}`}>{ann.type}</span>
                    <h4>{ann.title}</h4>
                    <p>{ann.body}</p>
                    <div className="sidebar-ann-meta"><span>🕒</span> {ann.time}</div>
                  </div>
                ))}
                {announcements.length === 0 && <p style={{color: '#64748b', fontSize: '1.3rem'}}>No recent announcements.</p>}
              </div>
            </div>

            <div className="sidebar-widget-premium support-help-card">
               <div className="support-icon-wrap">🙋‍♂️</div>
               <h3>Need Assistance?</h3>
               <p>Our administrative team is ready to help you with any school-related inquiries or technical issues.</p>
               <button className="btn-support-action primary">📞 Call Admin Office</button>
               <button className="btn-support-action secondary">✉️ Email Support</button>
            </div>
          </aside>
        </div>
      </div>

      <footer className="ann-footer-main" style={{ background: '#f8fafc', margin: '5rem -4rem -3rem', padding: '2.5rem 8rem' }}>
        <div className="footer-left-content">
          <span className="footer-brand">EduCore AI</span> • © {new Date().getFullYear()} EduCore AI. Empowering Nigerian Education.
        </div>
        <div className="footer-links">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/support">Support Center</Link>
          <Link to="/contact">Contact Us</Link>
        </div>
      </footer>
    </div>
  );
};

export default ParentDashboard;
