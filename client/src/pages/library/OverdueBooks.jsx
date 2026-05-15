import React from 'react';
import { Link } from 'react-router-dom';
import './Library.css';
import '../students/Students.css';

const OverdueBooks = () => {
  return (
    <div className="library-container">
      
      {/* Header */}
      <div className="overdue-header-premium">
         <div>
            <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem'}}>
               <span style={{fontSize: '3rem'}}>⚠️</span>
               <h1 style={{fontSize: '3.6rem', fontWeight: 800, color: '#0f172a'}}>Overdue Borrows</h1>
            </div>
            <p style={{fontSize: '1.6rem', color: '#64748b', maxWidth: '600px'}}>
               Immediate action required for <strong style={{color: '#b91c1c'}}>42 pending returns</strong> across all departments.
            </p>
         </div>
         <div style={{display: 'flex', gap: '2rem'}}>
            <button className="btn-primary-green" style={{background: '#6A5ACD', padding: '1.2rem 3rem'}}>
               <span>📩</span> Notify Parents
            </button>
            <button className="btn-secondary-outline" style={{padding: '1.2rem 3rem', border: '1px solid #e2e8f0'}}>
               <span>📥</span> Export List
            </button>
         </div>
      </div>

      {/* Stats & AI Insight */}
      <div className="inv-stats-grid" style={{gridTemplateColumns: '1fr 1fr 1.5fr', marginBottom: '5rem'}}>
         <div className="inv-stat-box red">
            <h4>Total Overdue</h4>
            <p>42</p>
            <div style={{marginTop: '1rem', fontSize: '1.2rem', fontWeight: 800, color: '#b91c1c'}}>
               📈 +12% vs last week
            </div>
         </div>
         <div className="inv-stat-box">
            <h4>Longest Delay</h4>
            <p>18 Days</p>
            <div style={{marginTop: '1rem', fontSize: '1.2rem', color: '#64748b'}}>
               Chioma A. (SS3 Blue)
            </div>
         </div>
         <div className="ai-forecast-card" style={{marginTop: 0, borderLeft: '6px solid #FFD700'}}>
            <div className="ai-forecast-content">
               <div style={{display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '1.2rem'}}>
                  <span style={{fontSize: '1.8rem'}}>✨</span>
                  <h4 style={{fontSize: '1.2rem', fontWeight: 800, color: '#b8860b', textTransform: 'uppercase'}}>AI Insight</h4>
               </div>
               <p style={{fontSize: '1.3rem', color: '#b8860b', lineHeight: 1.5, margin: 0}}>
                  "Senior Secondary 2 shows a 15% higher delinquency rate. Automate reminders for SS2 parents?"
               </p>
            </div>
         </div>
      </div>

      {/* Overdue Table */}
      <div className="exam-list-card">
         <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem', padding: '0 1rem'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '2.5rem'}}>
               <label style={{display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.4rem', fontWeight: 700, color: '#64748b'}}>
                  <input type="checkbox" style={{width: '20px', height: '20px'}} /> Select All
               </label>
               <span style={{fontSize: '1.4rem', color: '#94a3b8', fontWeight: 700}}>12 items selected</span>
            </div>
            <div style={{display: 'flex', gap: '2rem'}}>
               <select className="btn-secondary-outline" style={{padding: '0.8rem 1.5rem', borderRadius: '10px', fontSize: '1.2rem'}}>
                  <option>Filter by Class</option>
               </select>
               <select className="btn-secondary-outline" style={{padding: '0.8rem 1.5rem', borderRadius: '10px', fontSize: '1.2rem'}}>
                  <option>Sort by: Days Overdue</option>
               </select>
            </div>
         </div>

         <table className="premium-table">
            <thead>
               <tr style={{background: '#f8fafc'}}>
                  <th style={{width: '60px'}}></th>
                  <th>Student Name</th>
                  <th>Book Title</th>
                  <th>Due Date</th>
                  <th>Days Overdue</th>
                  <th>Actions</th>
               </tr>
            </thead>
            <tbody>
               <tr>
                  <td><input type="checkbox" style={{width: '20px', height: '20px'}} /></td>
                  <td>
                     <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
                        <div className="student-avatar-circle" style={{width: '40px', height: '40px', background: '#eff6ff', color: '#1e40af'}}>OA</div>
                        <div className="student-info-mini">
                           <h4>Olawale Adeyemi</h4>
                           <p>SS 3 Gold • ID: #2294</p>
                        </div>
                     </div>
                  </td>
                  <td>
                     <div style={{fontSize: '1.2rem', color: '#1e293b'}}>
                        <strong>Modern Biology for West Africa</strong><br/>
                        <span style={{color: '#94a3b8', fontSize: '1rem'}}>ISBN: 978-019-212</span>
                     </div>
                  </td>
                  <td style={{fontSize: '1.3rem', fontWeight: 700, color: '#1e293b'}}>Oct 12, 2024</td>
                  <td><span className="overdue-days-badge">18 Days</span></td>
                  <td><button style={{background: 'none', border: 'none', fontSize: '1.8rem', color: '#94a3b8', cursor: 'pointer'}}>⋮</button></td>
               </tr>
               <tr style={{background: '#fdf2f2'}}>
                  <td><input type="checkbox" defaultChecked style={{width: '20px', height: '20px'}} /></td>
                  <td>
                     <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
                        <div className="student-avatar-circle" style={{width: '40px', height: '40px', background: '#ede9fa', color: '#2d2460'}}>CJ</div>
                        <div className="student-info-mini">
                           <h4>Chima Junior</h4>
                           <p>JSS 2 Silver • ID: #3105</p>
                        </div>
                     </div>
                  </td>
                  <td>
                     <div style={{fontSize: '1.2rem', color: '#1e293b'}}>
                        <strong>New General Mathematics</strong><br/>
                        <span style={{color: '#94a3b8', fontSize: '1rem'}}>ISBN: 978-432-881</span>
                     </div>
                  </td>
                  <td style={{fontSize: '1.3rem', fontWeight: 700, color: '#1e293b'}}>Oct 15, 2024</td>
                  <td><span className="overdue-days-badge">15 Days</span></td>
                  <td><button style={{background: 'none', border: 'none', fontSize: '1.8rem', color: '#94a3b8', cursor: 'pointer'}}>⋮</button></td>
               </tr>
               <tr>
                  <td><input type="checkbox" style={{width: '20px', height: '20px'}} /></td>
                  <td>
                     <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
                        <div className="student-avatar-circle" style={{width: '40px', height: '40px', background: '#fef3c7', color: '#b8860b'}}>FE</div>
                        <div className="student-info-mini">
                           <h4>Fatima Eze</h4>
                           <p>SS 1 Bronze • ID: #4421</p>
                        </div>
                     </div>
                  </td>
                  <td>
                     <div style={{fontSize: '1.2rem', color: '#1e293b'}}>
                        <strong>The Joys of Motherhood</strong><br/>
                        <span style={{color: '#94a3b8', fontSize: '1rem'}}>ISBN: 978-011-002</span>
                     </div>
                  </td>
                  <td style={{fontSize: '1.3rem', fontWeight: 700, color: '#1e293b'}}>Oct 22, 2024</td>
                  <td><span className="overdue-days-badge" style={{background: '#FFD700'}}>8 Days</span></td>
                  <td><button style={{background: 'none', border: 'none', fontSize: '1.8rem', color: '#94a3b8', cursor: 'pointer'}}>⋮</button></td>
               </tr>
               <tr>
                  <td><input type="checkbox" style={{width: '20px', height: '20px'}} /></td>
                  <td>
                     <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
                        <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=100" style={{width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover'}} alt="Avatar" />
                        <div className="student-info-mini">
                           <h4>Tunde Bakare</h4>
                           <p>SS 2 Gold • ID: #1092</p>
                        </div>
                     </div>
                  </td>
                  <td>
                     <div style={{fontSize: '1.2rem', color: '#1e293b'}}>
                        <strong>Invisible Man</strong><br/>
                        <span style={{color: '#94a3b8', fontSize: '1rem'}}>ISBN: 978-223-119</span>
                     </div>
                  </td>
                  <td style={{fontSize: '1.3rem', fontWeight: 700, color: '#1e293b'}}>Oct 26, 2024</td>
                  <td><span className="overdue-days-badge" style={{background: '#64748b'}}>4 Days</span></td>
                  <td><button style={{background: 'none', border: 'none', fontSize: '1.8rem', color: '#94a3b8', cursor: 'pointer'}}>⋮</button></td>
               </tr>
            </tbody>
         </table>

         <div style={{marginTop: '3.5rem', display: 'flex', justifyContent: 'flex-end'}}>
            <div className="pagination-wrap">
               <button className="pag-btn">Previous</button>
               <button className="pag-btn active">1</button>
               <button className="pag-btn">2</button>
               <button className="pag-btn">3</button>
               <button className="pag-btn">Next</button>
            </div>
         </div>
      </div>

      <button className="btn-primary-green" style={{position: 'fixed', bottom: '4rem', right: '4rem', width: '60px', height: '60px', borderRadius: '50%', background: '#6A5ACD', boxShadow: '0 10px 25px rgba(5,150,105,0.3)', fontSize: '2.4rem', border: 'none', cursor: 'pointer'}}>
         ➕
      </button>

    </div>
  );
};

export default OverdueBooks;
