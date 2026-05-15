import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import './Teachers.css';
import '../students/Students.css';

const TeacherDetail = () => {
  const { id } = useParams();
  const [teacher, setTeacher] = useState(null);

  useEffect(() => {
    // Mock data for Dr. Samuel Olatunji
    setTeacher({
      name: 'Dr. Samuel Olatunji',
      id: 'EDU-TEA-2024-089',
      campus: 'Lagos Main Campus',
      role: 'Senior Mathematics Instructor & HOD Sciences',
      status: 'Active',
      email: 's.olatunji@educore.edu.ng',
      phone: '+234 803 123 4567',
      subjects: [
        { id: 'M', code: 'Mathematics', class: 'JSS3A • 40 Students' },
        { id: 'FM', code: 'Further Math', class: 'SS2B • 28 Students' },
        { id: 'ST', code: 'Statistics', class: 'SS3A • 35 Students' }
      ],
      attendance: '94.2%',
      trend: '↗ 2.1% from last term',
      curriculum: [
        { name: 'JSS3 Mathematics', progress: 78 },
        { name: 'SS2 Further Math', progress: 45 }
      ]
    });
  }, [id]);

  if (!teacher) return <div>Loading...</div>;

  return (
    <div className="teachers-container">
      
      {/* Search Header */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
          <Link to="/teachers" style={{textDecoration: 'none', color: '#64748b', fontSize: '1.8rem'}}>←</Link>
          <div className="topbar-search" style={{maxWidth: '300px', margin: 0}}>
            <span className="topbar-search-icon">🔍</span>
            <input type="text" placeholder="Search portal..." />
          </div>
        </div>
        <div className="topbar-actions">
           <div className="topbar-icon-btn">🔔</div>
           <div className="topbar-icon-btn">❓</div>
           <div className="user-avatar" style={{width: '32px', height: '32px'}}>
             <img src="https://ui-avatars.com/api/?name=Admin" alt="" />
           </div>
        </div>
      </div>

      {/* Profile Header Summary */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5rem'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '3rem'}}>
           <div className="profile-avatar-large" style={{width: '120px', height: '120px', borderRadius: '50%'}}>
              <img src="https://ui-avatars.com/api/?name=Samuel+Olatunji&size=120" alt="" style={{width: '100%', borderRadius: '50%'}} />
              <div style={{position: 'absolute', bottom: '10px', right: '10px', width: '24px', height: '24px', background: '#6A5ACD', border: '3px solid white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyCenter: 'center', color: 'white', fontSize: '1.2rem'}}>✓</div>
           </div>
           <div>
              <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '0.5rem'}}>
                <h1 style={{fontSize: '3.6rem', fontWeight: 800, margin: 0}}>{teacher.name}</h1>
                <span className="status-badge active" style={{fontSize: '1.2rem'}}>ACTIVE</span>
              </div>
              <p style={{fontSize: '1.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.8rem'}}>{teacher.role}</p>
              <p style={{fontSize: '1.4rem', color: '#64748b'}}>📍 {teacher.campus}</p>
           </div>
        </div>
        <div style={{display: 'flex', gap: '1.5rem'}}>
           <button className="btn-primary-green" style={{background: '#6A5ACD'}}>Edit Profile</button>
           <button className="btn-secondary-outline" style={{padding: '1rem'}}>⋮</button>
        </div>
      </div>

      {/* Profile Grid */}
      <div className="profile-grid-layout" style={{gridTemplateColumns: '360px 1fr 1fr'}}>
        
        {/* Left Col: Personal Details & AI Insight */}
        <aside className="profile-side-col">
          <div className="info-widget-card">
            <h3 className="widget-section-title"><span>👤</span> Personal Details</h3>
            <div className="info-item-row">
              <label>Full Name</label>
              <p>{teacher.name}</p>
            </div>
            <div className="info-item-row">
              <label>Email Address</label>
              <p style={{color: '#6A5ACD'}}>{teacher.email}</p>
            </div>
            <div className="info-item-row">
              <label>Phone Number</label>
              <p>{teacher.phone}</p>
            </div>
            <div className="info-item-row">
              <label>Employee ID</label>
              <p>{teacher.id}</p>
            </div>
          </div>

          <div className="ai-staff-insight-profile" style={{borderLeft: '5px solid #6A5ACD'}}>
             <div className="ai-profile-icon">🌿</div>
             <div style={{fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem'}}>AI Insight</div>
             <p className="ai-profile-insight-text">
               "{teacher.name.split(' ')[1]}'s JSS3A class shows a 15% higher engagement rate in Advanced Algebra modules compared to the school average. Consider him for the upcoming curriculum development workshop."
             </p>
             <div style={{position: 'absolute', top: '2rem', right: '2rem', fontSize: '3rem', opacity: 0.1}}>✨</div>
          </div>
        </aside>

        {/* Right Col: Assigned Subjects */}
        <div className="results-card-premium" style={{gridColumn: 'span 2'}}>
           <div className="results-header-row">
              <h3 style={{fontSize: '2.2rem', fontWeight: 800}}><span>📖</span> Assigned Subjects</h3>
              <Link to="#" style={{color: '#6A5ACD', fontWeight: 700, fontSize: '1.4rem', textDecoration: 'none'}}>+ Assign New</Link>
           </div>
           
           <div className="assigned-subjects-grid">
              {teacher.subjects.map(sub => (
                <div className="subject-card-mini" key={sub.id}>
                  <div className="subject-icon-box">{sub.id}</div>
                  <div className="subject-info-stack">
                    <h4>{sub.code}</h4>
                    <p>{sub.class}</p>
                  </div>
                  <span style={{marginLeft: 'auto', color: '#94a3b8'}}>❯</span>
                </div>
              ))}
           </div>
        </div>

        {/* Middle Bottom: Curriculum Progress */}
        <div className="attendance-card-premium">
           <h3 className="widget-section-title" style={{textTransform: 'uppercase', fontSize: '1.2rem', color: '#64748b'}}>Curriculum Progress</h3>
           <div className="progress-stats" style={{gap: '2.5rem'}}>
             {teacher.curriculum.map(curr => (
               <div className="prog-item" key={curr.name}>
                 <div className="prog-header">
                    <span>{curr.name}</span>
                    <span className="prog-percent">{curr.progress}%</span>
                 </div>
                 <div className="prog-bar-bg">
                    <div className="prog-bar-fill" style={{width: `${curr.progress}%`, background: '#6A5ACD'}}></div>
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* Right Bottom: Attendance Metric */}
        <div className="attendance-metric-card">
           <h5>Avg. Class Attendance</h5>
           <h2>{teacher.attendance}</h2>
           <p>{teacher.trend}</p>
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

export default TeacherDetail;
