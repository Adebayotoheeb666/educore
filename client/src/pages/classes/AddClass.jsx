import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { createClass } from '../../services/classService';
import { getTeachers } from '../../services/teacherService';
import './Classes.css';
import '../students/Students.css';

const LEVELS = [
  'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6',
  'JSS 1', 'JSS 2', 'JSS 3',
  'SS 1', 'SS 2', 'SS 3',
];

const AddClass = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    arm: '',
    level: '',
    classTeacher: '',
  });

  useEffect(() => {
    getTeachers()
      .then(({ data }) => setTeachers(data.teachers ?? data))
      .catch(() => {});
  }, []);

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
      await createClass(formData);
      toast.success('Class created successfully');
      navigate('/classes');
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to create class');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="classes-container">

      <div style={{ marginBottom: '3rem' }}>
        <Link to="/classes" style={{ textDecoration: 'none', color: '#64748b', fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>←</span> Back to Classes
        </Link>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
        <h1 style={{ fontSize: '4.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>Add New Class</h1>
        <p style={{ fontSize: '1.6rem', color: '#64748b' }}>Create a new academic class. Fields marked with * are required.</p>
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
                placeholder="e.g. JSS1, SS2, Primary 3"
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
                <option value="">Assign later</option>
                {teachers.map(t => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-actions-row">
            <button type="button" className="btn-cancel" onClick={() => navigate('/classes')} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create Class'}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};

export default AddClass;
