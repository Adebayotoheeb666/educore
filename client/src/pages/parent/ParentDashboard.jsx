import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Parent.css';

const ParentDashboard = () => {
  const { user } = useSelector(s => s.auth);
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState({ children: [], announcements: [] });

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
        <section className="children-cards-list">
          {children.map(child => (
            <div key={child.id} className="child-card-premium">
              <div className="child-avatar-box">
                <img src={child.avatar} alt={child.name} />
                <div style={{ position: 'absolute', top: 90, left: 90, background: '#ede9fa', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>{child.tag}</div>
              </div>
              <div className="child-info-area">
                <div className="child-name-row">
                  <div>
                    <h2>{child.name}</h2>
                    <span className="child-class-tag">{child.class}</span>
                  </div>
                  <span className={`fee-status-pill ${child.feeClass}`}>{child.feeStatus}</span>
                </div>
                
                <div className="child-stats-row">
                  <div className="child-stat-item">
                    <label><span>👤</span> ATTENDANCE</label>
                    <div className="child-stat-val">{child.attendance}%</div>
                    <div className="perf-bar-bg" style={{ height: '6px' }}>
                      <div className="perf-bar-fill" style={{ width: `${child.attendance}%`, background: '#5849b8' }}></div>
                    </div>
                  </div>
                  <div className="child-stat-item">
                    <label><span>📈</span> CURRENT AVG.</label>
                    <div className="child-stat-val">{child.avg}%</div>
                    <span className={`child-stat-trend ${child.avgTrend.startsWith('-') ? 'down' : ''}`}>{child.avgTrend}</span>
                  </div>
                </div>

                <div className="child-actions-row">
                   <Link to={`/results/${child.id}`} className="btn-child-action">View Results</Link>
                   <Link to={`/fees/${child.id}`} className="btn-child-action outline">View Fees</Link>
                </div>
              </div>
            </div>
          ))}

        </section>

        <aside className="parent-sidebar-content">
          <div className="sidebar-widget-premium">
            <div className="widget-header-row">
              <h3><span>📢</span> Announcements</h3>
              <Link to="/announcements">View All</Link>
            </div>
            <div className="sidebar-ann-list">
              {announcements.map(ann => (
                <div key={ann.id} className="sidebar-ann-item">
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b' }}>{ann.type}</span>
                  <h4>{ann.title}</h4>
                  <p>{ann.body}</p>
                  <div className="sidebar-ann-meta"><span>🕒</span> {ann.time}</div>
                </div>
              ))}
            </div>
            <button className="btn-sidebar-full">
              <span>🔄</span> Past Announcements
            </button>
          </div>

          <div className="sidebar-widget-premium support-help-card">
             <div style={{ width: 60, height: 60, background: '#5849b8', borderRadius: '50%', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🙋‍♂️</div>
             <h3>Need Assistance?</h3>
             <p>Our administrative team is ready to help you with any school-related inquiries.</p>
             <button className="btn-support-action primary">Call Admin Office</button>
             <button className="btn-support-action secondary">Email Support</button>
          </div>
        </aside>
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
