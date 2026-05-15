import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Teacher.css';
import '../analytics/Analytics.css'; // Reuse some analytics styles
import '../student/Student.css'; // Reuse some student styles

const TeacherDashboard = () => {
  const { user } = useSelector(s => s.auth);
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState({ classesToday: 0, totalStudents: 0, avgPerformance: 0, attendanceLogged: 0, schedule: [], performance: [], recentSubmissions: [] });

  useEffect(() => {
    axios.get('/api/analytics/teacher-dashboard')
      .then(({ data }) => setData(data))
      .catch((err) => console.error("Failed to fetch teacher dashboard:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="teacher-dashboard-container d-flex justify-content-center align-items-center"><div className="spinner-border text-success" /></div>;

  const displayName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Teacher';

  const { classesToday, totalStudents, avgPerformance, attendanceLogged, schedule, performance, recentSubmissions } = data;

  return (
    <div className="teacher-dashboard-container">
      <header className="welcome-header-student">
        <h1>Welcome back, {displayName}</h1>
        <p>You have <span className="student-class-highlight">{classesToday} classes</span> scheduled for today. Ready for a productive day?</p>
        
      </header>

      {/* Teacher Snapshots */}
      <div className="snapshots-grid">
        <div className="snapshot-card-premium">
          <div className="snapshot-header">
            <div className="snapshot-icon-wrap" style={{ background: '#eff6ff', color: '#1e40af' }}>🏫</div>
            <span className="snapshot-trend">Active</span>
          </div>
          <div className="snapshot-content">
            <span className="snapshot-label">Classes Today</span>
            <h2 className="snapshot-val">{classesToday} <small style={{ fontSize: '1rem', color: '#94a3b8' }}>Sessions</small></h2>
          </div>
        </div>

        <div className="snapshot-card-premium">
          <div className="snapshot-header">
            <div className="snapshot-icon-wrap" style={{ background: '#f3f0ff', color: '#6A5ACD' }}>👨‍🎓</div>
            <span className="snapshot-trend">{totalStudents > 0 ? `${totalStudents} total` : '—'}</span>
          </div>
          <div className="snapshot-content">
            <span className="snapshot-label">Total Students</span>
            <h2 className="snapshot-val">{totalStudents}</h2>
          </div>
        </div>

        <div className="snapshot-card-premium">
          <div className="snapshot-header">
            <div className="snapshot-icon-wrap" style={{ background: '#f3f0ff', color: '#b8860b' }}>📈</div>
            <span className="snapshot-trend">Top Tier</span>
          </div>
          <div className="snapshot-content">
            <span className="snapshot-label">Avg Performance</span>
            <h2 className="snapshot-val">{avgPerformance}%</h2>
          </div>
        </div>

        <div className="snapshot-card-premium">
          <div className="snapshot-header">
            <div className="snapshot-icon-wrap" style={{ background: '#fef2f2', color: '#ef4444' }}>✅</div>
            <span className="snapshot-status-tag on-track" style={{ background: '#ede9fa', color: '#2d2460' }}>Logged</span>
          </div>
          <div className="snapshot-content">
            <span className="snapshot-label">Attendance Marked</span>
            <h2 className="snapshot-val">{attendanceLogged}%</h2>
          </div>
        </div>
      </div>

      <div className="teacher-main-layout">
        <section>
           {/* Today's Schedule */}
           <div className="teacher-schedule-card">
              <div className="ann-box-header">
                <h3>Today's Schedule</h3>
                <Link to="/timetable" style={{ color: '#5849b8', fontWeight: 800, textDecoration: 'none', fontSize: '0.9rem' }}>Full Timetable</Link>
              </div>
              <div className="timeline-list">
                 {schedule.length > 0 ? schedule.map((item, i) => (
                   <div key={i} className="timeline-item">
                     <div className="timeline-time">{item.time}</div>
                     <div className="timeline-dot-wrap">
                        <div className="timeline-dot"></div>
                        <div className="timeline-line"></div>
                     </div>
                     <div className="timeline-content">
                        <h4>{item.subject}</h4>
                        <p>{item.class} • {item.room || 'Room'}</p>
                     </div>
                   </div>
                 )) : <p style={{ fontSize: '0.9rem', color: '#64748b', padding: '1rem' }}>No classes scheduled for today.</p>}
              </div>
           </div>

           {/* Performance Charts */}
           <div className="teacher-schedule-card">
              <div className="ann-box-header">
                <h3>Class Performance</h3>
              </div>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                   <BarChart data={performance.length > 0 ? performance : [{ name: 'N/A', avg: 0 }]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip cursor={{fill: '#f8fafc'}} />
                      <Bar dataKey="avg" fill="#5849b8" radius={[6, 6, 0, 0]} barSize={40} />
                   </BarChart>
                </ResponsiveContainer>
              </div>
           </div>
        </section>

        <aside>
           <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>Quick Actions</h3>
           <div className="teacher-actions-column">
              <button className="btn-teacher-action-card">
                 <div className="teacher-action-icon" style={{ color: '#5849b8' }}>✅</div>
                 <div className="teacher-action-info">
                    <h5>Mark Attendance</h5>
                    <p>Log today's student presence</p>
                 </div>
              </button>
              <button className="btn-teacher-action-card">
                 <div className="teacher-action-icon" style={{ color: '#1e40af' }}>📊</div>
                 <div className="teacher-action-info">
                    <h5>Result Entry</h5>
                    <p>Upload test and exam scores</p>
                 </div>
              </button>
              <button className="btn-teacher-action-card">
                 <div className="teacher-action-icon" style={{ color: '#b8860b' }}>📝</div>
                 <div className="teacher-action-info">
                    <h5>AI Lesson Plan</h5>
                    <p>Generate plan for next week</p>
                 </div>
              </button>
           </div>

           <div className="sidebar-widget-premium" style={{ marginTop: '2rem' }}>
              <div className="widget-header-row">
                 <h3>Recent Submissions</h3>
              </div>
              <div className="student-ann-list">
                 {recentSubmissions.length > 0 ? recentSubmissions.map((s, i) => (
                   <div key={i} className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{s.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{s.subject}</div>
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>{s.time}</span>
                   </div>
                 )) : <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No recent submissions.</p>}
              </div>
           </div>
        </aside>
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

export default TeacherDashboard;
