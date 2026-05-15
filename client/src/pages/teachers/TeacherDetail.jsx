import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getTeacherById, deleteTeacher } from '../../services/teacherService';
import './Teachers.css';
import '../students/Students.css';

const TeacherDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    getTeacherById(id)
      .then(({ data }) => setTeacher(data))
      .catch(() => toast.error('Failed to load teacher'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteTeacher(id);
      toast.success('Teacher deleted successfully');
      navigate('/teachers');
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to delete teacher');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading) return (
    <div className="teachers-container" style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
      Loading teacher...
    </div>
  );

  if (!teacher) return (
    <div className="teachers-container" style={{ padding: '4rem', textAlign: 'center', color: '#ef4444' }}>
      Teacher not found.
    </div>
  );

  const roleLabel = teacher.role?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) ?? 'Teacher';

  return (
    <div className="teachers-container">

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '4rem', maxWidth: '480px', width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>⚠️</div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>Delete Teacher?</h2>
            <p style={{ fontSize: '1.5rem', color: '#64748b', marginBottom: '3rem' }}>
              This will permanently remove <strong>{teacher.name}</strong> from the system. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
              <button onClick={() => setConfirmDelete(false)} className="btn-secondary-outline" disabled={deleting}>Cancel</button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{ padding: '1.2rem 2.4rem', borderRadius: '10px', background: '#ef4444', color: '#fff', border: 'none', fontSize: '1.4rem', fontWeight: 700, cursor: 'pointer' }}
              >
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link to="/teachers" style={{ textDecoration: 'none', color: '#64748b', fontSize: '1.8rem' }}>←</Link>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '1.3rem', color: '#64748b', fontWeight: 600 }}>
            <Link to="/teachers" style={{ textDecoration: 'none', color: 'inherit' }}>Teachers</Link>
            <span>›</span>
            <span style={{ color: '#0f172a' }}>{teacher.name}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <button
            onClick={() => setConfirmDelete(true)}
            className="btn-secondary-outline"
            style={{ color: '#ef4444', borderColor: '#fecaca' }}
          >
            <span>🗑️</span> Delete
          </button>
          <button
            onClick={() => navigate(`/teachers/${id}/edit`)}
            className="btn-primary-green"
            style={{ background: '#6A5ACD' }}
          >
            ✏️ Edit Profile
          </button>
        </div>
      </div>

      {/* Profile Header Summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
          <div className="profile-avatar-large" style={{ width: '120px', height: '120px', borderRadius: '50%' }}>
            <img
              src={teacher.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.name)}&size=120`}
              alt=""
              style={{ width: '100%', borderRadius: '50%' }}
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '0.5rem' }}>
              <h1 style={{ fontSize: '3.6rem', fontWeight: 800, margin: 0 }}>{teacher.name}</h1>
              <span className={`status-badge ${teacher.isActive !== false ? 'active' : ''}`} style={{ fontSize: '1.2rem' }}>
                {teacher.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            <p style={{ fontSize: '1.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.8rem' }}>{roleLabel}</p>
            <p style={{ fontSize: '1.4rem', color: '#64748b' }}>📧 {teacher.email}</p>
          </div>
        </div>
      </div>

      {/* Profile Grid */}
      <div className="profile-grid-layout" style={{ gridTemplateColumns: '360px 1fr 1fr' }}>

        {/* Left Col: Personal Details */}
        <aside className="profile-side-col">
          <div className="info-widget-card">
            <h3 className="widget-section-title"><span>👤</span> Personal Details</h3>
            <div className="info-item-row">
              <label>Full Name</label>
              <p>{teacher.name}</p>
            </div>
            <div className="info-item-row">
              <label>Email Address</label>
              <p style={{ color: '#6A5ACD' }}>{teacher.email}</p>
            </div>
            <div className="info-item-row">
              <label>Phone Number</label>
              <p>{teacher.phone || 'N/A'}</p>
            </div>
            <div className="info-item-row">
              <label>Role</label>
              <p>{roleLabel}</p>
            </div>
            <div className="info-item-row">
              <label>Joined</label>
              <p>{new Date(teacher.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          <div className="ai-staff-insight-profile" style={{ borderLeft: '5px solid #6A5ACD' }}>
            <div className="ai-profile-icon">🌿</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem' }}>AI Insight</div>
            <p className="ai-profile-insight-text">
              Academic performance analysis will be available once this teacher's classes have recorded results this term.
            </p>
            <div style={{ position: 'absolute', top: '2rem', right: '2rem', fontSize: '3rem', opacity: 0.1 }}>✨</div>
          </div>
        </aside>

        {/* Right Col: Assigned Subjects placeholder */}
        <div className="results-card-premium" style={{ gridColumn: 'span 2' }}>
          <div className="results-header-row">
            <h3 style={{ fontSize: '2.2rem', fontWeight: 800 }}><span>📖</span> Assigned Subjects</h3>
            <Link to="#" style={{ color: '#6A5ACD', fontWeight: 700, fontSize: '1.4rem', textDecoration: 'none' }}>+ Assign New</Link>
          </div>
          <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8', fontSize: '1.4rem' }}>
            No subjects assigned yet.
          </div>
        </div>

        {/* Curriculum Progress placeholder */}
        <div className="attendance-card-premium">
          <h3 className="widget-section-title" style={{ textTransform: 'uppercase', fontSize: '1.2rem', color: '#64748b' }}>Curriculum Progress</h3>
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '1.3rem' }}>
            No curriculum data yet.
          </div>
        </div>

        {/* Attendance Metric placeholder */}
        <div className="attendance-metric-card">
          <h5>Avg. Class Attendance</h5>
          <h2 style={{ color: '#64748b' }}>—</h2>
          <p>No data recorded yet</p>
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

export default TeacherDetail;
