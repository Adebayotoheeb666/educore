import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getStudentById, deleteStudent } from '../../services/studentService';
import './Students.css';

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    getStudentById(id)
      .then(({ data }) => setStudent(data))
      .catch(() => toast.error('Failed to load student'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteStudent(id);
      toast.success('Student deleted successfully');
      navigate('/students');
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to delete student');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const formatDob = (dob) => {
    if (!dob) return 'N/A';
    const d = new Date(dob);
    const age = Math.floor((Date.now() - d) / (365.25 * 24 * 60 * 60 * 1000));
    return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} (${age} years)`;
  };

  if (loading) return (
    <div className="students-container" style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
      Loading student...
    </div>
  );

  if (!student) return (
    <div className="students-container" style={{ padding: '4rem', textAlign: 'center', color: '#ef4444' }}>
      Student not found.
    </div>
  );

  return (
    <div className="students-container">

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '4rem', maxWidth: '480px', width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>⚠️</div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>Delete Student?</h2>
            <p style={{ fontSize: '1.5rem', color: '#64748b', marginBottom: '3rem' }}>
              This will permanently remove <strong>{student.name}</strong> and all associated records. This action cannot be undone.
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

      {/* Breadcrumbs / Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '1.3rem', color: '#64748b', fontWeight: 600 }}>
          <Link to="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>Dashboard</Link>
          <span>›</span>
          <Link to="/students" style={{ textDecoration: 'none', color: 'inherit' }}>Students List</Link>
          <span>›</span>
          <span style={{ color: '#0f172a' }}>{student.name} Profile</span>
        </div>
        <div className="header-actions">
          <button
            onClick={() => setConfirmDelete(true)}
            className="btn-secondary-outline"
            style={{ color: '#ef4444', borderColor: '#fecaca' }}
          >
            <span>🗑️</span> Delete
          </button>
          <button onClick={() => navigate(`/students/${id}/edit`)} className="btn-secondary-outline">
            <span>✏️</span> Edit Profile
          </button>
          <button className="btn-primary-green" style={{ background: '#6A5ACD' }}>
            <span>📄</span> Report Card
          </button>
        </div>
      </div>

      {/* Profile Top Summary */}
      <div className="profile-top-card">
        <div className="profile-main-info">
          <div className="profile-avatar-large">
            <img
              src={student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&size=100`}
              alt=""
              style={{ width: '100%', borderRadius: '20px' }}
            />
            <span className="status-dot">{student.isActive !== false ? 'ACTIVE' : 'INACTIVE'}</span>
          </div>
          <div className="profile-text-stack">
            <h1>{student.name}</h1>
            <div className="profile-meta-row">
              <span><strong>Admission No:</strong> {student.admissionNo}</span>
              <span>📍 {student.gender || 'Gender not set'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="profile-grid-layout">

        {/* Left Side: Personal Info */}
        <aside className="profile-side-col">
          <div className="info-widget-card">
            <h3 className="widget-section-title"><span>👤</span> Personal Info</h3>
            <div className="info-item-row">
              <label>Gender</label>
              <p>{student.gender || 'N/A'}</p>
            </div>
            <div className="info-item-row">
              <label>Date of Birth</label>
              <p>{formatDob(student.dob)}</p>
            </div>
            <div className="info-item-row">
              <label>Email</label>
              <p>{student.email}</p>
            </div>
            <div className="info-item-row">
              <label>Enrolled</label>
              <p>{new Date(student.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>

            <h3 className="widget-section-title" style={{ marginTop: '4rem' }}><span>👥</span> Parent Contact</h3>
            <div className="info-item-row">
              <label>Phone Number</label>
              <p className="highlight">{student.parentPhone || 'N/A'}</p>
            </div>
          </div>

          <div className="info-widget-card">
            <h3 className="widget-section-title"><span>⚖️</span> Disciplinary Record</h3>
            <div style={{ background: '#f8fafc', padding: '3rem', borderRadius: '12px', border: '1px dashed #e2e8f0', textAlign: 'center', color: '#94a3b8', fontSize: '1.2rem' }}>
              No recorded incidents for this term.
            </div>
          </div>
        </aside>

        {/* Right Column: Account Status */}
        <div className="attendance-card-premium">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
            <h3 style={{ fontSize: '2rem', fontWeight: 800 }}>Account Status</h3>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: student.isActive !== false ? '#22c55e' : '#ef4444' }}>
              {student.isActive !== false ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p style={{ fontSize: '1.3rem', color: '#64748b', marginBottom: '1.5rem' }}>
            Enrolled since {new Date(student.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </p>
          <div className="prog-bar-bg" style={{ height: '12px', marginBottom: '1.5rem' }}>
            <div className="prog-bar-fill" style={{ width: '100%', background: '#6A5ACD' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 700 }}>
            <span style={{ color: '#94a3b8' }}>ID: {student.admissionNo}</span>
            <span style={{ color: '#6A5ACD' }}>↗ Enrolled</span>
          </div>
        </div>

        <div className="ai-academic-health-card">
          <div className="ai-health-title">
            <span>✨</span> AI Academic Health
          </div>
          <div className="ai-insight-box-inner">
            <div className="likely-grade">Analysis Pending</div>
            <p className="insight-p">
              Academic health analysis will be available once results are recorded for this student.
            </p>
          </div>
          <div style={{ position: 'absolute', top: '2rem', right: '2rem', fontSize: '3rem', opacity: 0.1 }}>✨</div>
        </div>

        {/* Bottom Row: Results */}
        <div className="results-card-premium">
          <div className="results-header-row">
            <h3 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Recent Results</h3>
            <Link to="#" style={{ color: '#6A5ACD', fontWeight: 700, fontSize: '1.4rem', textDecoration: 'none' }}>View All History →</Link>
          </div>
          <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8', fontSize: '1.4rem' }}>
            No results recorded yet for this student.
          </div>
        </div>

        {/* Clubs */}
        <div className="info-widget-card" style={{ gridColumn: '3' }}>
          <h3 className="widget-section-title"><span>⚽</span> Clubs & Societies</h3>
          <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '12px', border: '1px dashed #e2e8f0', textAlign: 'center', color: '#94a3b8', fontSize: '1.2rem' }}>
            No clubs assigned yet.
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentDetail;
