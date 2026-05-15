import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import './Students.css';

const StudentDetail = () => {
  const { id } = useParams();
  const [student, setStudent] = useState(null);

  useEffect(() => {
    // Mock data for student 1
    setStudent({
      name: 'Chidi Okafor',
      id: 'EDU-2024-0482',
      campus: 'Lagos Campus',
      grade: 'Grade 11',
      gender: 'Male',
      dob: 'May 14, 2008 (16 years)',
      bloodGroup: 'O Positive',
      guardian: 'Mr. Emeka Okafor',
      guardianPhone: '+234 801 234 5678',
      guardianEmail: 'e.okafor@example.ng',
      attendance: '92%',
      results: [
        { subject: 'Mathematics', assessment: 'Mid-Term Exam', date: 'Oct 12, 2023', score: '88%', grade: 'A', status: 'Exceeded' },
        { subject: 'English', assessment: 'Creative Writing', date: 'Oct 08, 2023', score: '74%', grade: 'B', status: 'Met Target' },
        { subject: 'Biology', assessment: 'Lab Practical', date: 'Sep 28, 2023', score: '91%', grade: 'A+', status: 'Exceeded' },
      ]
    });
  }, [id]);

  if (!student) return <div>Loading...</div>;

  return (
    <div className="students-container">
      
      {/* Breadcrumbs / Header Actions */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem'}}>
        <div style={{display: 'flex', gap: '1rem', fontSize: '1.3rem', color: '#64748b', fontWeight: 600}}>
          <Link to="/dashboard" style={{textDecoration: 'none', color: 'inherit'}}>Dashboard</Link>
          <span>›</span>
          <Link to="/students" style={{textDecoration: 'none', color: 'inherit'}}>Students List</Link>
          <span>›</span>
          <span style={{color: '#0f172a'}}>{student.name} Profile</span>
        </div>
        <div className="header-actions">
           <button className="btn-secondary-outline"><span>✏️</span> Edit Profile</button>
           <button className="btn-primary-green" style={{background: '#6A5ACD'}}><span>📄</span> Report Card</button>
        </div>
      </div>

      {/* Profile Top Summary */}
      <div className="profile-top-card">
        <div className="profile-main-info">
          <div className="profile-avatar-large">
            <img src={`https://ui-avatars.com/api/?name=${student.name}&size=100`} alt="" style={{width: '100%', borderRadius: '20px'}} />
            <span className="status-dot">ACTIVE</span>
          </div>
          <div className="profile-text-stack">
            <h1>{student.name}</h1>
            <div className="profile-meta-row">
              <span><strong>ID:</strong> {student.id}</span>
              <span>📍 {student.campus} • {student.grade}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="profile-grid-layout">
        
        {/* Left Side: Personal Info */}
        <aside className="profile-side-col">
          <div className="info-widget-card">
            <h3 className="widget-section-title"><span>👤</span> Personal Info</h3>
            <div className="info-item-row">
              <label>Gender</label>
              <p>{student.gender}</p>
            </div>
            <div className="info-item-row">
              <label>Date of Birth</label>
              <p>{student.dob}</p>
            </div>
            <div className="info-item-row">
              <label>Blood Group</label>
              <p className="highlight">{student.bloodGroup}</p>
            </div>

            <h3 className="widget-section-title" style={{marginTop: '4rem'}}><span>👥</span> Parent Contact</h3>
            <div className="info-item-row">
              <label>Primary Guardian</label>
              <p>{student.guardian}</p>
            </div>
            <div className="info-item-row">
              <label>Phone Number</label>
              <p className="highlight">{student.guardianPhone}</p>
            </div>
            <div className="info-item-row">
              <label>Email Address</label>
              <p>{student.guardianEmail}</p>
            </div>
          </div>

          <div className="info-widget-card">
            <h3 className="widget-section-title"><span>⚖️</span> Disciplinary Record</h3>
            <div style={{background: '#f8fafc', padding: '3rem', borderRadius: '12px', border: '1px dashed #e2e8f0', textAlign: 'center', color: '#94a3b8', fontSize: '1.2rem'}}>
              No recorded incidents for this term.
            </div>
          </div>
        </aside>

        {/* Right Column: Attendance & AI Health */}
        <div className="attendance-card-premium">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem'}}>
             <h3 style={{fontSize: '2rem', fontWeight: 800}}>Attendance</h3>
             <span style={{fontSize: '3.2rem', fontWeight: 800, color: '#6A5ACD'}}>{student.attendance}</span>
          </div>
          <p style={{fontSize: '1.3rem', color: '#64748b', marginBottom: '1.5rem'}}>Current Term Progress</p>
          <div className="prog-bar-bg" style={{height: '12px', marginBottom: '1.5rem'}}>
            <div className="prog-bar-fill" style={{width: student.attendance, background: '#6A5ACD'}}></div>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 700}}>
            <span style={{color: '#94a3b8'}}>165 / 180 Days</span>
            <span style={{color: '#6A5ACD'}}>↗ Above Target</span>
          </div>
        </div>

        <div className="ai-academic-health-card">
           <div className="ai-health-title">
             <span>✨</span> AI Academic Health
           </div>
           <div className="ai-insight-box-inner">
             <div className="likely-grade">Likely Grade: A-</div>
             <p className="insight-p">
               Chidi is excelling in quantitative subjects but shows a 12% dip in English comprehension tasks. Suggested: Supplemental literature review.
             </p>
           </div>
           {/* Decorative Stars */}
           <div style={{position: 'absolute', top: '2rem', right: '2rem', fontSize: '3rem', opacity: 0.1}}>✨</div>
        </div>

        {/* Bottom Row: Results */}
        <div className="results-card-premium">
           <div className="results-header-row">
              <h3 style={{fontSize: '2.2rem', fontWeight: 800}}>Recent Results</h3>
              <Link to="#" style={{color: '#6A5ACD', fontWeight: 700, fontSize: '1.4rem', textDecoration: 'none'}}>View All History →</Link>
           </div>
           <table className="results-table-mini">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Assessment</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {student.results.map((res, i) => (
                  <tr key={i}>
                    <td>{res.subject}</td>
                    <td>{res.assessment}</td>
                    <td>{res.date}</td>
                    <td>
                      {res.score} <span className="grade-badge">{res.grade}</span>
                    </td>
                    <td>
                      <span className={`status-pill ${res.status.toLowerCase().includes('exceeded') ? 'exceeded' : 'met'}`}>
                        {res.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>

        {/* Sidebar continuation: Clubs */}
        <div className="info-widget-card" style={{gridColumn: '3'}}>
           <h3 className="widget-section-title"><span>⚽</span> Clubs & Societies</h3>
           <div style={{display: 'flex', flexWrap: 'wrap', gap: '1rem'}}>
             {['Varsity Football Team', 'Coding Club', 'Debate Society'].map(club => (
               <span key={club} style={{padding: '0.6rem 1.2rem', background: '#eff6ff', color: '#1e40af', borderRadius: '6px', fontSize: '1.2rem', fontWeight: 700}}>
                 {club}
               </span>
             ))}
           </div>
        </div>

      </div>

    </div>
  );
};

export default StudentDetail;
