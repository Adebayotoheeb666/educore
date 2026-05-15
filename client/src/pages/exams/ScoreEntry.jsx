import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import './Exams.css';
import '../students/Students.css';

const ScoreEntry = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleSave = () => {
    toast.success('Scores saved as draft.');
  };

  const handleSubmit = () => {
    toast.success('Scores submitted and published to student portals.');
    navigate('/exams');
  };

  return (
    <div className="exams-container">
      
      {/* Navigation Header */}
      <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '3rem'}}>
         <Link to="/exams" style={{textDecoration: 'none', color: '#64748b', fontSize: '1.4rem', fontWeight: 700}}>Exams</Link>
         <span style={{color: '#94a3b8'}}>›</span>
         <span style={{fontSize: '1.4rem', fontWeight: 700, color: '#64748b'}}>SS3 MATHEMATICS</span>
         <span style={{color: '#94a3b8'}}>›</span>
         <span style={{fontSize: '1.4rem', fontWeight: 800, color: '#0f172a'}}>MID-TERM ENTRY</span>
      </div>

      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem'}}>
         <h1 style={{fontSize: '4.2rem', fontWeight: 800, color: '#0f172a'}}>SS3 Mathematics Mid-term</h1>
         <div style={{display: 'flex', gap: '1.5rem'}}>
            <button className="btn-secondary-outline" style={{background: '#eff6ff', border: 'none', padding: '1.2rem 2.5rem'}}>
               <span>📥</span> Export CSV
            </button>
            <button className="btn-primary-green" style={{background: '#6A5ACD', padding: '1.2rem 2.5rem'}} onClick={handleSave}>
               <span>💾</span> Save Progress
            </button>
         </div>
      </div>

      <div className="score-entry-header-card">
         <div style={{display: 'flex', gap: '2rem'}}>
            <div className="score-meta-pill">
               <span>📅</span> Term 1, 2024
            </div>
            <div className="score-meta-pill">
               <span>👤</span> Mr. Chinedu Okafor
            </div>
            <div className="score-meta-pill" style={{background: '#f3f0ff', color: '#b8860b'}}>
               <span>🎓</span> 42 Students Enrolled
            </div>
         </div>
         <div style={{display: 'flex', alignItems: 'center', gap: '2rem', fontSize: '1.2rem', fontWeight: 800}}>
            <span style={{color: '#64748b'}}>Legend:</span>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.8rem'}}><span className="dot green"></span> Excellent (>75)</div>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.8rem'}}><span className="dot" style={{background: '#FFD700'}}></span> Average (40-75)</div>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.8rem'}}><span className="dot" style={{background: '#dc2626'}}></span> Risk (&lt;40)</div>
         </div>
      </div>

      {/* Score Table */}
      <div className="exam-list-card">
         <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3.5rem'}}>
            <h2 style={{fontSize: '2.4rem', fontWeight: 800}}>Student Roster & Score Sheet</h2>
         </div>

         <table className="premium-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Admission ID</th>
                <th>CA Score (40)</th>
                <th>Exam Score (60)</th>
                <th>Total (100)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Adebayo Tunde', id: 'EDU/2024/001', ca: 34, ex: 52, total: 86, status: 'EXCELLENT', gender: 'Male • SS3-A', img: 'https://ui-avatars.com/api/?name=Adebayo+Tunde' },
                { name: 'Chioma Eze', id: 'EDU/2024/015', ca: 28, ex: 35, total: 63, status: 'CREDIT', gender: 'Female • SS3-A', img: 'https://ui-avatars.com/api/?name=Chioma+Eze' },
                { name: 'Ibrahim Musa', id: 'EDU/2024/042', ca: 12, ex: 22, total: 34, status: 'RISK', gender: 'Male • SS3-B', img: 'https://ui-avatars.com/api/?name=Ibrahim+Musa' },
              ].map((s, i) => (
                <tr key={i}>
                  <td>
                    <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
                       <img src={s.img} alt="" style={{width: '40px', height: '40px', borderRadius: '50%'}} />
                       <div className="student-info-mini">
                          <h4>{s.name}</h4>
                          <p>{s.gender}</p>
                       </div>
                    </div>
                  </td>
                  <td style={{fontFamily: 'monospace'}}>{s.id}</td>
                  <td>
                    <input type="text" className="score-input-mini" defaultValue={s.ca} />
                  </td>
                  <td>
                    <input type="text" className="score-input-mini" defaultValue={s.ex} />
                  </td>
                  <td style={{fontWeight: 800, color: s.status === 'EXCELLENT' ? '#6A5ACD' : (s.status === 'RISK' ? '#dc2626' : '#1e293b')}}>
                    {s.total}
                  </td>
                  <td>
                    <span className={`status-ribbon ${s.status.toLowerCase()}`}>
                       {s.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
         </table>

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

      {/* Finalize Bar */}
      <div className="finalize-bar">
         <div style={{display: 'flex', alignItems: 'center', gap: '2.5rem'}}>
            <div style={{width: '60px', height: '60px', background: '#ede9fa', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.4rem'}}>☁️</div>
            <div>
               <h3 style={{fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem'}}>Ready to Finalize?</h3>
               <p style={{fontSize: '1.3rem', color: '#64748b'}}>Saving progress allows you to return later. Publishing will make these results visible to students and parents.</p>
            </div>
         </div>
         <div style={{display: 'flex', alignItems: 'center', gap: '3rem'}}>
            <label style={{display: 'flex', alignItems: 'center', gap: '1.2rem', fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', cursor: 'pointer'}}>
               <input type="checkbox" style={{width: '20px', height: '20px'}} />
               Publish Results immediately
            </label>
            <div style={{display: 'flex', gap: '1.5rem'}}>
               <button className="btn-secondary-outline" style={{padding: '1.5rem 3rem', background: '#eff6ff', border: 'none', borderRadius: '12px', fontWeight: 800}} onClick={handleSave}>Save as Draft</button>
               <button className="btn-primary-green" style={{padding: '1.5rem 4rem', background: '#0f172a', borderRadius: '12px', fontWeight: 800}} onClick={handleSubmit}>
                 Submit & Publish <span>→</span>
               </button>
            </div>
         </div>
      </div>

      <div style={{marginTop: '6rem', borderTop: '1px solid #f1f5f9', paddingTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{fontSize: '1.2rem', color: '#64748b'}}>
          <strong>EDUCORE AI</strong><br/>
          © 2024 EduCore AI. Empowering Nigerian Education.
        </div>
        <div style={{display: 'flex', gap: '2.5rem', fontSize: '1.3rem', color: '#475569', fontWeight: 600}}>
          <Link to="#" style={{textDecoration: 'none', color: 'inherit'}}>Privacy Policy</Link>
          <Link to="#" style={{textDecoration: 'none', color: 'inherit'}}>Terms of Service</Link>
          <Link to="#" style={{textDecoration: 'none', color: 'inherit'}}>Support Center</Link>
        </div>
      </div>

    </div>
  );
};

export default ScoreEntry;
