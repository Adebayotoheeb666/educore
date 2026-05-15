import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import './Student.css';

const StudentDashboard = () => {
  const { user } = useSelector(s => s.auth);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get('/api/analytics/student-dashboard')
      .then(({ data }) => setData(data))
      .catch((err) => console.error("Failed to fetch student dashboard:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="student-dashboard-container d-flex justify-content-center align-items-center">
      <div className="spinner-border text-success" />
    </div>
  );

  if (!data) return (
    <div className="student-dashboard-container d-flex justify-content-center align-items-center" style={{ flexDirection: 'column', gap: '1rem', color: '#64748b' }}>
      <p style={{ fontSize: '1.6rem' }}>Unable to load dashboard. Please refresh the page.</p>
    </div>
  );

  return (
    <div className="student-dashboard-container">
      <header className="welcome-header-student">
        <h1>{data.welcomeMessage}</h1>
        <p>You're doing great in <span className="student-class-highlight">{data.currentClass}</span>. Here's your performance snapshot.</p>
        
      </header>

      {/* Performance Snapshots */}
      <div className="snapshots-grid">
        <div className="snapshot-card-premium">
          <div className="snapshot-header">
            <div className="snapshot-icon-wrap">📅</div>
            <span className="snapshot-trend">{data.performanceSnapshot.attendanceTrend}</span>
          </div>
          <div className="snapshot-content">
            <span className="snapshot-label">Attendance</span>
            <h2 className="snapshot-val">{data.performanceSnapshot.attendance}%</h2>
          </div>
          <div className="perf-bar-bg" style={{ height: '6px' }}>
            <div className="perf-bar-fill" style={{ width: `${Math.min(100, data.performanceSnapshot.attendance)}%`, background: '#5849b8' }} />
          </div>
        </div>

        <div className="snapshot-card-premium">
          <div className="snapshot-header">
            <div className="snapshot-icon-wrap">📈</div>
            <span className="snapshot-trend">{data.performanceSnapshot.lastTermAvg > 0 ? 'Latest term' : '—'}</span>
          </div>
          <div className="snapshot-content">
            <span className="snapshot-label">Last Term Avg</span>
            <h2 className="snapshot-val">{data.performanceSnapshot.lastTermAvg}%</h2>
          </div>
          <div className="perf-bar-bg" style={{ height: '6px' }}>
            <div className="perf-bar-fill" style={{ width: `${Math.min(100, data.performanceSnapshot.lastTermAvg)}%`, background: '#1e293b' }}></div>
          </div>
        </div>

        <div className="snapshot-card-premium">
          <div className="snapshot-header">
            <div className="snapshot-icon-wrap">💳</div>
            <span className={`snapshot-trend ${data.performanceSnapshot.outstandingFees > 0 ? 'warning' : ''}`}>
              {data.performanceSnapshot.outstandingFees > 0 ? 'Outstanding' : 'Cleared'}
            </span>
          </div>
          <div className="snapshot-content">
            <span className="snapshot-label">Outstanding Fees</span>
            <h2 className="snapshot-val">₦{data.performanceSnapshot.outstandingFees.toLocaleString()}</h2>
          </div>
          <Link to="/fees" className="btn-pay-now">Pay Now →</Link>
        </div>

        <div className="snapshot-card-premium">
          <div className="snapshot-header">
            <div className="snapshot-icon-wrap">🏆</div>
            <span className="snapshot-trend">{data.performanceSnapshot.positionTrend}</span>
          </div>
          <div className="snapshot-content">
            <span className="snapshot-label">Class Position</span>
            <h2 className="snapshot-val">{data.performanceSnapshot.classPosition}</h2>
          </div>
          <p className="snapshot-footer-text">{data.performanceSnapshot.positionTrend}</p>
        </div>
      </div>

      <div className="student-main-grid">
        {/* Quick Actions */}
        <aside>
           <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>Quick Actions</h3>
           <div className="quick-actions-list">
             <Link to="/results" style={{ textDecoration: 'none' }}>
               <div className="action-card-modern">
                 <div className="action-icon-square green">📄</div>
                 <div className="action-info">
                   <h4>My Results</h4>
                   <p>View termly performance</p>
                 </div>
               </div>
             </Link>
             <Link to="/timetable" style={{ textDecoration: 'none' }}>
               <div className="action-card-modern">
                 <div className="action-icon-square blue">🕒</div>
                 <div className="action-info">
                   <h4>Timetable</h4>
                   <p>Class & exam schedule</p>
                 </div>
               </div>
             </Link>
             <Link to="/announcements" style={{ textDecoration: 'none' }}>
               <div className="action-card-modern">
                 <div className="action-icon-square amber">📢</div>
                 <div className="action-info">
                   <h4>Announcements</h4>
                   <p>Stay updated with school</p>
                 </div>
               </div>
             </Link>
           </div>
        </aside>

        {/* School Announcements */}
        <section className="student-ann-box">
          <div className="ann-box-header">
            <h3>School Announcements</h3>
            <Link to="/announcements" style={{ color: '#5849b8', fontWeight: 800, textDecoration: 'none', fontSize: '0.9rem' }}>View All</Link>
          </div>
          <div className="student-ann-list">
            {(data.announcements || []).map(ann => (
              <div key={ann.id} className="student-ann-item">
                <div className={`ann-icon-circle ${ann.type}`}>
                   {ann.id === 1 ? '📅' : ann.id === 2 ? '⚠️' : 'ℹ️'}
                </div>
                <div className="ann-item-content">
                  <div className="ann-item-top">
                    <h4>{ann.title}</h4>
                    <span className="ann-time-tag">{ann.time}</span>
                  </div>
                  <p className="ann-item-body">{ann.body}</p>
                  <div className="ann-tags-row">
                    {ann.tags.map(tag => (
                      <span key={tag.label} className={`ann-pill ${tag.type}`}>{tag.label}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <footer className="ann-footer-main" style={{ background: '#f8fafc', margin: '5rem -4rem -3rem', padding: '2.5rem 8rem' }}>
        <div className="footer-left-content">
          © {new Date().getFullYear()} EduCore AI. Empowering Nigerian Education.
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

export default StudentDashboard;
