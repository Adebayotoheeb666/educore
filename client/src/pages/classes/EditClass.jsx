import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getClass, updateClass } from '../../services/classService';
import { getTeachers } from '../../services/teacherService';
import './Classes.css';
import '../students/Students.css';

const LEVELS = [
  'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6',
  'JSS 1', 'JSS 2', 'JSS 3',
  'SS 1', 'SS 2', 'SS 3',
];

const EditClass = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    arm: '',
    level: '',
    classTeacher: '',
  });

  useEffect(() => {
    Promise.all([getClass(id), getTeachers()])
      .then(([{ data: cls }, { data: tch }]) => {
        setFormData({
          name: cls.name || '',
          arm: cls.arm || '',
          level: cls.level || '',
          classTeacher: cls.classTeacher?._id || cls.classTeacher || '',
        });
        setTeachers(tch.teachers ?? tch);
      })
      .catch(() => toast.error('Failed to load class data'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.level) {
      toast.error('Class name and level are required');
      return;
    }
    setSubmitting(true);
    try {
      await updateClass(id, formData);
      toast.success('Class updated successfully');
      navigate(`/classes/${id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to update class');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="classes-container" style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
      Loading class...
    </div>
  );

  return (
    <div className="classes-container">

      <div style={{ marginBottom: '3rem' }}>
        <Link to={`/classes/${id}`} style={{ textDecoration: 'none', color: '#64748b', fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>←</span> Back to Class Details
        </Link>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
        <h1 style={{ fontSize: '4.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>Edit Class</h1>
        <p style={{ fontSize: '1.6rem', color: '#64748b' }}>Update class information. Fields marked with * are required.</p>
      </div>

      <div className="form-card-premium">
        <form onSubmit={handleSubmit}>

          <div className="form-section-header">
            <div className="form-section-title">
              <span style={{ width: '40px', height: '40px', background: '#ede9fa', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: '#6A5ACD' }}>🎓</span>
              Class Details
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group-premium">
              <label>Class Name *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div className="form-group-premium">
              <label>Arm / Section</label>
              <input
                type="text"
                name="arm"
                placeholder="e.g. A, B, Gold"
                value={formData.arm}
                onChange={handleChange}
              />
            </div>
            <div className="form-group-premium">
              <label>Level *</label>
              <select name="level" required value={formData.level} onChange={handleChange}>
                <option value="">Select Level</option>
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="form-group-premium">
              <label>Class Teacher</label>
              <select name="classTeacher" value={formData.classTeacher} onChange={handleChange}>
                <option value="">No teacher assigned</option>
                {teachers.map(t => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-actions-row">
            <button type="button" className="btn-cancel" onClick={() => navigate(`/classes/${id}`)} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};

export default EditClass;
