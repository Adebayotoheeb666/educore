import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getAllSchools } from '../../services/adminService';

const PLAN_COLORS = {
  free: { bg: '#f1f5f9', color: '#475569' },
  basic: { bg: '#dbeafe', color: '#1e40af' },
  standard: { bg: '#ede9fa', color: '#2d2460' },
  premium: { bg: '#f3e8ff', color: '#6d28d9' },
  enterprise: { bg: '#fef9c3', color: '#854d0e' },
};

const STATUS_COLORS = {
  active: { bg: '#ede9fa', color: '#2d2460' },
  suspended: { bg: '#fee2e2', color: '#991b1b' },
  trial: { bg: '#fef9c3', color: '#854d0e' },
  inactive: { bg: '#fee2e2', color: '#991b1b' },
};

const SuperAdminSchools = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    getAllSchools({ search })
      .then((data) => setSchools(data.schools || []))
      .catch(() => toast.error('Failed to load schools'))
      .finally(() => setLoading(false));
  }, [search]);

  const perPage = 15;
  const paginated = schools.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(schools.length / perPage) || 1;

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
            All Schools ({schools.length})
          </h3>
          <input
            type="search"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '0.6rem 1rem',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              fontSize: '0.95rem',
              outline: 'none',
              minWidth: 260,
            }}
          />
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th style={{ padding: '1rem 1.25rem' }}>School</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Students</th>
                <th>Teachers</th>
                <th>Classes</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    No schools found
                  </td>
                </tr>
              ) : (
                paginated.map((school) => {
                  const plan = PLAN_COLORS[school.subscription?.plan] || PLAN_COLORS.basic;
                  const status = STATUS_COLORS[school.status] || STATUS_COLORS.active;
                  return (
                    <tr key={school._id}>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{school.name}</div>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{school.email || '—'}</div>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: 20,
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            background: plan.bg,
                            color: plan.color,
                          }}
                        >
                          {school.subscription?.plan || 'basic'}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: 20,
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            background: status.bg,
                            color: status.color,
                          }}
                        >
                          {school.status}
                        </span>
                      </td>
                      <td>{school.studentCount ?? 0}</td>
                      <td>{school.teacherCount ?? 0}</td>
                      <td>{school.classCount ?? 0}</td>
                      <td style={{ color: '#64748b', fontSize: '0.9rem' }}>
                        {school.createdAt
                          ? new Date(school.createdAt).toLocaleDateString('en-NG', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td>
                        <Link
                          to={`/admin/schools/${school._id}`}
                          style={{
                            padding: '0.4rem 1rem',
                            borderRadius: 8,
                            background: '#f1f5f9',
                            color: '#0f172a',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            textDecoration: 'none',
                          }}
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  background: p === page ? '#0f172a' : '#f1f5f9',
                  color: p === page ? '#fff' : '#64748b',
                  fontWeight: 700,
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

export default SuperAdminSchools;
