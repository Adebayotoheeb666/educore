import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getPlatformUsers, updatePlatformUser } from '../../services/adminService';

const ROLES = [
  '',
  'school_owner',
  'principal',
  'vp_academics',
  'vp_admin',
  'admin_staff',
  'class_teacher',
  'subject_teacher',
  'bursar',
  'parent',
  'student',
];

const SuperAdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [updatingId, setUpdatingId] = useState(null);

  const load = () => {
    setLoading(true);
    getPlatformUsers({ page, limit: 25, search, role: role || undefined })
      .then((data) => {
        setUsers(data.users || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [page, role]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const toggleActive = async (user) => {
    setUpdatingId(user.id);
    try {
      await updatePlatformUser(user.id, { isActive: !user.isActive });
      toast.success(user.isActive ? 'User deactivated' : 'User activated');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

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
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'flex-end',
          }}
        >
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, flex: 1 }}>
            Platform Users ({total})
          </h3>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select
              value={role}
              onChange={(e) => { setRole(e.target.value); setPage(1); }}
              style={{ padding: '0.6rem', borderRadius: 8, border: '1px solid #e2e8f0' }}
            >
              <option value="">All roles</option>
              {ROLES.filter(Boolean).map((r) => (
                <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
              ))}
            </select>
            <input
              type="search"
              placeholder="Search name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '0.6rem 1rem', borderRadius: 8, border: '1px solid #e2e8f0', minWidth: 220 }}
            />
            <button type="submit" className="btn btn-dark btn-sm" style={{ padding: '0.6rem 1.2rem' }}>
              Search
            </button>
          </form>
        </div>

        {loading ? (
          <div className="d-flex justify-content-center py-5">
            <div className="spinner-border text-primary" />
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th style={{ padding: '1rem 1.25rem' }}>User</th>
                  <th>Role</th>
                  <th>School</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 700 }}>{u.name}</div>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{u.email}</div>
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>{u.role?.replace(/_/g, ' ')}</td>
                      <td>
                        {u.schoolId ? (
                          <Link to={`/admin/schools/${u.schoolId}`} style={{ color: '#5849b8', fontWeight: 600 }}>
                            {u.schoolName}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: 20,
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            background: u.isActive ? '#ede9fa' : '#fee2e2',
                            color: u.isActive ? '#2d2460' : '#991b1b',
                          }}
                        >
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.9rem', color: '#64748b' }}>
                        {u.joinedAt
                          ? new Date(u.joinedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td>
                        <button
                          type="button"
                          disabled={updatingId === u.id}
                          onClick={() => toggleActive(u)}
                          style={{
                            padding: '0.35rem 0.9rem',
                            borderRadius: 8,
                            border: '1px solid #e2e8f0',
                            background: '#fff',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                          }}
                        >
                          {updatingId === u.id ? '…' : u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && !loading && (
          <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn btn-sm btn-outline-secondary">
              Prev
            </button>
            <span style={{ alignSelf: 'center', fontWeight: 700 }}>Page {page} of {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="btn btn-sm btn-outline-secondary">
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminUsers;
