import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { createSubject } from '../../services/subjectService';
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

const AddSubject = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    nerdcCode: '',
    category: '',
  });

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
      await createSubject(formData);
      toast.success('Subject created successfully');
      navigate('/subjects');
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to create subject');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="subjects-container">
      <div style={{ marginBottom: '3rem' }}>
        <Link to="/subjects" style={{ textDecoration: 'none', color: '#64748b', fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>←</span> Back to Subjects
        </Link>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
        <h1 style={{ fontSize: '3.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>Add Subject</h1>
        <p style={{ fontSize: '1.6rem', color: '#64748b' }}>Add a new curriculum subject to your school catalog.</p>
      </div>

      <div className="form-card-premium">
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
              {submitting ? 'Creating…' : 'Create Subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSubject;
