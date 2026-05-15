import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getClass, deleteClass } from '../../services/classService';
import './Classes.css';

const ClassDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    getClass(id)
      .then(({ data }) => setClassInfo(data))
      .catch(() => toast.error('Failed to load class'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteClass(id);
      toast.success('Class deleted successfully');
      navigate('/classes');
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to delete class');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading) return (
    <div className="classes-container" style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
      Loading class...
    </div>
  );

  if (!classInfo) return (
    <div className="classes-container" style={{ padding: '4rem', textAlign: 'center', color: '#ef4444' }}>
      Class not found.
    </div>
  );

  const teacherName = classInfo.classTeacher?.name ?? 'Not assigned';
  const studentCount = classInfo.students?.length ?? 0;
  const subjectList = classInfo.subjects ?? [];
  const roster = classInfo.students ?? [];

  return (
    <div className="classes-container">

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '4rem', maxWidth: '480px', width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>⚠️</div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>Delete Class?</h2>
            <p style={{ fontSize: '1.5rem', color: '#64748b', marginBottom: '3rem' }}>
              This will permanently remove <strong>{classInfo.name}{classInfo.arm ? ` ${classInfo.arm}` : ''}</strong> and cannot be undone.
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

      {/* Detail Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link to="/classes" style={{ textDecoration: 'none', color: '#64748b', fontSize: '2.4rem' }}>←</Link>
          <div>
            <h1 style={{ fontSize: '3.2rem', fontWeight: 800, color: '#0f172a' }}>
              {classInfo.name}{classInfo.arm ? ` ${classInfo.arm}` : ''} Details
            </h1>
            <p style={{ fontSize: '1.4rem', color: '#64748b' }}>{classInfo.level} · Session {classInfo.session}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <button
            onClick={() => setConfirmDelete(true)}
            className="btn-secondary-outline"
            style={{ color: '#ef4444', borderColor: '#fecaca' }}
          >
            🗑️ Delete
          </button>
          <button
            onClick={() => navigate(`/classes/${id}/edit`)}
            className="btn-primary-green"
            style={{ background: '#6A5ACD' }}
          >
            ✏️ Edit Class
          </button>
        </div>
      </div>

      <div className="profile-grid-layout" style={{ gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>

        {/* Class Info Box */}
        <div className="class-info-card-detail">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 800 }}>Class Info</h2>
            <span style={{ fontSize: '2rem', color: '#6A5ACD' }}>ⓘ</span>
          </div>

          <div className="detail-info-grid">
            <div className="detail-info-item">
              <label>Level</label>
              <p>{classInfo.level}</p>
            </div>
            <div className="detail-info-item">
              <label>Session</label>
              <p>{classInfo.session}</p>
            </div>
            <div className="detail-info-item">
              <label>Class Teacher</label>
              <p>{teacherName}</p>
            </div>
            <div className="detail-info-item">
              <label>Student Count</label>
              <p>{studentCount}</p>
            </div>
            {classInfo.arm && (
              <div className="detail-info-item">
                <label>Arm</label>
                <p>{classInfo.arm}</p>
              </div>
            )}
          </div>

          <div className="ai-attendance-box">
            <h5><span>✨</span> AI Attendance Analysis</h5>
            <p>Attendance analysis will be available once records are logged for this class this term.</p>
          </div>
        </div>

        {/* Subjects Box */}
        <div className="subjects-card-detail">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 800 }}>Subjects</h2>
            <span style={{ fontSize: '2rem', color: '#6A5ACD' }}>📖</span>
          </div>

          {subjectList.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '1.4rem' }}>
              No subjects assigned yet.
            </div>
          ) : (
            <div className="subjects-tags-grid">
              {subjectList.map((sub, i) => (
                <div key={sub._id ?? i} className="subject-tag-pill green">
                  {sub.name ?? sub}
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 'auto' }}>
            <div className="prog-bar-bg" style={{ height: '8px', marginBottom: '1.2rem' }}>
              <div className="prog-bar-fill" style={{ width: `${subjectList.length > 0 ? 60 : 0}%`, background: '#6A5ACD' }}></div>
            </div>
            <p style={{ fontSize: '1.3rem', fontWeight: 700, color: '#475569' }}>
              {subjectList.length} Subject{subjectList.length !== 1 ? 's' : ''} Assigned
            </p>
          </div>
        </div>

        {/* Students Roster (Full Width) */}
        <div className="roster-card" style={{ gridColumn: 'span 2' }}>
          <div className="roster-header">
            <div>
              <h2 style={{ fontSize: '2.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Students</h2>
              <p style={{ fontSize: '1.4rem', color: '#64748b' }}>{studentCount} student{studentCount !== 1 ? 's' : ''} enrolled</p>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <button className="btn-secondary-outline">Export CSV</button>
            </div>
          </div>

          {roster.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8', fontSize: '1.4rem' }}>
              No students enrolled in this class yet.
            </div>
          ) : (
            <table className="roster-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Admission Number</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((student) => (
                  <tr key={student._id}>
                    <td>{student.name}</td>
                    <td style={{ fontFamily: 'monospace' }}>{student.admissionNo ?? '—'}</td>
                    <td>
                      <span className={`status-label ${student.isActive !== false ? 'active' : ''}`}>
                        {student.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td>
                      <Link to={`/students/${student._id}`} style={{ fontSize: '1.8rem', cursor: 'pointer', color: '#6A5ACD', textDecoration: 'none' }}>👁</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {roster.length > 0 && (
            <div style={{ marginTop: '3rem', textAlign: 'center' }}>
              <Link to="/students" style={{ color: '#6A5ACD', fontWeight: 800, fontSize: '1.4rem', textDecoration: 'none' }}>View All Students →</Link>
            </div>
          )}
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

export default ClassDetail;
