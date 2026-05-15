import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Library.css';
import '../teachers/Teachers.css';

const Library = () => {
  const [activeTab, setActiveTab] = useState('Inventory');

  return (
    <div className="library-container">
      
      {/* Header */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem'}}>
        <h1 style={{fontSize: '3.6rem', fontWeight: 800, color: '#0f172a'}}>Library Management</h1>
        <button className="btn-primary-green" style={{background: '#6A5ACD', padding: '1.2rem 3rem'}}>
           <span>➕</span> Quick Issue
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="lib-nav-tabs">
         <div className={`lib-tab ${activeTab === 'Inventory' ? 'active' : ''}`} onClick={() => setActiveTab('Inventory')}>Books Inventory</div>
         <div className={`lib-tab ${activeTab === 'Borrows' ? 'active' : ''}`} onClick={() => setActiveTab('Borrows')}>Active Borrows</div>
         <div className={`lib-tab ${activeTab === 'Analytics' ? 'active' : ''}`} onClick={() => setActiveTab('Analytics')}>Library Analytics</div>
      </div>

      <div className="library-main-grid">
        
        {/* Left: Add Book & AI Insight */}
        <div>
           <div className="add-book-card">
              <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '4rem'}}>
                 <div style={{width: '36px', height: '36px', background: '#ede9fa', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2d2460', fontSize: '1.6rem'}}>📚</div>
                 <h2 style={{fontSize: '2.2rem', fontWeight: 800}}>Add New Book</h2>
              </div>

              <form>
                 <div className="form-group-premium" style={{marginBottom: '2.5rem'}}>
                    <label>Book Title</label>
                    <input type="text" placeholder="e.g. Advanced Mathematics" />
                 </div>

                 <div className="form-grid" style={{gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem'}}>
                    <div className="form-group-premium">
                       <label>Author</label>
                       <input type="text" placeholder="Full Name" />
                    </div>
                    <div className="form-group-premium">
                       <label>Category</label>
                       <select><option>Science</option><option>Literature</option><option>History</option></select>
                    </div>
                 </div>

                 <div className="form-group-premium" style={{marginBottom: '2.5rem'}}>
                    <label>ISBN-13</label>
                    <input type="text" placeholder="978-X-XXXX-XXXX-X" />
                 </div>

                 <div className="form-group-premium" style={{marginBottom: '4rem'}}>
                    <label>Number of Copies</label>
                    <input type="number" placeholder="5" />
                 </div>

                  <button type="button" className="btn-primary-green" style={{width: '100%', padding: '1.8rem', background: '#6A5ACD', borderRadius: '12px', fontSize: '1.6rem', fontWeight: 800}}>
                    Register Book
                 </button>
              </form>
           </div>

           <div className="ai-forecast-card">
              <div className="ai-forecast-content">
                 <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem'}}>
                    <span style={{fontSize: '2rem'}}>✨</span>
                    <h4 style={{fontSize: '1.2rem', fontWeight: 800, color: '#2d2460', textTransform: 'uppercase'}}>AI Demand Forecast</h4>
                 </div>
                 <p style={{fontSize: '1.4rem', color: '#1e293b', fontStyle: 'italic', lineHeight: 1.6, marginBottom: '3rem'}}>
                    "High demand predicted for 'Introduction to Python' next week due to upcoming mid-term exams. Recommend restocking 5 additional copies."
                 </p>
                 <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div className="accuracy-badge">Accuracy: 94%</div>
                    <div style={{width: '150px', height: '6px', background: '#f1f5f9', borderRadius: '3px'}}>
                       <div style={{width: '94%', height: '100%', background: '#6A5ACD', borderRadius: '3px'}}></div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Right: Inventory Stats & List */}
        <div>
           <div className="inv-stats-grid">
              <div className="inv-stat-box">
                 <h4>Total Titles</h4>
                 <p>1,284</p>
              </div>
              <div className="inv-stat-box green">
                 <h4>Issued Books</h4>
                 <p>342</p>
              </div>
              <div className="inv-stat-box red">
                 <h4>Overdue</h4>
                 <p>18</p>
              </div>
           </div>

           <div className="exam-list-card">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem'}}>
                 <h2 style={{fontSize: '2.4rem', fontWeight: 800}}>Inventory List</h2>
                 <div style={{display: 'flex', gap: '1.5rem'}}>
                    <button className="btn-secondary-outline" style={{padding: '1rem', border: '1px solid #e2e8f0'}}>🎚️</button>
                    <button className="btn-secondary-outline" style={{padding: '1rem', border: '1px solid #e2e8f0'}}>📥</button>
                 </div>
              </div>

              <table className="premium-table">
                 <thead>
                    <tr>
                       <th>Book Title</th>
                       <th>Author</th>
                       <th>ISBN</th>
                       <th>Status</th>
                       <th>Stock</th>
                    </tr>
                 </thead>
                 <tbody>
                    <tr>
                       <td>
                          <div className="book-info-row">
                             <div className="book-icon-box">📘</div>
                             <div>
                                <h4 style={{fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.3rem'}}>Principles of Physics</h4>
                                <p style={{fontSize: '1.1rem', color: '#94a3b8'}}>Academic / Grade 12</p>
                             </div>
                          </div>
                       </td>
                       <td style={{fontSize: '1.3rem', fontWeight: 700}}>Dr. Segun Adeyemi</td>
                       <td style={{fontSize: '1.1rem', color: '#64748b'}}>978-1-23456-789-0</td>
                       <td><span className="status-label-lib available">Available</span></td>
                       <td style={{fontWeight: 800}}>12 / 15</td>
                    </tr>
                    <tr>
                       <td>
                          <div className="book-info-row">
                             <div className="book-icon-box">📖</div>
                             <div>
                                <h4 style={{fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.3rem'}}>Purple Hibiscus</h4>
                                <p style={{fontSize: '1.1rem', color: '#94a3b8'}}>Literature / Fiction</p>
                             </div>
                          </div>
                       </td>
                       <td style={{fontSize: '1.3rem', fontWeight: 700}}>Chimamanda Ngozi Adichie</td>
                       <td style={{fontSize: '1.1rem', color: '#64748b'}}>978-0-34567-890-1</td>
                       <td><span className="status-label-lib limited">Limited</span></td>
                       <td style={{fontWeight: 800}}>1 / 8</td>
                    </tr>
                    <tr>
                       <td>
                          <div className="book-info-row">
                             <div className="book-icon-box">🧪</div>
                             <div>
                                <h4 style={{fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.3rem'}}>Advanced Biology</h4>
                                <p style={{fontSize: '1.1rem', color: '#94a3b8'}}>Academic / Grade 11</p>
                             </div>
                          </div>
                       </td>
                       <td style={{fontSize: '1.3rem', fontWeight: 700}}>Prof. Kofi Mensah</td>
                       <td style={{fontSize: '1.1rem', color: '#64748b'}}>978-5-67890-123-4</td>
                       <td><span className="status-label-lib borrowed">Borrowed</span></td>
                       <td style={{fontWeight: 800}}>0 / 5</td>
                    </tr>
                 </tbody>
              </table>

              <div style={{marginTop: '3.5rem', display: 'flex', justifyContent: 'flex-end'}}>
                 <div className="pagination-wrap">
                    <button className="pag-btn">Previous</button>
                    <button className="pag-btn active">1</button>
                    <button className="pag-btn">2</button>
                    <button className="pag-btn">Next</button>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div style={{marginTop: '6rem', borderTop: '1px solid #f1f5f9', paddingTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{fontSize: '1.2rem', color: '#64748b'}}>
          <strong>EDUCORE AI</strong><br/>
          © 2024 EduCore AI. Nigerian Excellence in Education.
        </div>
        <div style={{display: 'flex', gap: '2.5rem', fontSize: '1.3rem', color: '#475569', fontWeight: 600}}>
          <Link to="#" style={{textDecoration: 'none', color: 'inherit'}}>Privacy Policy</Link>
          <Link to="#" style={{textDecoration: 'none', color: 'inherit'}}>Terms of Service</Link>
          <Link to="#" style={{textDecoration: 'none', color: 'inherit'}}>Support</Link>
        </div>
      </div>

    </div>
  );
};

export default Library;
