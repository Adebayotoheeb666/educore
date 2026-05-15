import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getSchoolById, updateSchoolAdmin } from '../../services/adminService';

const PLANS = ['free', 'basic', 'standard', 'premium', 'enterprise'];

const SchoolDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [plan, setPlan] = useState('');
  const [status, setStatus] = useState('active');

  const load = () => {
    setLoading(true);
    getSchoolById(id)
      .then((res) => {
        setData(res);
        setPlan(res.school?.subscription?.plan || 'basic');
        setStatus(res.school?.status || 'active');
      })
      .catch(() => toast.error('Failed to load school details'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const res = await updateSchoolAdmin(id, { plan, status });
      setData((prev) => ({ ...prev, school: res.school }));
      toast.success('School updated');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  if (!data?.school) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p>School not found.</p>
        <Link to="/admin/schools">← Back to schools</Link>
      </div>
    );
  }

  const { school, users, services, activity, owner } = data;
  const activityItems = [
    ...(activity?.payments || []).map((a) => ({ ...a, kind: 'payment' })),
    ...(activity?.announcements || []).map((a) => ({ ...a, kind: 'announcement' })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 12);

  return (
    <div>
      <Link to="/admin/schools" style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 700, textDecoration: 'none' }}>
        ← All Schools
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: '1.5rem 0 2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>{school.name}</h2>
          <p style={{ color: '#64748b', margin: '0.25rem 0 0' }}>{school.email || '—'}</p>
          {owner && (
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Owner: {owner.name || `${owner.firstName || ''} ${owner.lastName || ''}`.trim()} ({owner.email})
            </p>
          )}
        </div>
        <span
          style={{
            padding: '0.4rem 1rem',
            borderRadius: 20,
            fontWeight: 700,
            background: school.status === 'active' ? '#ede9fa' : '#fee2e2',
            color: school.status === 'active' ? '#2d2460' : '#991b1b',
          }}
        >
          {school.status}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Students', value: school.studentCount },
          { label: 'Teachers', value: school.teacherCount },
          { label: 'Classes', value: school.classCount },
          { label: 'Staff', value: school.staffCount },
        ].map((s) => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.25rem' }}>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>{s.label}</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '1.75rem', fontWeight: 800 }}>{s.value ?? 0}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <section style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 800, marginBottom: '1rem' }}>Services usage</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {[
              ['Attendance records', services?.attendanceRecords],
              ['Exams', services?.exams],
              ['Results', services?.results],
              ['Payments', services?.payments],
              ['Announcements', services?.announcements],
            ].map(([label, val]) => (
              <li key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <span>{label}</span>
                <strong>{val ?? 0}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 800, marginBottom: '1rem' }}>Subscription</h3>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.9rem' }}>Plan</label>
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            style={{ width: '100%', padding: '0.65rem', marginBottom: '1rem', borderRadius: 8, border: '1px solid #e2e8f0' }}
          >
            {PLANS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.9rem' }}>Account status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ width: '100%', padding: '0.65rem', marginBottom: '1rem', borderRadius: 8, border: '1px solid #e2e8f0' }}
          >
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="trial">Trial</option>
          </select>
          <button
            type="button"
            onClick={handleUpdate}
            disabled={updating}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#0f172a',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontWeight: 700,
              cursor: updating ? 'not-allowed' : 'pointer',
            }}
          >
            {updating ? 'Saving…' : 'Save changes'}
          </button>
          <p style={{ fontSize: '0.8rem', color: '#b45309', marginTop: '1rem' }}>
            Suspending blocks logins for all users at this school.
          </p>
        </section>
      </div>

      <section style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontWeight: 800, marginBottom: '1rem' }}>Recent activity</h3>
        {activityItems.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No recent activity.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {activityItems.map((item) => (
              <li key={`${item.kind}-${item.id}`} style={{ padding: '0.65rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#5849b8', textTransform: 'uppercase' }}>
                  {item.kind}
                </span>
                <div style={{ fontWeight: 600 }}>{item.title}</div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  {item.at ? new Date(item.at).toLocaleString('en-NG') : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0, fontWeight: 800 }}>Users ({users?.length || 0})</h3>
        </div>
        <div className="table-responsive">
          <table className="table table-sm table-hover mb-0">
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(users || []).map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td style={{ textTransform: 'capitalize' }}>{u.role?.replace(/_/g, ' ')}</td>
                  <td>{u.isActive ? 'Active' : 'Inactive'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default SchoolDetail;
