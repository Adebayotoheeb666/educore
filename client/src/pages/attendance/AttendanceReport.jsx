import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Attendance.css';

const AttendanceReport = () => {
  const [selectedClass, setSelectedClass] = useState('SS3 - Science A');

  return (
    <div className="attendance-container">
      
      <div style={{marginBottom: '4rem'}}>
        <h1 style={{fontSize: '3.2rem', fontWeight: 800, color: '#0f172a'}}>Attendance Reporting</h1>
      </div>

      {/* Filter Card */}
      <div className="report-filter-card">
         <div className="attendance-select-wrap" style={{flex: 1}}>
            <label>Select Grade / Class</label>
            <select className="attendance-select" style={{width: '100%'}} value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
               <option>SS3 - Science A</option>
               <option>JSS1 - Art B</option>
            </select>
         </div>
         <div className="attendance-select-wrap" style={{flex: 1}}>
            <label>Select Term Period</label>
            <div style={{position: 'relative'}}>
              <input type="text" className="attendance-select" style={{width: '100%'}} defaultValue="Michaelmas Term 2024" />
              <span style={{position: 'absolute', right: '1.5rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.8rem'}}>📅</span>
            </div>
         </div>
         <button className="btn-primary-green" style={{padding: '1.4rem 4rem', fontSize: '1.4rem', borderRadius: '10px', background: '#6A5ACD'}}>
           View Report
         </button>
      </div>

      {/* Summary Cards */}
      <div className="attendance-summary-grid">
        <div className="att-card">
          <div className="att-card-icon" style={{background: '#eff6ff', color: '#1e40af'}}>📅</div>
          <h3>Total School Days</h3>
          <p className="main-val">124</p>
          <span className="sub-text">ⓘ Current Academic Year</span>
        </div>
        
        <div className="att-card" style={{gridColumn: 'span 1.5'}}>
          <div className="att-card-icon" style={{background: '#ede9fa', color: '#2d2460'}}>📈</div>
          <h3>Average Attendance Rate</h3>
          <p className="main-val" style={{color: '#6A5ACD'}}>88.4%</p>
          <div className="prog-bar-bg" style={{height: '8px', width: '60%'}}>
             <div className="prog-bar-fill" style={{width: '88%', background: '#6A5ACD'}}></div>
          </div>
        </div>

        <div className="ai-observation-card" style={{gridColumn: 'span 2'}}>
           <div className="ai-obs-header">
             <div style={{width: '32px', height: '32px', background: '#1e293b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.4rem'}}>✨</div>
             AI Observation
           </div>
           <p className="ai-obs-text">
             Attendance peaked on Wednesdays. 4 students show a recurrent absence pattern on Mondays.
           </p>
           <Link to="#" style={{fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', textDecoration: 'underline'}}>Generate Detailed Insight</Link>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="roster-section">
         <div className="roster-section-header">
            <h2 style={{fontSize: '2.4rem', fontWeight: 800}}>{selectedClass} - Student Breakdown</h2>
            <button className="btn-secondary-outline" style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
               <span>📥</span> Export CSV
            </button>
         </div>

         <table className="premium-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Attendance Rate</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Olawale Adeyemi', p: 118, a: 6, rate: '95.2%', level: 'high', init: 'OA' },
                { name: 'Chinelo Okafor', p: 112, a: 12, rate: '90.3%', level: 'high', init: 'CO' },
                { name: 'Babatunde Emeka', p: 104, a: 20, rate: '83.8%', level: 'med', init: 'BE' },
                { name: 'Sadiq Musa', p: 88, a: 36, rate: '70.9%', level: 'low', init: 'SM' },
                { name: 'Tobi Adebayo', p: 115, a: 9, rate: '92.7%', level: 'high', init: 'TA' },
              ].map((s, i) => (
                <tr key={i}>
                  <td>
                    <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
                       <div className="student-avatar-circle" style={{background: '#eff6ff', color: '#1e40af'}}>{s.init}</div>
                       <span style={{fontWeight: 700}}>{s.name}</span>
                    </div>
                  </td>
                  <td>{s.p}</td>
                  <td>{s.a}</td>
                  <td>
                    <span className={`att-rate-badge ${s.level}`}>
                      {s.rate}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
         </table>

         <div style={{marginTop: '3rem', display: 'flex', justifyContent: 'flex-end'}}>
            <div className="pagination-wrap">
               <button className="pag-btn">❮</button>
               <button className="pag-btn">❯</button>
            </div>
         </div>
      </div>

      {/* Policy Helper Banner */}
      <div className="policy-helper-banner">
         <div className="policy-image-side">
            <img 
              src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=1000" 
              alt="Students in classroom" 
            />
            <div style={{position: 'absolute', bottom: '3rem', left: '3rem', right: '3rem', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', padding: '2rem', borderRadius: '12px', color: 'white', fontSize: '1.5rem', fontWeight: 700, fontStyle: 'italic', border: '1px solid rgba(255,255,255,0.2)'}}>
              "Consistent attendance is the first step toward academic mastery."
            </div>
         </div>
         <div className="policy-text-side">
            <h2>Attendance Policy Helper</h2>
            <p>
              The school policy requires students to maintain a minimum of 75% attendance to qualify for terminal examinations. Students marked in <span style={{color: '#dc2626', fontWeight: 800}}>Red</span> should be scheduled for a counseling session with the academic registrar.
            </p>
            <div style={{display: 'flex', gap: '2rem'}}>
               <button className="btn-secondary-outline" style={{flex: 1, padding: '1.5rem', borderRadius: '10px', fontSize: '1.4rem', fontWeight: 800, background: 'white'}}>
                 <span>✉</span> Notify Parents
               </button>
               <button className="btn-secondary-outline" style={{flex: 1, padding: '1.5rem', borderRadius: '10px', fontSize: '1.4rem', fontWeight: 800, background: 'white'}}>
                 <span>📄</span> Generate Slip
               </button>
            </div>
         </div>
      </div>

      {/* Floating AI Insight (Bottom Left) */}
      <div style={{position: 'fixed', bottom: '3rem', left: '2rem', width: '220px', background: '#451a03', borderRadius: '16px', padding: '2rem', color: '#fef3c7', zIndex: 110, border: '1px solid #b8860b'}}>
         <div style={{display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', color: '#FFD700', marginBottom: '1rem'}}>
           <span>✨</span> AI Insights
         </div>
         <p style={{fontSize: '1.1rem', color: '#fde68a', lineHeight: 1.4}}>
           System identified 3 classes with attendance below threshold.
         </p>
      </div>

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

export default AttendanceReport;
