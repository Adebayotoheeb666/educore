import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getPlatformDashboard } from '../../services/adminService';
import './SuperAdmin.css';

const formatNaira = (n) => `₦${Number(n || 0).toLocaleString()}`;

const ACCENTS = {
  blue: { bg: '#dbeafe', color: '#1e40af' },
  purple: { bg: '#ede9fa', color: '#4338ca' },
  violet: { bg: '#f3e8ff', color: '#6d28d9' },
  yellow: { bg: '#fef9c3', color: '#854d0e' },
  green: { bg: '#ecfdf5', color: '#047857' },
  orange: { bg: '#fff7ed', color: '#c2410c' },
  slate: { bg: '#f1f5f9', color: '#475569' },
  red: { bg: '#fee2e2', color: '#991b1b' },
};

const StatCard = ({ label, value, sub, icon, accent = 'purple', to, variant }) => {
  const card = (
    <div className={`sa-stat-card ${variant || ''}`}>
      <div className="sa-stat-top">
        <div className="sa-stat-icon" style={{ background: ACCENTS[accent].bg, color: ACCENTS[accent].color }}>
          {icon}
        </div>
      </div>
      <p className="sa-stat-label">{label}</p>
      <p className="sa-stat-value">{value ?? '—'}</p>
      {sub && <p className="sa-stat-sub">{sub}</p>}
    </div>
  );
  return to ? (
    <Link to={to} className="sa-stat-card-link">
      {card}
    </Link>
  ) : (
    card
  );
};

const QUICK_ACTIONS = [
  { to: '/admin/schools', icon: '🏫', label: 'All schools' },
  { to: '/admin/users', icon: '👥', label: 'All users' },
  { to: '/admin/blog', icon: '📰', label: 'Blog posts' },
  { to: '/admin/blog/new', icon: '✏️', label: 'New blog post' },
  { to: '/admin/payments', icon: '💳', label: 'All payments' },
  { to: '/register', icon: '➕', label: 'Register school' },
  { to: '/analytics', icon: '📈', label: 'Analytics' },
  { to: '/announcements', icon: '📢', label: 'Announcements' },
];

