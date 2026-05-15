import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getClasses } from '../../services/classService';
import './Classes.css';
import '../students/Students.css';

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getClasses()
      .then(({ data }) => setClasses(data.classes ?? data))
      .catch(() => toast.error('Failed to load classes'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="classes-container">
      
      {/* Top Header */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem'}}>
        <div>
          <h1 style={{fontSize: '3.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.8rem'}}>Class Management</h1>
          <p style={{fontSize: '1.6rem', color: '#64748b'}}>Directory of all academic arms and grade levels for the 2023/2024 Session.</p>
        </div>
        <button className="btn-primary-green" style={{background: '#6A5ACD'}}>+ Add Class</button>
      </div>

      {/* Summary Stats */}
      <div className="class-stats-grid">
        <div className="class-stat-mini-card">
          <div className="class-stat-icon-wrap">👥</div>
          <div className="class-stat-text-stack">
            <h3>Total Students</h3>
            <p>1,248</p>
          </div>
        </div>
        <div className="class-stat-mini-card">
          <div className="class-stat-icon-wrap">🎓</div>
          <div className="class-stat-text-stack">
            <h3>Total Classes</h3>
            <p>42</p>
          </div>
        </div>
        <div className="class-stat-mini-card">
          <div className="class-stat-icon-wrap">👤</div>
          <div className="class-stat-text-stack">
            <h3>Avg. Class Size</h3>
            <p>30</p>
          </div>
        </div>
      </div>

      {/* Class Cards Grid */}
      <div className="class-cards-grid">
        {loading ? (
          <div style={{padding: '4rem', textAlign: 'center', color: '#64748b', gridColumn: '1/-1'}}>Loading classes…</div>
        ) : classes.length === 0 ? (
          <div style={{padding: '4rem', textAlign: 'center', color: '#64748b', gridColumn: '1/-1'}}>No classes found.</div>
        ) : classes.map(cls => (
          <Link to={`/classes/${cls._id ?? cls.id}`} key={cls._id ?? cls.id} style={{textDecoration: 'none'}}>
            <div className="class-card-premium">
              <span className="class-card-badge">ACTIVE</span>
              <div className="class-code-box">{(cls.name ?? '').slice(0, 3).toUpperCase()}</div>
              <h2>{cls.name}</h2>
              <p>{cls.level ?? cls.section ?? ''}</p>
              <div className="class-card-footer">
                <div className="student-count-row">
                  <span>👥</span> {cls.studentCount ?? cls.students ?? 0} Students
                </div>
                <span style={{fontSize: '1.8rem', color: '#94a3b8'}}>→</span>
              </div>
            </div>
          </Link>
        ))}

        {/* AI Insight Card */}
        <div className="ai-grouping-card">
           <div className="ai-group-header">
              <span>✨</span> AI Insight
           </div>
           <h3 className="ai-group-title">Optimal Grouping</h3>
           <p className="ai-group-desc">
             Let AI suggest student arms based on academic balance and performance history.
           </p>
           <button className="btn-analytics">Run Analytics</button>
           <div style={{position: 'absolute', bottom: '-20px', right: '-20px', fontSize: '10rem', opacity: 0.05}}>✨</div>
        </div>
      </div>

      {/* Promotional Banner */}
      <div className="promo-banner-admin">
        <div className="promo-content">
          <h2>Empowering the Next Generation</h2>
          <p>Manage your curriculum and student growth with the most intuitive administrative tools built for Nigeria's best educators.</p>
          <div className="promo-avatars">
            <div className="avatar-stack-mini">
               <img src="https://ui-avatars.com/api/?name=User+1" alt="" />
               <img src="https://ui-avatars.com/api/?name=User+2" alt="" />
               <img src="https://ui-avatars.com/api/?name=User+3" alt="" />
            </div>
            + 1,200 Active Students
          </div>
        </div>
        <div className="promo-image-wrap">
           <img 
             src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=1000" 
             alt="Educators working" 
             style={{width: '100%', height: '100%', objectFit: 'cover'}} 
           />
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

export default Classes;
