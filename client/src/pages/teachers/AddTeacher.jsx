import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { createTeacher } from '../../services/teacherService';
import './Teachers.css';

const ROLE_OPTIONS = [
  { label: 'Subject Teacher', value: 'subject_teacher' },
  { label: 'Class Teacher',   value: 'class_teacher' },
];

const AddTeacher = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'subject_teacher',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error('First name, last name, and email are required');
      return;
    }

    const year = new Date().getFullYear();
    const defaultPassword = `EduCore@${year}`;
    const payload = {
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      password: defaultPassword,
    };

    setSubmitting(true);
    try {
      await createTeacher(payload);
      toast.success(
        `Teacher added! Default password: ${defaultPassword}`,
        { duration: 8000 }
      );
      navigate('/teachers');
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to add teacher');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="teachers-container">

      <div style={{ marginBottom: '3rem' }}>
        <Link to="/teachers" style={{ textDecoration: 'none', color: '#64748b', fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>←</span> Back to Teachers
        </Link>
      </div>

      <div className="invite-form-card">
        <h1 style={{ fontSize: '3.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem', textAlign: 'center' }}>Add New Teacher</h1>
        <p style={{ fontSize: '1.5rem', color: '#64748b', textAlign: 'center', marginBottom: '4rem', lineHeight: 1.5 }}>
          Register a new faculty member. A default login password will be auto-generated and shown after the teacher is added.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group-premium">
              <label>First Name *</label>
              <input type="text" name="firstName" placeholder="e.g. Chidi" required value={formData.firstName} onChange={handleChange} />
            </div>
            <div className="form-group-premium">
              <label>Last Name *</label>
              <input type="text" name="lastName" placeholder="e.g. Okafor" required value={formData.lastName} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group-premium" style={{ marginTop: '2rem' }}>
            <label>Email Address *</label>
            <input type="email" name="email" placeholder="teacher@school.edu.ng" required value={formData.email} onChange={handleChange} />
          </div>

          <div className="form-group-premium" style={{ marginTop: '2rem' }}>
            <label>Phone Number</label>
            <input type="tel" name="phone" placeholder="+234 000 000 0000" value={formData.phone} onChange={handleChange} />
          </div>

          <div className="form-group-premium" style={{ marginTop: '2rem' }}>
            <label>Role</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              {ROLE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="ai-mapping-box">
            <span>✨</span>
            <div>
              <h5>AI Smart Mapping</h5>
              <p>Assigning a role will automatically grant curriculum access and relevant administrative permissions for the current term.</p>
            </div>
          </div>

          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1.6rem 2rem', marginTop: '1rem', fontSize: '1.3rem', color: '#166534' }}>
            A default login password will be auto-generated and shown after the teacher is added.
          </div>

          <div className="form-actions-row" style={{ justifyContent: 'center', gap: '2rem' }}>
            <button type="button" className="btn-cancel" style={{ padding: '1.4rem 4rem' }} onClick={() => navigate('/teachers')} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" style={{ padding: '1.4rem 4rem', background: '#6A5ACD' }} disabled={submitting}>
              {submitting ? 'Adding…' : 'Add Teacher'}
            </button>
          </div>
        </form>
      </div>

      <div className="license-warning">
        <span style={{ fontSize: '1.8rem' }}>ⓘ</span>
        Adding a teacher consumes 1 license seat from your current subscription tier.
      </div>

    </div>
  );
};

export default AddTeacher;
