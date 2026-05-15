import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Student.css';

const StudentResults = () => {
  const { user } = useSelector(s => s.auth);
  const [loading, setLoading] = useState(true);
  const [activeTerm, setActiveTerm] = useState('First Term');

  const [data, setData] = useState({ results: [], student: user, stats: {} });

  useEffect(() => {
    axios.get(`/api/analytics/student-results/${user._id}`)
      .then(({ data }) => setData(data))
      .catch((err) => console.error("Failed to fetch results:", err))
      .finally(() => setLoading(false));
  }, [user._id]);

  if (loading) return <div className="student-dashboard-container d-flex justify-content-center align-items-center"><div className="spinner-border text-success" /></div>;

  const { results, student, stats } = data;

  return (
    <div className="student-dashboard-container">
      <header className="ann-page-header">
        <div className="ann-header-left">
          <p style={{ color: '#64748b', fontWeight: 700, margin: 0 }}>Students / Result Details</p>
          <h1>{student?.firstName} {student?.lastName}</h1>
          <p>{student?.class?.name || 'Class'} • Student ID: {student?.studentId || 'N/A'}</p>
        </div>
        <button className="btn-new-ann" style={{ background: '#5849b8' }}>
           🖨 Print Report Card
        </button>
      </header>

      {/* Result Stats */}
      <div className="snapshots-grid">
        <div className="snapshot-card-premium">
           <div className="snapshot-icon-wrap" style={{ background: '#ede9fa', color: '#5849b8' }}>📊</div>
           <div className="snapshot-content">
             <span className="snapshot-label">Overall Percentage</span>
             <h2 className="snapshot-val">{stats?.avg || 0}%</h2>
           </div>
        </div>
        <div className="snapshot-card-premium">
           <div className="snapshot-icon-wrap" style={{ background: '#eff6ff', color: '#1e40af' }}>🏆</div>
           <div className="snapshot-content">
             <span className="snapshot-label">Class Position</span>
             <h2 className="snapshot-val">{stats?.position || 'N/A'} <small style={{ fontSize: '1rem', color: '#94a3b8' }}>of {stats?.totalInClass || 0}</small></h2>
           </div>
        </div>
        <div className="snapshot-card-premium">
           <div className="snapshot-icon-wrap" style={{ background: '#f3f0ff', color: '#b8860b' }}>🌟</div>
           <div className="snapshot-content">
             <span className="snapshot-label">Academic Standing</span>
             <h2 className="snapshot-val" style={{ fontSize: '1.8rem' }}>{stats?.standing || 'N/A'}</h2>
           </div>
        </div>
      </div>

      {/* Term Selector */}
      <div className="ann-filters" style={{ marginBottom: '2.5rem' }}>
        {['First Term', 'Second Term', 'Third Term'].map(t => (
          <button 
            key={t} 
            className={`filter-tab ${activeTerm === t ? 'active' : ''}`}
            onClick={() => setActiveTerm(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Results Table */}
      <div className="student-ann-box" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-header-custom" style={{ borderBottom: '1px solid #f1f5f9', padding: '1.5rem 2.5rem' }}>
           <h3 style={{ fontSize: '1.2rem' }}>Academic Performance Breakdown</h3>
           <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#5849b8' }}>ⓘ Grading Scale: WAEC Standard</span>
        </div>
        <div className="table-responsive">
          <table className="curriculum-table" style={{ width: '100%' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th style={{ padding: '1.2rem 2.5rem' }}>Subject</th>
                <th>CA (30%)</th>
                <th>Exam (70%)</th>
                <th>Total (100%)</th>
                <th style={{ padding: '1.2rem 2.5rem' }}>Grade</th>
              </tr>
            </thead>
            <tbody>
              {results.length > 0 ? results.map(r => (
                <tr key={r.subject}>
                  <td style={{ padding: '1.5rem 2.5rem', fontWeight: 800 }}>{r.subject}</td>
                  <td>{r.ca}</td>
                  <td>{r.exam}</td>
                  <td style={{ fontWeight: 800 }}>{r.total}</td>
                  <td style={{ padding: '1.5rem 2.5rem' }}>
                    <span className="status-cell-pill" style={{ background: r.total >= 70 ? '#ede9fa' : '#eff6ff', color: r.total >= 70 ? '#2d2460' : '#1e40af' }}>
                      {r.grade}
                    </span>
                  </td>
                </tr>
              )) : <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No results recorded for this term.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="snapshots-grid" style={{ marginTop: '3.5rem', gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div className="snapshot-card-premium" style={{ borderLeft: '4px solid #6A5ACD', background: '#f3f0ff' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.2rem' }}>AI Analysis</h4>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#2d2460', fontWeight: 600 }}>
            Adebayo is showing exceptional growth in STEM subjects, particularly in ICT where he ranks in the top 1% of the school.
          </p>
          <div style={{ marginTop: '1.5rem', padding: '1rem', borderLeft: '2px solid #5849b8', fontSize: '0.85rem', fontStyle: 'italic', color: '#5849b8', fontWeight: 700 }}>
            Target: Maintain 90+ in Mathematics for state-level scholarship.
          </div>
        </div>

        <div className="snapshot-card-premium">
           <div className="d-flex align-items-center gap-3 mb-3">
             <img src="https://ui-avatars.com/api/?name=Form+Teacher&background=random" alt="T" style={{ width: 40, height: 40, borderRadius: '50%' }} />
             <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Form Teacher's Remark</h4>
           </div>
           <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#475569', fontStyle: 'italic', fontWeight: 600 }}>
             "Adebayo is a diligent student who consistently puts in his best effort. His participation in class discussions has improved significantly this term. Well done!"
           </p>
        </div>

        <div className="snapshot-card-premium">
           <div className="d-flex align-items-center gap-3 mb-3">
             <img src="https://ui-avatars.com/api/?name=Principal&background=random" alt="P" style={{ width: 40, height: 40, borderRadius: '50%' }} />
             <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Principal's Remark</h4>
           </div>
           <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#475569', fontStyle: 'italic', fontWeight: 600 }}>
             "An excellent result. With this level of consistency, Adebayo is on track for a very successful academic year. Keep up the brilliant work."
           </p>
        </div>
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

export default StudentResults;