const SuperAdminOverview = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlatformDashboard()
      .then(setData)
      .catch(() => toast.error('Failed to load platform dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const opsAlerts = useMemo(() => {
    if (!data?.totals) return [];
    const { totals } = data;
    return [
      totals.inactiveSchools > 0 && {
        key: 'inactive',
        label: `${totals.inactiveSchools} suspended school${totals.inactiveSchools === 1 ? '' : 's'}`,
        to: '/admin/schools',
        tone: 'warn',
      },
      totals.trialSchools > 0 && {
        key: 'trial',
        label: `${totals.trialSchools} school${totals.trialSchools === 1 ? '' : 's'} on trial`,
        to: '/admin/schools',
        tone: 'info',
      },
      totals.feeDefaulters > 0 && {
        key: 'defaulters',
        label: `${totals.feeDefaulters} students with outstanding fees`,
        to: '/admin/users',
        tone: 'warn',
      },
    ].filter(Boolean);
  }, [data]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (!data) return null;

  const { totals, finance, usersByRole, schoolsByPlan, recentSchools, recentPayments, recentAnnouncements } = data;

  return (
    <div className="super-admin-page">
      <div className="sa-welcome-row">
        <div>
          <h2>Platform overview</h2>
          <p>
            {totals.schools} school{totals.schools === 1 ? '' : 's'} · {totals.users?.toLocaleString()} users across EduCore
          </p>
        </div>
        <div className="sa-header-actions">
          <Link to="/admin/schools" className="sa-btn-outline">Manage schools</Link>
          <Link to="/admin/users" className="sa-btn-primary">Manage users</Link>
        </div>
      </div>

      <section className="sa-stats-grid">
        <StatCard label="Total schools" value={totals.schools} icon="🏫" accent="blue" to="/admin/schools" />
        <StatCard label="Active" value={totals.activeSchools} icon="✅" accent="green" sub={`${totals.trialSchools ?? 0} on trial`} to="/admin/schools" />
        <StatCard
          label="Suspended"
          value={totals.inactiveSchools}
          icon="⛔"
          accent="red"
          variant={totals.inactiveSchools > 0 ? 'danger' : ''}
          to="/admin/schools"
        />
        <StatCard label="Platform users" value={totals.users?.toLocaleString()} icon="👥" accent="violet" to="/admin/users" />
        <StatCard label="Students" value={totals.students?.toLocaleString()} icon="🎓" accent="yellow" to="/admin/users" />
        <StatCard label="Teachers" value={totals.teachers?.toLocaleString()} icon="👨‍🏫" accent="green" to="/admin/users" />
        <StatCard label="Classes" value={totals.classes?.toLocaleString()} icon="📖" accent="slate" />
        <StatCard
          label="Fee collection"
          value={`${finance?.collectionRate ?? 0}%`}
          sub={formatNaira(finance?.collected)}
          icon="💳"
          accent="purple"
        />
      </section>

      <div className="sa-main-grid">
        <div className="sa-main-col">
          {opsAlerts.length > 0 && (
            <section className="sa-panel">
              <div className="sa-panel-header">
                <h3>Needs attention</h3>
              </div>
              <ul className="sa-ops-list">
                {opsAlerts.map((item) => (
                  <li key={item.key}>
                    <Link to={item.to} className={`sa-ops-item sa-ops-${item.tone}`}>
                      <span>{item.label}</span>
                      <span>→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="sa-panel">
            <div className="sa-panel-header">
              <h3>Platform finance</h3>
              <Link to="/admin/schools">View schools</Link>
            </div>
            <div className="sa-finance-grid">
              <div className="sa-finance-item">
                <span>Total collected</span>
                <strong>{formatNaira(finance?.collected)}</strong>
              </div>
              <div className="sa-finance-item">
                <span>Outstanding</span>
                <strong className="warn">{formatNaira(finance?.outstanding)}</strong>
              </div>
              <div className="sa-finance-item">
                <span>Collection rate</span>
                <strong>{finance?.collectionRate ?? 0}%</strong>
              </div>
            </div>
            <div className="sa-plan-pills">
              {(schoolsByPlan || []).map((p) => (
                <span key={p.plan} className="sa-plan-pill">
                  {p.plan}
                  <strong>{p.count}</strong>
                </span>
              ))}
              {(!schoolsByPlan || schoolsByPlan.length === 0) && (
                <span className="sa-plan-pill">basic <strong>0</strong></span>
              )}
            </div>
          </section>

          <div className="sa-two-col">
            <section className="sa-panel">
              <div className="sa-panel-header">
                <h3>Users by role</h3>
                <Link to="/admin/users">Manage →</Link>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {(usersByRole || []).map((r) => (
                  <li key={r.role} className="sa-list-row" style={{ cursor: 'default' }}>
                    <span style={{ textTransform: 'capitalize' }}>{r.role.replace(/_/g, ' ')}</span>
                    <strong>{r.count}</strong>
                  </li>
                ))}
              </ul>
            </section>

            <section className="sa-panel">
              <div className="sa-panel-header">
                <h3>Platform activity</h3>
              </div>
              <div className="sa-list-row" style={{ cursor: 'default', borderBottom: '1px solid #f1f5f9' }}>
                <span>Exams created</span>
                <strong>{totals.exams ?? 0}</strong>
              </div>
              <div className="sa-list-row" style={{ cursor: 'default', borderBottom: '1px solid #f1f5f9' }}>
                <span>Results recorded</span>
                <strong>{totals.results ?? 0}</strong>
              </div>
              <div className="sa-list-row" style={{ cursor: 'default', borderBottom: '1px solid #f1f5f9' }}>
                <span>Blog posts</span>
                <strong>{totals.blogPosts ?? 0}</strong>
              </div>
              <div className="sa-list-row" style={{ cursor: 'default' }}>
                <span>Fee defaulters</span>
                <strong>{totals.feeDefaulters ?? 0}</strong>
              </div>
            </section>
          </div>

          <div className="sa-two-col">
            <section className="sa-panel">
              <div className="sa-panel-header">
                <h3>Recent payments</h3>
              </div>
              {(recentPayments || []).length === 0 ? (
                <p className="sa-empty">No payment activity yet.</p>
              ) : (
                recentPayments.map((p) => (
                  <div key={p.id} className="sa-list-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <strong>{p.studentName}</strong>
                      <span>{formatNaira(p.amount)}</span>
                    </div>
                    <span className="sa-list-meta">
                      {p.schoolName} · {p.feeTitle || 'Fee'} · {p.status} · {p.time}
                    </span>
                  </div>
                ))
              )}
            </section>

            <section className="sa-panel">
              <div className="sa-panel-header">
                <h3>Recent announcements</h3>
                <Link to="/announcements">View all</Link>
              </div>
              {(recentAnnouncements || []).length === 0 ? (
                <p className="sa-empty">No announcements yet.</p>
              ) : (
                recentAnnouncements.map((a) => (
                  <div key={a.id} className="sa-list-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.2rem' }}>
                    <strong>{a.title}</strong>
                    <span className="sa-list-meta">
                      {a.schoolName} · {a.priority} · {a.time}
                    </span>
                  </div>
                ))
              )}
            </section>
          </div>
        </div>

        <aside className="sa-side-col">
          <section className="sa-panel">
            <div className="sa-panel-header">
              <h3>Quick controls</h3>
            </div>
            <div className="sa-quick-grid">
              {QUICK_ACTIONS.map((action) => (
                <Link key={action.to} to={action.to} className="sa-quick-chip">
                  <span>{action.icon}</span>
                  {action.label}
                </Link>
              ))}
            </div>
          </section>

          <section className="sa-panel">
            <div className="sa-panel-header">
              <h3>Newest schools</h3>
              <Link to="/admin/schools">All →</Link>
            </div>
            {(recentSchools || []).length === 0 ? (
              <p className="sa-empty">No schools registered yet.</p>
            ) : (
              recentSchools.map((s) => (
                <Link key={s._id} to={`/admin/schools/${s._id}`} className="sa-list-row">
                  <div>
                    <strong>{s.name}</strong>
                    <div className="sa-list-meta">
                      {s.studentCount ?? 0} students · {s.teacherCount ?? 0} teachers
                    </div>
                  </div>
                  <span className={`sa-school-badge ${s.status || 'active'}`}>{s.status || 'active'}</span>
                </Link>
              ))
            )}
          </section>
        </aside>
      </div>
    </div>
  );
};

export default SuperAdminOverview;
