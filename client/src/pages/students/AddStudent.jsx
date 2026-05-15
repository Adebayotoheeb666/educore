import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { createStudent } from '../../services/studentService';
import { getClasses } from '../../services/classService';
import './Students.css';

const AddStudent = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [classes, setClasses] = useState([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dob: '',
    gender: '',
    classId: '',
    parentPhone: '',
    parentEmail: '',
  });

  useEffect(() => {
    getClasses()
      .then(({ data }) => setClasses(data.classes ?? data))
      .catch(() => {});
  }, []);

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

    setSubmitting(true);
    try {
      const { data } = await createStudent(formData);
      toast.success(
        `Student added! Admission No: ${data.admissionNo} — Default password: ${data.defaultPassword}`,
        { duration: 8000 }
      );
      navigate('/students');
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to add student');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="students-container">

      <div style={{marginBottom: '3rem'}}>
        <Link to="/students" style={{textDecoration: 'none', color: '#64748b', fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <span>←</span> Back to Student List
        </Link>
      </div>

      <div style={{textAlign: 'center', marginBottom: '5rem'}}>
        <h1 style={{fontSize: '4.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem'}}>Add New Student</h1>
        <p style={{fontSize: '1.6rem', color: '#64748b'}}>Register a new student into the EduCore ecosystem. Fields marked with * are required.</p>
      </div>

      <div className="form-card-premium">
        <form onSubmit={handleSubmit}>

          {/* Section 1: Student Information */}
          <div className="form-section-header">
            <div className="form-section-title">
              <span style={{width: '40px', height: '40px', background: '#ede9fa', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: '#6A5ACD'}}>👤</span>
              Student Information
            </div>
            <div className="ai-verify-badge">
              ✨ AI Enhanced Verification
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group-premium">
              <label>First Name *</label>
              <input type="text" name="firstName" placeholder="e.g. Chinelo" required value={formData.firstName} onChange={handleChange} />
            </div>
            <div className="form-group-premium">
              <label>Last Name *</label>
              <input type="text" name="lastName" placeholder="e.g. Okafor" required value={formData.lastName} onChange={handleChange} />
            </div>
            <div className="form-group-premium">
              <label>Email Address *</label>
              <input type="email" name="email" placeholder="student@example.com" required value={formData.email} onChange={handleChange} />
            </div>
            <div className="form-group-premium">
              <label>Date of Birth</label>
              <input type="date" name="dob" value={formData.dob} onChange={handleChange} />
            </div>
            <div className="form-group-premium">
              <label>Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div className="form-group-premium">
              <label>Class</label>
              <select name="classId" value={formData.classId} onChange={handleChange}>
                <option value="">Select Class</option>
                {classes.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.name}{c.arm ? ` ${c.arm}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Parent Details */}
          <div className="form-section-header" style={{marginTop: '5rem'}}>
            <div className="form-section-title">
              <span style={{width: '40px', height: '40px', background: '#ede9fa', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: '#6A5ACD'}}>👥</span>
              Parent / Guardian Details
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group-premium">
              <label>Parent Phone</label>
              <input type="tel" name="parentPhone" placeholder="+234 800 000 0000" value={formData.parentPhone} onChange={handleChange} />
            </div>
            <div className="form-group-premium">
              <label>Parent Email</label>
              <input type="email" name="parentEmail" placeholder="parent@example.com" value={formData.parentEmail} onChange={handleChange} />
            </div>
          </div>

          <div style={{background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1.6rem 2rem', marginTop: '1rem', fontSize: '1.3rem', color: '#166534'}}>
            A default login password will be auto-generated and shown after the student is added.
          </div>

          <div className="form-actions-row">
            <button type="button" className="btn-cancel" onClick={() => navigate('/students')} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? 'Adding…' : 'Add Student'}
            </button>
          </div>

        </form>
      </div>

      <div className="form-feature-grid">
        <div className="feature-box-small">
          <div style={{fontSize: '2rem'}}>🛡️</div>
          <div className="feature-text">
            <h5>Data Privacy</h5>
            <p>All student data is encrypted following Nigeria's NDPR guidelines.</p>
          </div>
        </div>
        <div className="feature-box-small">
          <div style={{fontSize: '2rem'}}>📈</div>
          <div className="feature-text">
            <h5>Smart Enrollment</h5>
            <p>AI automatically assigns students to optimized house groups.</p>
          </div>
        </div>
        <div className="feature-box-small">
          <div style={{fontSize: '2rem'}}>💬</div>
          <div className="feature-text">
            <h5>Auto-Notify</h5>
            <p>Parents will receive a welcome SMS upon successful registration.</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AddStudent;
