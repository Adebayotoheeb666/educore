import React from 'react';
import { Link } from 'react-router-dom';
import './Results.css';
import '../teachers/Teachers.css';

const Broadsheet = () => {
  return (
    <div className="results-container">
      
      <div style={{marginBottom: '4rem'}}>
        <h1 style={{fontSize: '3.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.8rem'}}>Export Broadsheet</h1>
        <p style={{fontSize: '1.6rem', color: '#64748b'}}>Generate and download comprehensive class-wide performance reports in Excel format.</p>
      </div>

      <div className="broadsheet-grid">
        {/* Left: Criteria Form */}
        <div className="export-criteria-card">
           <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '4rem'}}>
              <span style={{fontSize: '2.4rem'}}>📑</span>
              <h2 style={{fontSize: '2rem', fontWeight: 800}}>Selection Criteria</h2>
           </div>

           <form>
              <div className="form-group-premium" style={{marginBottom: '3rem'}}>
                 <label>Select Class</label>
                 <select>
                    <option>Choose a class...</option>
                    <option>SS3 Science A</option>
                    <option>SS3 Art B</option>
                 </select>
              </div>

              <div className="form-grid" style={{gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '4rem'}}>
                 <div className="form-group-premium">
                    <label>Term</label>
                    <select><option>First Term</option><option>Second Term</option></select>
                 </div>
                 <div className="form-group-premium">
                    <label>Academic Session</label>
                    <select><option>2023/2024</option><option>2022/2023</option></select>
                 </div>
              </div>

              <div style={{marginBottom: '5rem'}}>
                 <h4 style={{fontSize: '1.2rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2.5rem'}}>Export Options</h4>
                 <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
                    <label style={{display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', cursor: 'pointer'}}>
                       <input type="checkbox" defaultChecked style={{width: '20px', height: '20px'}} />
                       Include Subject Averages
                    </label>
                    <label style={{display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', cursor: 'pointer'}}>
                       <input type="checkbox" defaultChecked style={{width: '20px', height: '20px'}} />
                       Include Position in Class
                    </label>
                    <label style={{display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', cursor: 'pointer'}}>
                       <input type="checkbox" style={{width: '20px', height: '20px'}} />
                       Include Attendance Records
                    </label>
                 </div>
              </div>

              <button type="button" className="btn-primary-green" style={{width: '100%', padding: '2rem', background: '#6A5ACD', borderRadius: '12px', fontSize: '1.6rem', fontWeight: 800}}>
                 <span>📥</span> Download Broadsheet (Excel)
              </button>
              <p style={{textAlign: 'center', fontSize: '1.2rem', color: '#64748b', marginTop: '1.5rem'}}>
                 File format: .xlsx • Size approx. 2.4MB
              </p>
           </form>
        </div>

        {/* Right: Preview & Recents */}
        <aside>
           <div className="smart-prep-tip">
              <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem'}}>
                 <span style={{fontSize: '2rem'}}>💡</span>
                 <h4 style={{fontSize: '1.4rem', fontWeight: 800, color: '#b8860b'}}>Smart Prep Tip</h4>
              </div>
              <p style={{fontSize: '1.3rem', color: '#475569', lineHeight: 1.6, margin: 0}}>
                Generating broadsheets for final year classes (SS3) automatically includes the WASSCE preparatory mock scores in a separate tab for easier tracking.
              </p>
           </div>

           <div className="export-preview-card">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
                 <span style={{fontSize: '1.1rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase'}}>Export Preview</span>
                 <span style={{padding: '0.4rem 0.8rem', background: '#ede9fa', color: '#2d2460', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 800}}>EXCEL LAYOUT</span>
              </div>
              <div className="export-preview-img-wrap">
                 <img 
                   src="https://images.unsplash.com/photo-1543286386-713bdd548da4?auto=format&fit=crop&q=80&w=1000" 
                   alt="Excel Preview" 
                   style={{width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6}}
                 />
              </div>
           </div>

           <div className="recent-exports-list">
              <h4 style={{fontSize: '1.2rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '2.5rem'}}>Recently Exported</h4>
              <div className="export-item-mini">
                 <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
                    <span style={{fontSize: '2rem'}}>📄</span>
                    <div>
                       <h5 style={{fontSize: '1.3rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.3rem'}}>SS3_Science_A_Term1.xlsx</h5>
                       <p style={{fontSize: '1.1rem', color: '#94a3b8'}}>2 mins ago • 1.2 MB</p>
                    </div>
                 </div>
                 <button style={{border: 'none', background: 'none', color: '#2d2460', fontWeight: 800, fontSize: '1.2rem', cursor: 'pointer'}}>Open</button>
              </div>
              <div className="export-item-mini">
                 <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
                    <span style={{fontSize: '2rem'}}>📄</span>
                    <div>
                       <h5 style={{fontSize: '1.3rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.3rem'}}>JSS3_General_Term3.xlsx</h5>
                       <p style={{fontSize: '1.1rem', color: '#94a3b8'}}>Yesterday • 4.5 MB</p>
                    </div>
                 </div>
                 <button style={{border: 'none', background: 'none', color: '#2d2460', fontWeight: 800, fontSize: '1.2rem', cursor: 'pointer'}}>Open</button>
              </div>
           </div>
        </aside>
      </div>

    </div>
  );
};

export default Broadsheet;
