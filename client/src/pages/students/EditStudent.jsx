import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getStudentById, updateStudent } from '../../services/studentService';
import { getClasses } from '../../services/classService';
import './Students.css';

const EditStudent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [classes, setClasses] = useState([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    gender: '',
    classId: '',
    parentPhone: '',
    isActive: true,
  });

  useEffect(() => {
    Promise.all([getStudentById(id), getClasses()])
      .then(([{ data: student }, { data: cls }]) => {
        setFormData({
          firstName: student.firstName || student.name?.split(' ')[0] || '',
          lastName: student.lastName || student.name?.split(' ').slice(1).join(' ') || '',
          dob: student.dob ? student.dob.substring(0, 10) : '',
          gender: student.gender || '',
          classId: student.classId || '',
          parentPhone: student.parentPhone || '',
          isActive: student.isActive ?? true,
        });
        setClasses(cls.classes ?? cls);
      })
      .catch(() => toast.error('Failed to load student data'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) {
      toast.error('First name and last name are required');
      return;
    }
    setSubmitting(true);
    try {
      await updateStudent(id, formData);
      toast.success('Student updated successfully');
      navigate(`/students/${id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to update student');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="students-container" style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
      Loading student...
    </div>
  );

  return (
    <div className="students-container">

      <div style={{ marginBottom: '3rem' }}>
        <Link
          to={`/students/${id}`}
          style={{ textDecoration: 'none', color: '#64748b', fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '1rem' }}
        >
          <span>←</span> Back to Student Profile
        </Link>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
        <h1 style={{ fontSize: '4.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>Edit Student</h1>
        <p style={{ fontSize: '1.6rem', color: '#64748b' }}>Update student information. Fields marked with * are required.</p>
      </div>

      <div className="form-card-premium">
        <form onSubmit={handleSubmit}>

          <div className="form-section-header">
            <div className="form-section-title">
              <span style={{ width: '40px', height: '40px', background: '#ede9fa', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: '#6A5ACD' }}>👤</span>
              Student Information
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group-premium">
              <label>First Name *</label>
              <input type="text" name="firstName" required value={formData.firstName} onChange={handleChange} />
            </div>
            <div className="form-group-premium">
              <label>Last Name *</label>
              <input type="text" name="lastName" required value={formData.lastName} onChange={handleChange} />
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
            <div className="form-group-premium">
              <label>Parent Phone</label>
              <input type="tel" name="parentPhone" placeholder="+234 800 000 0000" value={formData.parentPhone} onChange={handleChange} />
            </div>
          </div>

          <div className="form-section-header" style={{ marginTop: '4rem' }}>
            <div className="form-section-title">
              <span style={{ width: '40px', height: '40px', background: '#ede9fa', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: '#6A5ACD' }}>⚙️</span>
              Account Settings
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group-premium">
              <label>Status</label>
              <select
                name="isActive"
                value={formData.isActive ? 'true' : 'false'}
                onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div className="form-actions-row">
            <button type="button" className="btn-cancel" onClick={() => navigate(`/students/${id}`)} disabled={submitting}>
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

export default EditStudent;
