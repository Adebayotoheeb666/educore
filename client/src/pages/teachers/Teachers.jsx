import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getTeachers } from '../../services/teacherService';
import '../students/Students.css';
import './Teachers.css';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    getTeachers()
      .then(({ data }) => {
        setTeachers(data.teachers ?? data);
        setTotal(data.total ?? (data.teachers ?? data).length);
      })
      .catch(() => toast.error('Failed to load teachers'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="teachers-container">
      
      {/* Page Header */}
      <div className="page-header-row" style={{marginBottom: '5rem'}}>
        <div className="page-header-text">
          <h1 style={{fontSize: '3.2rem'}}>Teacher Management</h1>
        </div>
        <div className="header-actions">
           <Link to="/teachers/invite" className="btn-primary-green" style={{background: '#6A5ACD'}}>
             <span>👤+</span> Invite Teacher
           </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon" style={{position: 'absolute', left: '1.8rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8'}}>🔍</span>
          <input type="text" placeholder="Search by teacher name, email or department..." />
        </div>
        <button className="btn-secondary-outline">
          <span>📊</span> Filters
        </button>
      </div>

      {/* Table Section */}
      <div className="premium-table-card">
        {loading ? (
          <div style={{padding: '4rem', textAlign: 'center', color: '#64748b'}}>Loading teachers…</div>
        ) : teachers.length === 0 ? (
          <div style={{padding: '4rem', textAlign: 'center', color: '#64748b'}}>No teachers found.</div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map(t => (
                <tr key={t._id ?? t.id}>
                  <td>
                    <div className="student-info-cell">
                      <div className="student-avatar-small">
                        <img src={t.avatar || `https://ui-avatars.com/api/?name=${t.name}&background=random`} alt="" style={{width: '100%'}} />
                      </div>
                      <div className="student-name-stack">
                        <h4>{t.name}</h4>
                        <p>{t.department ?? t.dept}</p>
                      </div>
                    </div>
                  </td>
                  <td><span style={{fontSize: '1.3rem', color: '#64748b'}}>{t.email}</span></td>
                  <td>
                    <span className="role-badge">{t.role?.replace('_', ' ')}</span>
                  </td>
                  <td><span className="phone-text">{t.phone}</span></td>
                  <td>
                    <Link to={`/teachers/${t._id ?? t.id}`} className="btn-secondary-outline" style={{padding: '0.8rem 2rem', fontSize: '1.2rem'}}>View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && teachers.length > 0 && (
          <div className="table-footer">
            <div className="showing-text">Showing {teachers.length} of {total} teachers</div>
          </div>
        )}
      </div>

      {/* AI Administrative Insights */}
      <div style={{marginTop: '6rem'}}>
        <h2 style={{fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '3rem'}}>
           <span style={{color: '#FFD700'}}>✨</span> AI Administrative Insights
        </h2>
        
        <div className="ai-staff-insights-grid">
          <div className="ai-staff-insight-card">
            <h4>Curriculum Coverage</h4>
            <p>Mathematics department is 15% ahead of the term schedule.</p>
            <div className="prog-bar-bg" style={{height: '8px', background: '#eff6ff'}}>
              <div className="prog-bar-fill" style={{width: '75%', background: '#6A5ACD'}}></div>
            </div>
          </div>
          
          <div className="ai-staff-insight-card blue">
            <h4>Attendance Trend</h4>
            <p>98% teacher attendance recorded this week across all levels.</p>
          </div>
          
          <div className="ai-staff-insight-card orange">
            <h4>Staff Load</h4>
            <p>3 teachers have been flagged for high workload. Consider redistribution.</p>
          </div>
        </div>
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

export default Teachers;
