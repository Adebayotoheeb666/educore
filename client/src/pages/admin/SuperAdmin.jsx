import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';

const PLAN_COLORS = {
  free:       { bg: '#f1f5f9', color: '#475569' },
  basic:      { bg: '#dbeafe', color: '#1e40af' },
  standard:   { bg: '#ede9fa', color: '#2d2460' },
  premium:    { bg: '#f3e8ff', color: '#6d28d9' },
  enterprise: { bg: '#fef9c3', color: '#854d0e' },
};

const STATUS_COLORS = {
  active:    { bg: '#ede9fa', color: '#2d2460' },
  suspended: { bg: '#fee2e2', color: '#991b1b' },
  trial:     { bg: '#fef9c3', color: '#854d0e' },
};

const SuperAdmin = () => {
  const [schools, setSchools]   = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);

  useEffect(() => {
    Promise.all([
      axios.get('/api/admin/schools'),
      axios.get('/api/analytics/dashboard'),
    ])
      .then(([schoolsRes, statsRes]) => {
        setSchools(schoolsRes.data?.schools || schoolsRes.data || []);
        setStats(statsRes.data || null);
      })
      .catch(() => toast.error('Failed to load admin data'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = schools.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );
  const perPage = 15;
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
      <div className="spinner-border text-primary" />
    </div>
  );

  return (
    <div style={{ padding: '4rem', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '3.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.8rem' }}>Super Admin Panel</h1>
        <p style={{ fontSize: '1.6rem', color: '#64748b' }}>Manage all schools on the EduCore platform</p>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', marginBottom: '4rem' }}>
          {[
            { label: 'Total Schools',   value: schools.length,                                   icon: '🏫', bg: '#dbeafe', color: '#1e40af' },
            { label: 'Active Schools',  value: schools.filter((s) => s.status === 'active').length, icon: '✅', bg: '#ede9fa', color: '#2d2460' },
            { label: 'Total Students',  value: (stats.totalStudents || 0).toLocaleString(),       icon: '👨‍🎓', bg: '#f3e8ff', color: '#6d28d9' },
            { label: 'Total Teachers',  value: (stats.totalTeachers || 0).toLocaleString(),       icon: '👨‍🏫', bg: '#fef9c3', color: '#854d0e' },
          ].map((s) => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 16, padding: '2.5rem', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '1.3rem', color: '#64748b', margin: 0, marginBottom: '0.5rem' }}>{s.label}</p>
                <p style={{ fontSize: '2.8rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{s.value}</p>
              </div>
              <div style={{ width: 48, height: 48, background: s.bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                {s.icon}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '2rem 2.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>All Schools ({filtered.length})</h3>
          <input
            type="text"
            placeholder="Search schools…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ padding: '0.9rem 1.8rem', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: '1.4rem', outline: 'none', width: 280 }}
          />
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th style={{ padding: '1.5rem', fontSize: '1.3rem', fontWeight: 700 }}>School</th>
                <th style={{ fontSize: '1.3rem', fontWeight: 700 }}>Plan</th>
                <th style={{ fontSize: '1.3rem', fontWeight: 700 }}>Status</th>
                <th style={{ fontSize: '1.3rem', fontWeight: 700 }}>Students</th>
                <th style={{ fontSize: '1.3rem', fontWeight: 700 }}>Teachers</th>
                <th style={{ fontSize: '1.3rem', fontWeight: 700 }}>Joined</th>
                <th style={{ fontSize: '1.3rem', fontWeight: 700 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8', fontSize: '1.5rem' }}>
                    No schools found
                  </td>
                </tr>
              ) : paginated.map((school) => {
                const plan   = PLAN_COLORS[school.subscription?.plan]   || PLAN_COLORS.free;
                const status = STATUS_COLORS[school.status] || STATUS_COLORS.active;
                return (
                  <tr key={school._id}>
                    <td style={{ padding: '1.5rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '1.5rem', color: '#0f172a' }}>{school.name}</div>
                      <div style={{ fontSize: '1.2rem', color: '#94a3b8' }}>{school.email}</div>
                    </td>
                    <td>
                      <span style={{ padding: '0.4rem 1.2rem', borderRadius: 20, fontSize: '1.2rem', fontWeight: 700, background: plan.bg, color: plan.color }}>
                        {school.subscription?.plan || 'free'}
                      </span>
                    </td>
                    <td>
                      <span style={{ padding: '0.4rem 1.2rem', borderRadius: 20, fontSize: '1.2rem', fontWeight: 700, background: status.bg, color: status.color }}>
                        {school.status || 'active'}
                      </span>
                    </td>
                    <td style={{ fontSize: '1.4rem' }}>{school.studentCount ?? '—'}</td>
                    <td style={{ fontSize: '1.4rem' }}>{school.teacherCount ?? '—'}</td>
                    <td style={{ fontSize: '1.4rem', color: '#64748b' }}>
                      {school.createdAt ? new Date(school.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td>
                      <Link
                        to={`/admin/schools/${school._id}`}
                        style={{ padding: '0.7rem 1.8rem', borderRadius: 8, background: '#f1f5f9', color: '#0f172a', fontWeight: 700, fontSize: '1.3rem', textDecoration: 'none' }}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ padding: '2rem 2.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: p === page ? '#0f172a' : '#f1f5f9',
                  color: p === page ? '#fff' : '#64748b',
                  fontWeight: 700, fontSize: '1.4rem',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdmin;
