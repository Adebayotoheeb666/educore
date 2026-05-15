import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Fees.css';
import '../teachers/Teachers.css';

const FeeSchedules = () => {
  return (
    <div className="fees-container">
      
      {/* Header */}
      <div style={{marginBottom: '4.5rem'}}>
        <h1 style={{fontSize: '3.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.8rem'}}>Fee Schedules</h1>
        <p style={{fontSize: '1.6rem', color: '#64748b'}}>Define and manage financial structures for academic terms.</p>
      </div>

      <div className="fee-schedules-grid">
        
        {/* Left: Create Form */}
        <div className="create-schedule-card">
           <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '4rem'}}>
              <div style={{width: '40px', height: '40px', background: '#ede9fa', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: '#2d2460'}}>➕</div>
              <h2 style={{fontSize: '2.4rem', fontWeight: 800}}>Create New Schedule</h2>
           </div>

           <form>
              <div className="form-group-premium" style={{marginBottom: '2.5rem'}}>
                 <label>Schedule Title</label>
                 <input type="text" placeholder="e.g. 2023/24 First Term Fees" />
              </div>

              <div className="form-grid" style={{gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem'}}>
                 <div className="form-group-premium">
                    <label>Term</label>
                    <select><option>First Term</option><option>Second Term</option></select>
                 </div>
                 <div className="form-group-premium">
                    <label>Session</label>
                    <select><option>2023/2024</option><option>2024/2025</option></select>
                 </div>
              </div>

              <div className="form-group-premium" style={{marginBottom: '3.5rem'}}>
                 <label>Due Date</label>
                 <input type="date" />
              </div>

              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
                 <h4 style={{fontSize: '1.4rem', fontWeight: 800}}>Fee Items</h4>
                 <button type="button" style={{background: 'none', border: 'none', color: '#2d2460', fontWeight: 800, fontSize: '1.2rem', cursor: 'pointer'}}>⊕ Add Item</button>
              </div>

              <div className="fee-item-row">
                 <span>Tuition</span>
                 <strong>65,000</strong>
              </div>
              <div className="fee-item-row">
                 <span>Uniform</span>
                 <strong>12,000</strong>
              </div>

              <div className="total-estimate-box">
                 <span style={{fontSize: '1.4rem', fontWeight: 700}}>Total Estimate</span>
                 <span style={{fontSize: '2.2rem', fontWeight: 800}}>₦ 77,000.00</span>
              </div>

              <button type="button" className="btn-primary-green" style={{width: '100%', padding: '2rem', background: '#6A5ACD', borderRadius: '12px', fontSize: '1.8rem', fontWeight: 800}}>
                 Save Fee Schedule
              </button>
           </form>
        </div>

        {/* Right: Active Schedules */}
        <div>
           <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3.5rem'}}>
              <h2 style={{fontSize: '2.4rem', fontWeight: 800}}>Active Schedules</h2>
              <div style={{display: 'flex', gap: '1.5rem'}}>
                 <button className="btn-secondary-outline" style={{padding: '1rem 2rem'}}>Export PDF</button>
                 <button className="btn-secondary-outline" style={{padding: '1rem 2rem'}}>Filter</button>
              </div>
           </div>

           {/* Schedule 1 */}
           <div className="active-schedule-card">
              <div className="schedule-badge-row">
                 <span className="curr-session-badge">Current Session</span>
                 <div style={{textAlign: 'right'}}>
                    <p style={{fontSize: '1rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase'}}>Total Amount</p>
                    <p style={{fontSize: '2.4rem', fontWeight: 800, color: '#0f172a'}}>₦ 85,000.00</p>
                 </div>
              </div>
              <h3 style={{fontSize: '2.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.8rem'}}>2023/24 First Term Fees</h3>
              <p style={{fontSize: '1.4rem', color: '#64748b', fontWeight: 700, marginBottom: '3rem'}}>Grade 1 - Grade 6 Standard Structure</p>
              
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '2.5rem'}}>
                 <div style={{display: 'flex', gap: '3rem'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.3rem', fontWeight: 800, color: '#1e293b'}}>
                       <span>📅</span> Due: Sept 15, 2023
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.3rem', fontWeight: 800, color: '#1e293b'}}>
                       <span>👤</span> 420 Students
                    </div>
                 </div>
                 <div className="student-avatars-stack" style={{justifyContent: 'flex-end'}}>
                    <div className="avatar-mini">BK</div>
                    <div className="avatar-mini" style={{background: '#ede9fa', color: '#2d2460'}}>MA</div>
                    <div className="avatar-mini" style={{background: '#eff6ff', color: '#1e40af'}}>LB</div>
                    <div className="avatar-count">+5</div>
                 </div>
              </div>
           </div>

           {/* Schedule 2 */}
           <div className="active-schedule-card optional">
              <div className="schedule-badge-row">
                 <span className="curr-session-badge" style={{background: '#eff6ff', color: '#1e40af'}}>Optional Add-ons</span>
                 <div style={{textAlign: 'right'}}>
                    <p style={{fontSize: '1rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase'}}>Total Amount</p>
                    <p style={{fontSize: '2.4rem', fontWeight: 800, color: '#0f172a'}}>₦ 45,000.00</p>
                 </div>
              </div>
              <h3 style={{fontSize: '2.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.8rem'}}>Bus & Lunch Services</h3>
              <p style={{fontSize: '1.4rem', color: '#64748b', fontWeight: 700, marginBottom: '3rem'}}>Annual Subscription Package</p>
              
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '2.5rem'}}>
                 <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '1.2rem', fontWeight: 800, color: '#dc2626'}}>
                    <span style={{fontSize: '1.8rem'}}>⚠</span> Overdue • 115 Students
                 </div>
                 <Link to="#" style={{fontSize: '1.2rem', fontWeight: 800, color: '#2d2460', textDecoration: 'none'}}>Manage Items <span>❯</span></Link>
              </div>
           </div>

           {/* AI Insight Card */}
           <div className="ai-financial-card">
              <div className="ai-icon-circle">📈</div>
              <div>
                 <h4 style={{fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem'}}>AI Financial Planning Insight</h4>
                 <p style={{fontSize: '1.3rem', color: '#475569', lineHeight: 1.6, marginBottom: '2.5rem'}}>
                    Based on your 2022 inflation data, we suggest adjusting the "Uniform Fee" by 8.5% for the upcoming session to maintain supplier quality standards.
                 </p>
                 <button className="btn-secondary-outline" style={{background: '#6A5ACD', color: 'white', border: 'none', padding: '1.2rem 2.5rem'}}>View Market Analysis</button>
              </div>
           </div>
        </div>

      </div>

    </div>
  );
};

export default FeeSchedules;
