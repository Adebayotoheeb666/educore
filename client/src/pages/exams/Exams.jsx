import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getExams } from '../../services/examService';
import './Exams.css';
import '../students/Students.css';

const Exams = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getExams()
      .then(({ data }) => setExams(data.exams ?? data))
      .catch(() => toast.error('Failed to load exams'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="exams-container">
      
      {/* Header */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem'}}>
        <div>
          <h1 style={{fontSize: '3.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.8rem'}}>Examination Management</h1>
          <p style={{fontSize: '1.6rem', color: '#64748b'}}>Manage and schedule academic assessments for the 2023/2024 Session.</p>
        </div>
        <div style={{display: 'flex', gap: '1.5rem'}}>
           <button className="btn-secondary-outline" style={{padding: '1.2rem 2.5rem'}} onClick={() => navigate('/exams/question-bank')}>
              <span>📓</span> Question Bank
           </button>
           <button className="btn-primary-green" style={{background: '#5849b8', padding: '1.2rem 2.5rem'}} onClick={() => navigate('/exams/create')}>
              <span>+</span> Create Exam
           </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="exams-stats-grid">
        <div className="exams-stat-card">
           <div className="stat-val-row">
              <h3>Scheduled Exams</h3>
              <div className="stat-icon-bg" style={{background: '#eff6ff', color: '#1e40af'}}>📅</div>
           </div>
           <div style={{display: 'flex', alignItems: 'baseline', gap: '1.5rem'}}>
              <span className="main-num">24</span>
              <span className="trend-label">+2 this week</span>
           </div>
        </div>

        <div className="exams-stat-card">
           <div className="stat-val-row">
              <h3>Results Published</h3>
              <div className="stat-icon-bg" style={{background: '#ede9fa', color: '#2d2460'}}>✅</div>
           </div>
           <div style={{display: 'flex', alignItems: 'baseline', gap: '1.5rem'}}>
              <span className="main-num">18</span>
              <span className="trend-label" style={{color: '#64748b'}}>85% Completion</span>
           </div>
        </div>

        <div className="exams-stat-card" style={{border: '1px solid #fde68a', background: '#f3f0ff'}}>
           <div className="stat-val-row">
              <h3 style={{color: '#b8860b'}}>AI Performance Analytics</h3>
              <div className="stat-icon-bg" style={{background: '#fef3c7', color: '#b8860b'}}>💡</div>
           </div>
           <p style={{fontSize: '1.2rem', color: '#b8860b', lineHeight: 1.5, fontWeight: 700}}>
              New Alert: Average math scores are 12% higher in Terminal exams than Mid-terms.
           </p>
        </div>
      </div>

      {/* Exam Schedule Table */}
      <div className="exam-list-card">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3.5rem'}}>
           <h2 style={{fontSize: '2.4rem', fontWeight: 800}}>Exam Schedule</h2>
           <div style={{display: 'flex', gap: '1.5rem'}}>
             <div className="topbar-icon-btn" style={{border: '1px solid #e2e8f0', borderRadius: '10px'}}>📊</div>
             <div className="topbar-icon-btn" style={{border: '1px solid #e2e8f0', borderRadius: '10px'}}>📥</div>
           </div>
        </div>

        {loading ? (
          <div style={{padding: '4rem', textAlign: 'center', color: '#64748b'}}>Loading exams…</div>
        ) : exams.length === 0 ? (
          <div style={{padding: '4rem', textAlign: 'center', color: '#64748b'}}>No exams scheduled yet.</div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Class</th>
                <th>Exam Type</th>
                <th>Term</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {exams.map(ex => (
                <tr key={ex._id ?? ex.id}>
                  <td>
                    <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
                      <div className="subject-icon-box" style={{width: '32px', height: '32px', fontSize: '1.2rem'}}>Σ</div>
                      <span style={{fontWeight: 700}}>{ex.subject?.name ?? ex.subject}</span>
                    </div>
                  </td>
                  <td>{ex.class?.name ?? ex.class}</td>
                  <td>
                    <span className={`exam-type-badge ${(ex.examType ?? ex.type ?? '').toLowerCase().replace(/\s/g, '-')}`}>
                      {ex.examType ?? ex.type}
                    </span>
                  </td>
                  <td>{ex.term}</td>
                  <td>{ex.date ? new Date(ex.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ex.date}</td>
                  <td>
                    <div className="status-dot-wrap">
                      <span className={`dot ${ex.status === 'published' ? 'green' : 'gray'}`}></span>
                      {ex.status}
                    </div>
                  </td>
                  <td>
                    <button
                      className="btn-secondary-outline"
                      style={{padding: '0.8rem 1.5rem', fontSize: '1.1rem', fontWeight: 800}}
                      onClick={() => navigate(`/exams/${ex._id ?? ex.id}/scores`)}
                    >Enter Scores</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div style={{marginTop: '3.5rem', display: 'flex', justifyContent: 'flex-end'}}>
           <div className="pagination-wrap">
              <button className="pag-btn">❮</button>
              <button className="pag-btn active">1</button>
              <button className="pag-btn">2</button>
              <button className="pag-btn">3</button>
              <button className="pag-btn">❯</button>
           </div>
        </div>
      </div>

      <div style={{marginTop: '6rem', borderTop: '1px solid #f1f5f9', paddingTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{fontSize: '1.2rem', color: '#64748b'}}>
          <strong>EDUCORE AI</strong><br/>
          © 2024 EduCore AI. Nigeria's Wise Digital Assistant.
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

export default Exams;
