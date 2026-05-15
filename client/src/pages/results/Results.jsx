import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getResults } from '../../services/resultService';
import './Results.css';
import '../students/Students.css';

const Results = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getResults()
      .then(({ data }) => setResults(data.results ?? data))
      .catch(() => toast.error('Failed to load results'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="results-container">
      
      {/* Header & Main Summary */}
      <div className="results-header-summary">
        <div>
           <h1 style={{fontSize: '3.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.2rem'}}>Results Management</h1>
           <p style={{fontSize: '1.6rem', color: '#64748b'}}>Manage academic performance records and approve termly distributions.</p>
           
           <div className="performance-overview-card" style={{marginTop: '4rem'}}>
              <div className="perf-chart-mini">📈</div>
              <div className="perf-stats-text">
                 <label>Average Class Performance</label>
                 <p>78.4%</p>
              </div>
              <div className="perf-indicators">
                 <div className="indicator-item green">
                    <span style={{fontSize: '1.8rem'}}>•</span> 42 Students Above Average
                 </div>
                 <div className="indicator-item red">
                    <span style={{fontSize: '1.8rem'}}>•</span> 5 Students Below 40%
                 </div>
              </div>
           </div>
        </div>

        <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
           <div style={{display: 'flex', gap: '1.5rem'}}>
              <button className="btn-primary-green" style={{background: '#6A5ACD', padding: '1.2rem 3rem'}}>
                 <span>🔢</span> Compute Results
              </button>
              <button className="btn-secondary-outline" style={{padding: '1.2rem 3rem'}}>
                 <span>🔓</span> Release Results
              </button>
           </div>
           
           <div className="processing-card">
              <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem'}}>
                 <span style={{fontSize: '1.8rem'}}>✨</span> 
                 <span style={{fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase'}}>Processing</span>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
                 <div className="spinner-border spinner-border-sm text-warning"></div>
                 <p style={{fontSize: '1.3rem', margin: 0}}>Syncing Gradebooks...</p>
              </div>
           </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="exam-list-card">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3.5rem'}}>
           <div style={{display: 'flex', gap: '2rem'}}>
             <div className="topbar-search" style={{maxWidth: '300px', margin: 0}}>
                <span className="topbar-search-icon">🔍</span>
                <input type="text" placeholder="Search student name..." />
             </div>
             <select className="attendance-select" style={{minWidth: '120px'}}>
                <option>SS3A</option>
                <option>SS3B</option>
             </select>
           </div>
           <button className="btn-secondary-outline" style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              <span>🎚️</span> Filter
           </button>
        </div>

        {loading ? (
          <div style={{padding: '4rem', textAlign: 'center', color: '#64748b'}}>Loading results…</div>
        ) : results.length === 0 ? (
          <div style={{padding: '4rem', textAlign: 'center', color: '#64748b'}}>No results found.</div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Class</th>
                <th>Overall %</th>
                <th>Position</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => {
                const studentName = r.student?.name ?? r.name ?? '—';
                const initials = studentName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                const admNo = r.student?.admissionNo ?? r.admissionNo ?? r.id ?? '—';
                const className = r.class?.name ?? r.class ?? '—';
                const overall = r.overallPercentage != null ? `${r.overallPercentage.toFixed(1)}%` : (r.score ?? '—');
                const position = r.position != null ? `${r.position}${['st','nd','rd'][r.position-1] ?? 'th'}` : '—';
                const status = r.status ?? 'pending';
                return (
                  <tr key={r._id ?? i}>
                    <td>
                      <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
                        <div className="student-avatar-circle" style={{width: '40px', height: '40px', background: '#ede9fa', color: '#6A5ACD'}}>{initials}</div>
                        <div className="student-info-mini">
                          <h4>{studentName}</h4>
                          <p>{admNo}</p>
                        </div>
                      </div>
                    </td>
                    <td>{className}</td>
                    <td style={{fontWeight: 800}}>{overall}</td>
                    <td>
                      <span style={{padding: '0.4rem 1rem', background: '#ede9fa', color: '#2d2460', borderRadius: '12px', fontWeight: 800, fontSize: '1.1rem'}}>
                        {position}
                      </span>
                    </td>
                    <td>
                      <span className={`status-label ${status === 'released' ? 'active' : status === 'approved' ? 'pending' : 'absent'}`} style={{textTransform: 'capitalize'}}>
                        {status}
                      </span>
                    </td>
                    <td>
                      <Link to={`/results/${r.student?._id ?? r._id}`} style={{color: '#2d2460', fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                        View Report <span>↗</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <div style={{marginTop: '3.5rem', display: 'flex', justifyContent: 'flex-end'}}>
           <div className="pagination-wrap">
              <button className="pag-btn">❮</button>
              <button className="pag-btn active">1</button>
              <button className="pag-btn">2</button>
              <button className="pag-btn">❯</button>
           </div>
        </div>
      </div>

      {/* Class Performance Analysis Banner */}
      <div className="analysis-banner-premium">
         <div className="analysis-content">
            <div style={{display: 'inline-block', padding: '0.4rem 1.2rem', background: '#fef3c7', color: '#b8860b', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '2rem'}}>
               ✨ Smart Insights
            </div>
            <h2>Class Performance Analysis</h2>
            <p>
               SS3A has shown a 4.2% increase in Mathematics proficiency compared to the previous term. However, the overall average is slightly pulled down by 3 students struggling in Further Mathematics.
            </p>
            <div className="ai-attendance-box" style={{background: 'white', border: '1px solid #dbeafe', display: 'flex', gap: '2rem'}}>
               <div style={{width: '40px', height: '40px', background: '#f3f0ff', color: '#6A5ACD', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>💡</div>
               <div>
                  <h4 style={{fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem'}}>Automated Recommendation</h4>
                  <p style={{fontSize: '1.2rem', margin: 0, color: '#64748b'}}>Schedule a review session for 'Differential Calculus' before final mock exams.</p>
               </div>
            </div>
         </div>
         <div className="analysis-viz-wrap">
            <img 
              src="https://images.unsplash.com/photo-1551288049-bbbda536339a?auto=format&fit=crop&q=80&w=1000" 
              alt="Performance Viz" 
              style={{width: '100%', borderRadius: '20px', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.1)'}}
            />
         </div>
      </div>

      <div style={{marginTop: '6rem', borderTop: '1px solid #f1f5f9', paddingTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{fontSize: '1.2rem', color: '#64748b'}}>
          <strong>EDUCORE AI</strong><br/>
          © 2024 EduCore AI. Empowering Nigerian Education.
        </div>
        <div style={{display: 'flex', gap: '2.5rem', fontSize: '1.3rem', color: '#475569', fontWeight: 600}}>
          <Link to="#" style={{textDecoration: 'none', color: 'inherit'}}>Privacy Policy</Link>
          <Link to="#" style={{textDecoration: 'none', color: 'inherit'}}>Support Center</Link>
          <Link to="#" style={{textDecoration: 'none', color: 'inherit'}}>Documentation</Link>
        </div>
      </div>

    </div>
  );
};

export default Results;
