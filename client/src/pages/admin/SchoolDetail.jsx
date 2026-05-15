import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';

const PLANS = ['free', 'basic', 'standard', 'premium', 'enterprise'];

const SchoolDetail = () => {
  const { id } = useParams();
  const [school, setSchool]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [updating, setUpdating]   = useState(false);
  const [plan, setPlan]           = useState('');
  const [status, setStatus]       = useState('');

  useEffect(() => {
    axios.get(`/api/admin/schools/${id}`)
      .then(({ data }) => {
        setSchool(data?.school || data);
        setPlan(data?.school?.subscription?.plan || data?.subscription?.plan || 'free');
        setStatus(data?.school?.status || data?.status || 'active');
      })
      .catch(() => toast.error('Failed to load school details'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await axios.patch(`/api/admin/schools/${id}`, { subscription: { plan }, status });
      toast.success('School updated successfully');
      setSchool((prev) => ({ ...prev, subscription: { ...prev?.subscription, plan }, status }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
      <div className="spinner-border text-primary" />
    </div>
  );

  if (!school) return (
    <div style={{ textAlign: 'center', padding: '8rem 2rem' }}>
      <span style={{ fontSize: '4rem' }}>🏫</span>
      <p style={{ fontSize: '1.6rem', color: '#64748b', marginTop: '2rem' }}>School not found.</p>
      <Link to="/admin/schools" style={{ color: '#4f46e5', fontWeight: 700 }}>← Back to Schools</Link>
    </div>
  );

  return (
    <div style={{ padding: '4rem', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: '3rem' }}>
        <Link to="/admin/schools" style={{ fontSize: '1.4rem', color: '#64748b', fontWeight: 700, textDecoration: 'none' }}>
          ← All Schools
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4rem' }}>
        <div>
          <h1 style={{ fontSize: '3.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>{school.name}</h1>
          <p style={{ fontSize: '1.5rem', color: '#64748b', margin: 0 }}>{school.email}</p>
        </div>
        <span style={{
          padding: '0.6rem 1.8rem',
          borderRadius: 20,
          fontWeight: 700,
          fontSize: '1.4rem',
          background: school.status === 'active' ? '#ede9fa' : '#fee2e2',
          color: school.status === 'active' ? '#2d2460' : '#991b1b',
        }}>
          {school.status || 'active'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginBottom: '4rem' }}>
        {[
          { label: 'Students',  value: school.studentCount ?? '—',  icon: '👨‍🎓' },
          { label: 'Teachers',  value: school.teacherCount ?? '—',  icon: '👨‍🏫' },
          { label: 'Classes',   value: school.classCount   ?? '—',  icon: '📚' },
        ].map((s) => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: '2.5rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <span style={{ fontSize: '2.8rem' }}>{s.icon}</span>
            <div>
              <p style={{ fontSize: '1.3rem', color: '#64748b', margin: 0 }}>{s.label}</p>
              <p style={{ fontSize: '2.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>

        {/* School Info */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '3rem', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '2.5rem' }}>School Profile</h3>
          {[
            ['Address',       school.address || '—'],
            ['Phone',         school.phone   || '—'],
            ['State',         school.state   || '—'],
            ['LGA',           school.lga     || '—'],
            ['School Type',   school.type    || '—'],
            ['Date Joined',   school.createdAt ? new Date(school.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'],
            ['Current Plan',  school.subscription?.plan || 'free'],
            ['Plan Expires',  school.subscription?.expiresAt ? new Date(school.subscription.expiresAt).toLocaleDateString('en-NG') : '—'],
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '1.2rem 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '1.4rem', color: '#64748b' }}>{label}</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 600, color: '#0f172a' }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Admin Actions */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '3rem', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '2.5rem' }}>Admin Actions</h3>

          <div style={{ marginBottom: '2.5rem' }}>
            <label style={{ display: 'block', fontSize: '1.4rem', fontWeight: 600, color: '#475569', marginBottom: '0.8rem' }}>
              Subscription Plan
            </label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              style={{ width: '100%', padding: '1.2rem 1.5rem', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: '1.4rem', outline: 'none' }}
            >
              {PLANS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '3rem' }}>
            <label style={{ display: 'block', fontSize: '1.4rem', fontWeight: 600, color: '#475569', marginBottom: '0.8rem' }}>
              Account Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ width: '100%', padding: '1.2rem 1.5rem', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: '1.4rem', outline: 'none' }}
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="trial">Trial</option>
            </select>
          </div>

          <button
            onClick={handleUpdate}
            disabled={updating}
            style={{
              width: '100%',
              padding: '1.4rem',
              background: '#0f172a',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: '1.5rem',
              cursor: updating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              opacity: updating ? 0.7 : 1,
            }}
          >
            {updating ? <><div className="spinner-border spinner-border-sm" /> Saving...</> : '💾 Save Changes'}
          </button>

          <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f3f0ff', borderRadius: 10, border: '1px solid #fed7aa' }}>
            <p style={{ fontSize: '1.2rem', color: '#9a3412', margin: 0 }}>
              ⚠️ Suspending a school will prevent all users from logging in until the account is reactivated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolDetail;
