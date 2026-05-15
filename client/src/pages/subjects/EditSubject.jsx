import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getSubject, updateSubject, assignTeacher, unassignTeacher } from '../../services/subjectService';
import { getTeachers } from '../../services/teacherService';
import '../classes/Classes.css';
import '../students/Students.css';
import './Subjects.css';

const CATEGORIES = [
  { value: 'core', label: 'Core' },
  { value: 'science', label: 'Science' },
  { value: 'arts', label: 'Arts' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'vocational', label: 'Vocational' },
];

const teacherId = (t) => (typeof t === 'string' ? t : t._id);
const teacherName = (t) => (typeof t === 'object' && t?.name ? t.name : 'Teacher');

const EditSubject = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignedTeachers, setAssignedTeachers] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    nerdcCode: '',
    category: '',
  });

  useEffect(() => {
    Promise.all([getSubject(id), getTeachers()])
      .then(([{ data: subject }, { data: teachers }]) => {
        setFormData({
          name: subject.name || '',
          code: subject.code || '',
          nerdcCode: subject.nerdcCode || '',
          category: subject.category || '',
        });
        setAssignedTeachers(subject.teachers || []);
        setAllTeachers(teachers?.teachers ?? teachers ?? []);
      })
      .catch(() => toast.error('Failed to load subject'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.error('Subject name is required');
      return;
    }
    setSubmitting(true);
    try {
      await updateSubject(id, formData);
      toast.success('Subject updated successfully');
      navigate('/subjects');
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to update subject');
    } finally {
      setSubmitting(false);
    }
  };

  const assignedIds = new Set(assignedTeachers.map(teacherId));
  const availableTeachers = allTeachers.filter(t => !assignedIds.has(teacherId(t)));

  const handleAssignTeacher = async () => {
    if (!selectedTeacherId) {
      toast.error('Select a teacher to assign');
      return;
    }
    setAssigning(true);
    try {
      const { data } = await assignTeacher(id, selectedTeacherId);
      setAssignedTeachers(data.teachers || []);
      setSelectedTeacherId('');
      toast.success('Teacher assigned');
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to assign teacher');
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassignTeacher = async (tid) => {
    setAssigning(true);
    try {
      const { data } = await unassignTeacher(id, tid);
      setAssignedTeachers(data.teachers || []);
      toast.success('Teacher removed');
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to remove teacher');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="subjects-container d-flex justify-content-center align-items-center">
        <div className="spinner-border text-success" />
      </div>
    );
  }

  return (
    <div className="subjects-container">
      <div style={{ marginBottom: '3rem' }}>
        <Link to="/subjects" style={{ textDecoration: 'none', color: '#64748b', fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>←</span> Back to Subjects
        </Link>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
        <h1 style={{ fontSize: '3.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>Edit Subject</h1>
        <p style={{ fontSize: '1.6rem', color: '#64748b' }}>Update subject details and teacher assignments.</p>
      </div>

      <div className="form-card-premium" style={{ marginBottom: '3rem' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-section-header">
            <div className="form-section-title">
              <span style={{ width: '40px', height: '40px', background: '#ede9fa', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: '#6A5ACD' }}>📚</span>
              Subject Details
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group-premium">
              <label>Subject Name *</label>
              <input type="text" name="name" placeholder="e.g. Mathematics" required value={formData.name} onChange={handleChange} />
            </div>
            <div className="form-group-premium">
              <label>Subject Code</label>
              <input type="text" name="code" placeholder="e.g. MTH" value={formData.code} onChange={handleChange} />
            </div>
            <div className="form-group-premium">
              <label>NERDC Code</label>
              <input type="text" name="nerdcCode" placeholder="Optional NERDC reference" value={formData.nerdcCode} onChange={handleChange} />
            </div>
            <div className="form-group-premium">
              <label>Category</label>
              <select name="category" value={formData.category} onChange={handleChange}>
                <option value="">Select category</option>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-actions-row">
            <button type="button" className="btn-cancel" onClick={() => navigate('/subjects')} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <div className="form-card-premium">
        <div className="form-section-header">
          <div className="form-section-title">
            <span style={{ width: '40px', height: '40px', background: '#ede9fa', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: '#6A5ACD' }}>👨‍🏫</span>
            Assigned Teachers
          </div>
        </div>

        {assignedTeachers.length === 0 ? (
          <p className="subject-modal-empty" style={{ padding: '0 2rem 1rem' }}>No teachers assigned to this subject.</p>
        ) : (
          <ul className="subject-teacher-list" style={{ padding: '0 2rem 1rem' }}>
            {assignedTeachers.map(t => {
              const tid = teacherId(t);
              const name = teacherName(t);
              return (
                <li key={tid}>
                  <span>{name}</span>
                  <button
                    type="button"
                    className="subject-teacher-remove"
                    disabled={assigning}
                    onClick={() => handleUnassignTeacher(tid)}
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {availableTeachers.length > 0 ? (
          <div className="subject-assign-row" style={{ padding: '0 2rem 2rem' }}>
            <select value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)} disabled={assigning}>
              <option value="">Select teacher to assign…</option>
              {availableTeachers.map(t => (
                <option key={teacherId(t)} value={teacherId(t)}>{t.name}</option>
              ))}
            </select>
            <button type="button" className="subject-assign-btn" disabled={assigning || !selectedTeacherId} onClick={handleAssignTeacher}>
              {assigning ? '…' : 'Assign'}
            </button>
          </div>
        ) : (
          <p className="subject-modal-empty" style={{ padding: '0 2rem 2rem' }}>
            {allTeachers.length === 0
              ? 'No teachers in your school yet. Add teachers first.'
              : 'All school teachers are assigned to this subject.'}
          </p>
        )}
      </div>
    </div>
  );
};

export default EditSubject;
