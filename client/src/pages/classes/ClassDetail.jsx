import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import './Classes.css';

const ClassDetail = () => {
  const { id } = useParams();
  const [classInfo, setClassInfo] = useState(null);

  useEffect(() => {
    // Mock data for SS3A
    setClassInfo({
      name: 'SS3A',
      level: 'Senior Secondary',
      session: '2023/2024',
      teacher: 'Mr. Adebayo',
      studentCount: 32,
      subjects: [
        { name: 'Mathematics', color: 'green' },
        { name: 'English Language', color: 'green' },
        { name: 'Physics', color: 'green' },
        { name: 'Chemistry', color: 'green' },
        { name: 'Biology', color: 'green' },
        { name: 'Geography', color: 'green' },
        { name: 'Civic Education', color: 'green' },
        { name: 'Data Processing', color: 'blue' },
        { name: 'Literature', color: 'purple' }
      ],
      roster: [
        { name: 'Abiola Chidubem', id: 'EDU/2023/001', status: 'Active' },
        { name: 'Bello Aisha Omowunmi', id: 'EDU/2023/002', status: 'Active' },
        { name: 'Chukwuma Emeka', id: 'EDU/2023/003', status: 'Active' },
        { name: 'Dada Oluwatosin', id: 'EDU/2023/004', status: 'Absent' },
        { name: 'Eze Ifeoma Mary', id: 'EDU/2023/005', status: 'Active' },
        { name: 'Fashola Gbolahan', id: 'EDU/2023/006', status: 'Active' },
        { name: 'Garba Ibrahim', id: 'EDU/2023/007', status: 'Active' },
        { name: 'Hassan Fatima', id: 'EDU/2023/008', status: 'Active' },
        { name: 'Idris Musa', id: 'EDU/2023/009', status: 'Active' },
        { name: 'Joda Samuel', id: 'EDU/2023/010', status: 'Active' },
      ]
    });
  }, [id]);

  if (!classInfo) return <div>Loading...</div>;

  return (
    <div className="classes-container">
      
      {/* Detail Header */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '2rem'}}>
          <Link to="/classes" style={{textDecoration: 'none', color: '#64748b', fontSize: '2.4rem'}}>←</Link>
          <h1 style={{fontSize: '3.2rem', fontWeight: 800, color: '#0f172a'}}>{classInfo.name} Details</h1>
        </div>
        <div style={{display: 'flex', gap: '1.5rem'}}>
          <div className="topbar-search" style={{maxWidth: '300px', margin: 0}}>
            <span className="topbar-search-icon">🔍</span>
            <input type="text" placeholder="Search data..." />
          </div>
          <div className="topbar-icon-btn">🔔</div>
          <div className="topbar-icon-btn">❓</div>
          <div className="user-avatar" style={{width: '32px', height: '32px'}}>
             <img src="https://ui-avatars.com/api/?name=Admin" alt="" />
          </div>
        </div>
      </div>

      <div className="profile-grid-layout" style={{gridTemplateColumns: '1fr 1fr', gap: '3rem'}}>
        
        {/* Class Info Box */}
        <div className="class-info-card-detail">
           <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem'}}>
             <h2 style={{fontSize: '2.4rem', fontWeight: 800}}>Class Info</h2>
             <span style={{fontSize: '2rem', color: '#6A5ACD'}}>ⓘ</span>
           </div>
           
           <div className="detail-info-grid">
              <div className="detail-info-item">
                <label>Level</label>
                <p>{classInfo.level}</p>
              </div>
              <div className="detail-info-item">
                <label>Session</label>
                <p>{classInfo.session}</p>
              </div>
              <div className="detail-info-item">
                <label>Class Teacher</label>
                <p>{classInfo.teacher}</p>
              </div>
              <div className="detail-info-item">
                <label>Student Count</label>
                <p>{classInfo.studentCount}</p>
              </div>
           </div>

           <div className="ai-attendance-box">
             <h5><span>✨</span> AI Attendance Analysis</h5>
             <p>Attendance is up by 12% this term. Consider scheduling the mid-term review for Friday.</p>
           </div>
        </div>

        {/* Subjects Box */}
        <div className="subjects-card-detail">
           <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem'}}>
             <h2 style={{fontSize: '2.4rem', fontWeight: 800}}>Subjects</h2>
             <span style={{fontSize: '2rem', color: '#6A5ACD'}}>📖</span>
           </div>

           <div className="subjects-tags-grid">
              {classInfo.subjects.map((sub, i) => (
                <div key={i} className={`subject-tag-pill ${sub.color}`}>
                  {sub.name}
                </div>
              ))}
           </div>

           <div style={{marginTop: 'auto'}}>
             <div className="prog-bar-bg" style={{height: '8px', marginBottom: '1.2rem'}}>
                <div className="prog-bar-fill" style={{width: '75%', background: '#6A5ACD'}}></div>
             </div>
             <p style={{fontSize: '1.3rem', fontWeight: 700, color: '#475569'}}>Curriculum Completion: 75%</p>
           </div>
        </div>

        {/* Students Roster (Full Width) */}
        <div className="roster-card" style={{gridColumn: 'span 2'}}>
           <div className="roster-header">
              <div>
                <h2 style={{fontSize: '2.8rem', fontWeight: 800, marginBottom: '0.5rem'}}>Students</h2>
                <p style={{fontSize: '1.4rem', color: '#64748b'}}>Class Roster for Term 1</p>
              </div>
              <div style={{display: 'flex', gap: '1.5rem'}}>
                 <button className="btn-secondary-outline">Export CSV</button>
                 <button className="btn-primary-green" style={{background: '#6A5ACD'}}>Add Student</button>
              </div>
           </div>

           <table className="roster-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Admission Number</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {classInfo.roster.map((student, i) => (
                  <tr key={i}>
                    <td>{student.name}</td>
                    <td style={{fontFamily: 'monospace'}}>{student.id}</td>
                    <td>
                      <span className={`status-label ${student.status.toLowerCase()}`}>
                        {student.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span style={{fontSize: '1.8rem', cursor: 'pointer', color: '#94a3b8'}}>👁</span>
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>

           <div style={{marginTop: '3rem', textAlign: 'center'}}>
              <Link to="#" style={{color: '#6A5ACD', fontWeight: 800, fontSize: '1.4rem', textDecoration: 'none'}}>View All Students →</Link>
           </div>
        </div>

      </div>

      {/* Footer Branding */}
      <div style={{marginTop: '6rem', borderTop: '1px solid #f1f5f9', paddingTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{fontSize: '1.2rem', color: '#64748b'}}>
          <strong>EDUCORE AI</strong><br/>
          © 2024 EduCore AI. Nigeria's Wise Digital Assistant.
        </div>
        <div style={{display: 'flex', gap: '2.5rem', fontSize: '1.3rem', color: '#475569', fontWeight: 600}}>
          <Link to="#" style={{textDecoration: 'none', color: 'inherit'}}>Privacy Policy</Link>
          <Link to="#" style={{textDecoration: 'none', color: 'inherit'}}>Terms of Service</Link>
          <Link to="#" style={{textDecoration: 'none', color: 'inherit'}}>Help Desk</Link>
          <Link to="#" style={{textDecoration: 'none', color: 'inherit'}}>Contact Support</Link>
        </div>
      </div>

    </div>
  );
};

export default ClassDetail;
