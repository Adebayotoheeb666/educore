import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Fees.css';
import '../students/Students.css';

const FeeCollection = () => {
  return (
    <div className="fees-container">
      
      {/* Header */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem'}}>
        <div>
           <h1 style={{fontSize: '3.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.8rem'}}>Fee Collection</h1>
           <p style={{fontSize: '1.6rem', color: '#64748b'}}>Manage tuition payments and generate financial insights.</p>
        </div>
        <div style={{display: 'flex', gap: '1.5rem'}}>
           <button className="btn-secondary-outline" style={{padding: '1.2rem 2.5rem'}}>Export Report</button>
           <button className="btn-primary-green" style={{background: '#6A5ACD', padding: '1.2rem 2.5rem'}}>Summary Dashboard</button>
        </div>
      </div>

      {/* Record New Payment Form */}
      <div className="collection-record-card">
         <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3.5rem'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
               <div style={{width: '36px', height: '36px', background: '#ede9fa', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2d2460', fontSize: '1.6rem'}}>➕</div>
               <h2 style={{fontSize: '2.2rem', fontWeight: 800}}>Record New Payment</h2>
            </div>
            <span style={{fontSize: '1.4rem', color: '#94a3b8'}}>❮</span>
         </div>

         <form>
            <div className="payment-form-grid">
               <div className="form-group-premium">
                  <label>Student Name</label>
                  <select>
                     <option>Select Student</option>
                     <option>Babatunde Musa</option>
                     <option>Chioma Eze</option>
                  </select>
                  <span style={{position: 'absolute', left: '1.5rem', top: '4.5rem', fontSize: '1.4rem', color: '#94a3b8'}}>👤</span>
               </div>
               <div className="form-group-premium">
                  <label>Fee Schedule</label>
                  <select>
                     <option>Select Fee Title</option>
                     <option>First Term Tuition</option>
                     <option>School Uniform</option>
                  </select>
                  <span style={{position: 'absolute', left: '1.5rem', top: '4.5rem', fontSize: '1.4rem', color: '#94a3b8'}}>📑</span>
               </div>
               <div className="form-group-premium">
                  <label>Amount (₦)</label>
                  <input type="text" placeholder="0.00" />
                  <span style={{position: 'absolute', left: '1.5rem', top: '4.5rem', fontSize: '1.4rem', color: '#94a3b8'}}>💵</span>
               </div>
               <div className="form-group-premium">
                  <label>Payment Method</label>
                  <select>
                     <option>Cash</option>
                     <option>Bank Transfer</option>
                     <option>POS</option>
                  </select>
                  <span style={{position: 'absolute', left: '1.5rem', top: '4.5rem', fontSize: '1.4rem', color: '#94a3b8'}}>💳</span>
               </div>
               <div className="form-group-premium">
                  <label>Transaction Reference</label>
                  <input type="text" placeholder="TXN-123456" />
                  <span style={{position: 'absolute', left: '1.5rem', top: '4.5rem', fontSize: '1.4rem', color: '#94a3b8'}}>🔢</span>
               </div>
               <div style={{display: 'flex', alignItems: 'flex-end'}}>
                  <button type="button" className="btn-primary-green" style={{width: '100%', padding: '1.4rem', background: '#6A5ACD', borderRadius: '12px', fontSize: '1.4rem', fontWeight: 800}}>
                     Process Payment
                  </button>
               </div>
            </div>
         </form>
      </div>

      {/* Transactions List */}
      <div className="exam-list-card">
         <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem'}}>
            <h2 style={{fontSize: '2.4rem', fontWeight: 800}}>Recent Transactions</h2>
            <div style={{display: 'flex', gap: '1.5rem', alignItems: 'center'}}>
               <div className="pattern-toggle-row" style={{background: '#f1f5f9', padding: '0.4rem', borderRadius: '10px'}}>
                  <button className="pattern-btn active" style={{padding: '0.6rem 1.5rem', border: 'none'}}>All</button>
                  <button className="pattern-btn" style={{padding: '0.6rem 1.5rem', border: 'none', background: 'none'}}>Unpaid</button>
                  <button className="pattern-btn" style={{padding: '0.6rem 1.5rem', border: 'none', background: 'none'}}>Partial</button>
               </div>
               <button className="btn-secondary-outline" style={{display: 'flex', alignItems: 'center', gap: '1rem', border: 'none', background: 'none', fontWeight: 800}}>
                  <span>🎚️</span> Filter
               </button>
            </div>
         </div>

         <table className="premium-table">
            <thead>
               <tr>
                  <th>Student</th>
                  <th>Fee Title</th>
                  <th>Amount Paid</th>
                  <th>Outstanding</th>
                  <th>Status</th>
                  <th>Actions</th>
               </tr>
            </thead>
            <tbody>
               <tr>
                  <td>
                     <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
                        <div className="student-avatar-circle" style={{width: '40px', height: '40px', background: '#eff6ff', color: '#1e40af'}}>BM</div>
                        <div className="student-info-mini">
                           <h4>Babatunde Musa</h4>
                           <p>Grade: JSS1 Gold</p>
                        </div>
                     </div>
                  </td>
                  <td>
                     <div style={{fontSize: '1.2rem', color: '#1e293b'}}>
                        <strong>First Term Tuition</strong><br/>
                        <span style={{color: '#94a3b8', fontSize: '1rem'}}>ID: 2024-FT-001</span>
                     </div>
                  </td>
                  <td style={{fontWeight: 800}}>₦50,000</td>
                  <td style={{color: '#94a3b8'}}>₦0</td>
                  <td><span className="status-pill-paid">Paid</span></td>
                  <td><button style={{background: 'none', border: 'none', fontSize: '1.8rem', color: '#94a3b8'}}>⋮</button></td>
               </tr>

               {/* AI Insight Row */}
               <tr>
                  <td colSpan="6" style={{padding: '0'}}>
                     <div className="collection-insight-card">
                        <div className="ai-icon-circle" style={{background: '#fde68a', color: '#b8860b'}}>✨</div>
                        <div style={{flex: 1}}>
                           <h4 style={{fontSize: '1.3rem', fontWeight: 800, color: '#b8860b', marginBottom: '0.5rem'}}>AI Insight: Collection Rate</h4>
                           <p style={{fontSize: '1.2rem', color: '#b8860b', margin: 0}}>
                              Tuition collection for Grade SSS2 is currently at 45%. Recommended: Send automated reminders to 12 parents via SMS.
                           </p>
                        </div>
                        <button style={{background: 'none', border: 'none', color: '#2d2460', fontWeight: 800, fontSize: '1.2rem', cursor: 'pointer'}}>Apply Suggestion</button>
                     </div>
                  </td>
               </tr>

               <tr>
                  <td>
                     <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
                        <div className="student-avatar-circle" style={{width: '40px', height: '40px', background: '#f3f0ff', color: '#2d2460'}}>CE</div>
                        <div className="student-info-mini">
                           <h4>Chioma Eze</h4>
                           <p>Grade: SSS2 Science</p>
                        </div>
                     </div>
                  </td>
                  <td>
                     <div style={{fontSize: '1.2rem', color: '#1e293b'}}>
                        <strong>First Term Tuition</strong><br/>
                        <span style={{color: '#94a3b8', fontSize: '1rem'}}>ID: 2024-FT-042</span>
                     </div>
                  </td>
                  <td style={{fontWeight: 800}}>₦20,000</td>
                  <td style={{color: '#dc2626', fontWeight: 800}}>₦30,000</td>
                  <td><span className="status-pill-partial">Partial</span></td>
                  <td><button style={{background: 'none', border: 'none', fontSize: '1.8rem', color: '#94a3b8'}}>⋮</button></td>
               </tr>
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

      <button className="btn-primary-green" style={{position: 'fixed', bottom: '4rem', right: '4rem', width: '60px', height: '60px', borderRadius: '50%', background: '#6A5ACD', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', fontSize: '2rem'}}>🖨️</button>

    </div>
  );
};

export default FeeCollection;
