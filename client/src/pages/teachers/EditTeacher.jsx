import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getTeacherById, updateTeacher } from '../../services/teacherService';
import './Teachers.css';

const ROLE_OPTIONS = [
  { label: 'Subject Teacher', value: 'subject_teacher' },
  { label: 'Class Teacher',   value: 'class_teacher' },
];

const EditTeacher = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    role: 'subject_teacher',
    isActive: true,
  });

  useEffect(() => {
    setLoading(true);
    getTeacherById(id)
      .then(({ data }) => {
        setFormData({
          firstName: data.firstName || data.name?.split(' ')[0] || '',
          lastName: data.lastName || data.name?.split(' ').slice(1).join(' ') || '',
          phone: data.phone || '',
          role: ROLE_OPTIONS.some(o => o.value === data.role) ? data.role : 'subject_teacher',
          isActive: data.isActive ?? true,
        });
      })
      .catch(() => toast.error('Failed to load teacher data'))
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
      await updateTeacher(id, {
        ...formData,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
      });
      toast.success('Teacher updated successfully');
      navigate(`/teachers/${id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to update teacher');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="teachers-container" style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
      Loading teacher...
    </div>
  );

  return (
    <div className="teachers-container">

      <div style={{ marginBottom: '3rem' }}>
        <Link
          to={`/teachers/${id}`}
          style={{ textDecoration: 'none', color: '#64748b', fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '1rem' }}
        >
          <span>←</span> Back to Teacher Profile
        </Link>
      </div>

      <div className="invite-form-card">
        <h1 style={{ fontSize: '3.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem', textAlign: 'center' }}>Edit Teacher</h1>
        <p style={{ fontSize: '1.5rem', color: '#64748b', textAlign: 'center', marginBottom: '4rem', lineHeight: 1.5 }}>
          Update teacher information. Fields marked with * are required.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group-premium">
              <label>First Name *</label>
              <input type="text" name="firstName" required value={formData.firstName} onChange={handleChange} />
            </div>
            <div className="form-group-premium">
              <label>Last Name *</label>
              <input type="text" name="lastName" required value={formData.lastName} onChange={handleChange} />
            </div>
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

          <div className="form-group-premium" style={{ marginTop: '2rem' }}>
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

          <div className="form-actions-row" style={{ justifyContent: 'center', gap: '2rem' }}>
            <button type="button" className="btn-cancel" style={{ padding: '1.4rem 4rem' }} onClick={() => navigate(`/teachers/${id}`)} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" style={{ padding: '1.4rem 4rem', background: '#6A5ACD' }} disabled={submitting}>
              {submitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default EditTeacher;
