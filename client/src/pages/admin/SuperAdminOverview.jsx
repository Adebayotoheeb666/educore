import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getPlatformDashboard } from '../../services/adminService';

const StatCard = ({ label, value, icon, accent }) => (
  <div
    style={{
      background: '#fff',
      borderRadius: 16,
      padding: '1.75rem',
      border: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}
  >
    <div>
      <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', margin: 0 }}>
        {label}
      </p>
      <p style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0 0' }}>{value}</p>
    </div>
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: accent.bg,
        color: accent.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.4rem',
      }}
    >
      {icon}
    </div>
  </div>
);

const SuperAdminOverview = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlatformDashboard()
      .then(setData)
      .catch(() => toast.error('Failed to load platform dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const { totals, usersByRole, recentSchools, recentPayments, recentAnnouncements } = data;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <StatCard label="Schools" value={totals.schools} icon="🏫" accent={{ bg: '#dbeafe', color: '#1e40af' }} />
        <StatCard label="Active Schools" value={totals.activeSchools} icon="✅" accent={{ bg: '#ede9fa', color: '#2d2460' }} />
        <StatCard label="Users" value={totals.users?.toLocaleString()} icon="👥" accent={{ bg: '#f3e8ff', color: '#6d28d9' }} />
        <StatCard label="Students" value={totals.students?.toLocaleString()} icon="🎓" accent={{ bg: '#fef9c3', color: '#854d0e' }} />
        <StatCard label="Teachers" value={totals.teachers?.toLocaleString()} icon="👨‍🏫" accent={{ bg: '#ecfdf5', color: '#047857' }} />
        <StatCard label="Parents" value={totals.parents?.toLocaleString()} icon="👨‍👩‍👧" accent={{ bg: '#fff7ed', color: '#c2410c' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <section style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontWeight: 800 }}>Users by role</h3>
            <Link to="/admin/users" style={{ color: '#5849b8', fontWeight: 700, fontSize: '0.85rem' }}>
              Manage users →
            </Link>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {(usersByRole || []).map((r) => (
              <li
                key={r.role}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0',
                  borderBottom: '1px solid #f1f5f9',
                  fontSize: '0.95rem',
                }}
              >
                <span style={{ textTransform: 'capitalize' }}>{r.role.replace(/_/g, ' ')}</span>
                <strong>{r.count}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontWeight: 800 }}>Newest schools</h3>
            <Link to="/admin/schools" style={{ color: '#5849b8', fontWeight: 700, fontSize: '0.85rem' }}>
              All schools →
            </Link>
          </div>
          {(recentSchools || []).length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No schools registered yet.</p>
          ) : (
            recentSchools.map((s) => (
              <Link
                key={s._id}
                to={`/admin/schools/${s._id}`}
                style={{
                  display: 'block',
                  padding: '0.75rem 0',
                  borderBottom: '1px solid #f1f5f9',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <strong>{s.name}</strong>
                <span style={{ float: 'right', color: '#64748b', fontSize: '0.85rem' }}>
                  {s.studentCount ?? 0} students
                </span>
              </Link>
            ))
          )}
        </section>

        <section style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontWeight: 800 }}>Recent payments</h3>
          {(recentPayments || []).length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No payment activity yet.</p>
          ) : (
            recentPayments.map((p) => (
              <div key={p.id} style={{ padding: '0.65rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>
                <div style={{ fontWeight: 700 }}>{p.studentName || 'Student'}</div>
                <span style={{ color: '#64748b' }}>
                  {p.feeTitle} · ₦{(p.amount || 0).toLocaleString()} · {p.status}
                </span>
              </div>
            ))
          )}
        </section>

        <section style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontWeight: 800 }}>Recent announcements</h3>
          {(recentAnnouncements || []).length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No announcements yet.</p>
          ) : (
            recentAnnouncements.map((a) => (
              <div key={a.id} style={{ padding: '0.65rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>
                <div style={{ fontWeight: 700 }}>{a.title}</div>
                <span style={{ color: '#64748b' }}>{a.schoolName}</span>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
};

export default SuperAdminOverview;
