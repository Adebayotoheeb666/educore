import React from 'react';
import { Link } from 'react-router-dom';
import './Fees.css';
import '../students/Students.css';

const FeeDefaulters = () => {
  return (
    <div className="fees-container">
      
      {/* Header */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem'}}>
        <div>
           <h1 style={{fontSize: '3.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.8rem'}}>Fee Defaulters</h1>
           <p style={{fontSize: '1.6rem', color: '#64748b'}}>Manage and track students with outstanding school fee balances.</p>
        </div>
        <div style={{display: 'flex', gap: '2rem', alignItems: 'center'}}>
           <div style={{padding: '1.2rem 2.5rem', background: '#eff6ff', borderRadius: '12px', color: '#1e40af', fontWeight: 800, fontSize: '1.4rem'}}>
              2 Defaulters Selected
           </div>
           <button className="btn-primary-green" style={{background: '#6A5ACD', padding: '1.2rem 3rem'}}>
              <span>📩</span> Notify Parents
           </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="defaulters-stats-grid">
         <div className="defaulter-stat-box">
            <div>
               <p style={{fontSize: '1.1rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '1.2rem'}}>Total Outstanding</p>
               <p className="defaulter-val">₦47,000</p>
            </div>
            <div className="ai-icon-circle" style={{background: '#fee2e2', color: '#991b1b'}}>💳</div>
         </div>

         <div className="defaulter-stat-box">
            <div>
               <p style={{fontSize: '1.1rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '1.2rem'}}>Active Defaulters</p>
               <p className="defaulter-val" style={{color: '#0f172a'}}>2 Students</p>
            </div>
            <div className="ai-icon-circle" style={{background: '#f1f5f9', color: '#475569'}}>👤</div>
         </div>

         <div className="defaulter-stat-box highlight" style={{background: '#f3f0ff'}}>
            <div style={{flex: 1}}>
               <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem'}}>
                  <span style={{fontSize: '1.8rem', color: '#FFD700'}}>✨</span>
                  <h4 style={{fontSize: '1.3rem', fontWeight: 800, color: '#b8860b'}}>AI Suggestion</h4>
               </div>
               <p style={{fontSize: '1.2rem', color: '#b8860b', margin: 0, lineHeight: 1.5}}>
                  Send a bulk WhatsApp notification to SS3 parents for immediate response.
               </p>
            </div>
         </div>
      </div>

      {/* Defaulters Table */}
      <div className="exam-list-card">
         <table className="premium-table">
            <thead>
               <tr style={{background: '#f8fafc'}}>
                  <th style={{width: '60px'}}><input type="checkbox" defaultChecked style={{width: '20px', height: '20px'}} /></th>
                  <th>Student Name</th>
                  <th>Class</th>
                  <th>Fee Title</th>
                  <th>Outstanding Balance</th>
                  <th>Action</th>
               </tr>
            </thead>
            <tbody>
               <tr>
                  <td><input type="checkbox" defaultChecked style={{width: '20px', height: '20px'}} /></td>
                  <td>
                     <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
                        <div className="student-avatar-circle" style={{width: '40px', height: '40px', background: '#eff6ff', color: '#1e40af'}}>IM</div>
                        <div className="student-info-mini">
                           <h4>Ibrahim Musa</h4>
                           <p>ID: ADM-2023-045</p>
                        </div>
                     </div>
                  </td>
                  <td><span style={{padding: '0.4rem 1rem', background: '#f1f5f9', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 800}}>SS3B</span></td>
                  <td>Tuition</td>
                  <td style={{fontWeight: 800, color: '#b91c1c', fontSize: '1.6rem'}}>35,000 NGN</td>
                  <td>
                     <Link to="#" style={{color: '#2d2460', fontWeight: 800, textDecoration: 'none', fontSize: '1.2rem'}}>View Details</Link>
                  </td>
               </tr>
               <tr>
                  <td><input type="checkbox" defaultChecked style={{width: '20px', height: '20px'}} /></td>
                  <td>
                     <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
                        <div className="student-avatar-circle" style={{width: '40px', height: '40px', background: '#ede9fa', color: '#2d2460'}}>AI</div>
                        <div className="student-info-mini">
                           <h4>Amina Ibrahim</h4>
                           <p>ID: ADM-2023-102</p>
                        </div>
                     </div>
                  </td>
                  <td><span style={{padding: '0.4rem 1rem', background: '#f1f5f9', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 800}}>SS3A</span></td>
                  <td>Uniform</td>
                  <td style={{fontWeight: 800, color: '#b91c1c', fontSize: '1.6rem'}}>12,000 NGN</td>
                  <td>
                     <Link to="#" style={{color: '#2d2460', fontWeight: 800, textDecoration: 'none', fontSize: '1.2rem'}}>View Details</Link>
                  </td>
               </tr>
            </tbody>
         </table>

         <div style={{marginTop: '3.5rem', display: 'flex', justifyContent: 'flex-end'}}>
            <div className="pagination-wrap">
               <button className="pag-btn">❮</button>
               <button className="pag-btn active">1</button>
               <button className="pag-btn">❯</button>
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

export default FeeDefaulters;
