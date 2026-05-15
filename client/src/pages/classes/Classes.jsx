import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getClasses, deleteClass } from '../../services/classService';
import './Classes.css';
import '../students/Students.css';

const Classes = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    setLoading(true);
    getClasses()
      .then(({ data }) => setClasses(data.classes ?? data))
      .catch(() => toast.error('Failed to load classes'))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const totalStudents = classes.reduce((sum, c) => sum + (c.students?.length ?? 0), 0);
    const avgSize = classes.length > 0 ? Math.round(totalStudents / classes.length) : 0;
    return { totalStudents, totalClasses: classes.length, avgSize };
  }, [classes]);

  const handleDelete = async (classId) => {
    setDeletingId(classId);
    try {
      await deleteClass(classId);
      setClasses(prev => prev.filter(c => (c._id ?? c.id) !== classId));
      toast.success('Class deleted');
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to delete class');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="classes-container">

      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '3.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.8rem' }}>Class Management</h1>
          <p style={{ fontSize: '1.6rem', color: '#64748b' }}>Directory of all academic arms and grade levels.</p>
        </div>
        <button onClick={() => navigate('/classes/add')} className="btn-primary-green" style={{ background: '#6A5ACD' }}>
          + Add Class
        </button>
      </div>

      {/* Summary Stats — computed from real data */}
      <div className="class-stats-grid">
        <div className="class-stat-mini-card">
          <div className="class-stat-icon-wrap">👥</div>
          <div className="class-stat-text-stack">
            <h3>Total Students</h3>
            <p>{loading ? '—' : stats.totalStudents.toLocaleString()}</p>
          </div>
        </div>
        <div className="class-stat-mini-card">
          <div className="class-stat-icon-wrap">🎓</div>
          <div className="class-stat-text-stack">
            <h3>Total Classes</h3>
            <p>{loading ? '—' : stats.totalClasses}</p>
          </div>
        </div>
        <div className="class-stat-mini-card">
          <div className="class-stat-icon-wrap">👤</div>
          <div className="class-stat-text-stack">
            <h3>Avg. Class Size</h3>
            <p>{loading ? '—' : stats.avgSize}</p>
          </div>
        </div>
      </div>

      {/* Class Cards Grid */}
      <div className="class-cards-grid">
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b', gridColumn: '1/-1' }}>Loading classes…</div>
        ) : classes.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b', gridColumn: '1/-1' }}>No classes found.</div>
        ) : classes.map(cls => {
          const cId = cls._id ?? cls.id;
          return (
            <div key={cId} style={{ position: 'relative' }}>
              {/* Delete controls overlay */}
              <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10, display: 'flex', gap: '0.5rem' }}>
                {confirmDeleteId === cId ? (
                  <>
                    <button
                      onClick={() => handleDelete(cId)}
                      disabled={!!deletingId}
                      style={{ padding: '0.4rem 1rem', borderRadius: '6px', background: '#ef4444', color: '#fff', border: 'none', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {deletingId === cId ? '…' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      style={{ padding: '0.4rem 1rem', borderRadius: '6px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={(e) => { e.preventDefault(); setConfirmDeleteId(cId); }}
                    style={{ padding: '0.4rem 1rem', borderRadius: '6px', background: '#fff0f0', color: '#ef4444', border: '1px solid #fecaca', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    🗑️
                  </button>
                )}
              </div>

              <Link to={`/classes/${cId}`} style={{ textDecoration: 'none' }}>
                <div className="class-card-premium">
                  <span className="class-card-badge">ACTIVE</span>
                  <div className="class-code-box">{(cls.name ?? '').slice(0, 3).toUpperCase()}</div>
                  <h2>{cls.name}{cls.arm ? ` ${cls.arm}` : ''}</h2>
                  <p>{cls.level ?? ''}</p>
                  <div className="class-card-footer">
                    <div className="student-count-row">
                      <span>👥</span> {cls.students?.length ?? 0} Students
                    </div>
                    <span style={{ fontSize: '1.8rem', color: '#94a3b8' }}>→</span>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}

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
            {stats.totalStudents > 0 ? `+ ${stats.totalStudents.toLocaleString()} Active Students` : ''}
          </div>
        </div>
        <div className="promo-image-wrap">
          <img
            src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=1000"
            alt="Educators working"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </div>

      <div style={{ marginTop: '6rem', borderTop: '1px solid #f1f5f9', paddingTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '1.2rem', color: '#64748b' }}>
          <strong>EDUCORE AI</strong><br />
          © 2024 EduCore AI. Nigeria's Wise Digital Assistant.
        </div>
        <div style={{ display: 'flex', gap: '2.5rem', fontSize: '1.3rem', color: '#475569', fontWeight: 600 }}>
          <Link to="#" style={{ textDecoration: 'none', color: 'inherit' }}>Privacy Policy</Link>
          <Link to="#" style={{ textDecoration: 'none', color: 'inherit' }}>Terms of Service</Link>
          <Link to="#" style={{ textDecoration: 'none', color: 'inherit' }}>Help Desk</Link>
          <Link to="#" style={{ textDecoration: 'none', color: 'inherit' }}>Contact Support</Link>
        </div>
      </div>

    </div>
  );
};

export default Classes;
