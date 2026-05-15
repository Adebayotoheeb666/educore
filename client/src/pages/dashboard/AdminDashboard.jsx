import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSchoolDashboard } from '../../services/analyticsService';
import { getSchool } from '../../services/schoolService';
import './Dashboard.css';

const formatNaira = (n) => `₦${Number(n || 0).toLocaleString()}`;

const StatCard = ({ label, value, sub, trend, icon, isDanger, isSuccess, to }) => {
  const inner = (
    <div className={`stat-card-premium ${isDanger ? 'danger' : ''} ${isSuccess ? 'success' : ''} ${to ? 'stat-card-link' : ''}`}>
      <div className="stat-card-header">
        <div className="stat-card-icon-wrap">{icon}</div>
        {trend != null && trend !== '' && (
          <div className={`stat-trend ${isDanger ? 'danger' : ''}`}>{trend}</div>
        )}
      </div>
      <div className="stat-card-body">
        <h5>{label}</h5>
        <h2>{value ?? '—'}</h2>
        {sub && <p className="stat-card-sub">{sub}</p>}
      </div>
    </div>
  );
  return to ? <Link to={to} className="stat-card-anchor">{inner}</Link> : inner;
};

const QUICK_ACTIONS = [
  { to: '/students/add', icon: '➕', label: 'Add Student' },
  { to: '/teachers/add', icon: '👩‍🏫', label: 'Add Teacher' },
  { to: '/attendance', icon: '✅', label: 'Attendance' },
  { to: '/exams/create', icon: '📝', label: 'Create Exam' },
  { to: '/fees/collection', icon: '💰', label: 'Record Payment' },
  { to: '/announcements/create', icon: '📢', label: 'Announcement' },
  { to: '/lesson-plans', icon: '📋', label: 'Lesson Plans' },
  { to: '/timetable', icon: '🗓️', label: 'Timetable' },
  { to: '/classes', icon: '🏫', label: 'Classes' },
  { to: '/analytics', icon: '📈', label: 'Analytics' },
  { to: '/broadsheet', icon: '📄', label: 'Broadsheet' },
  { to: '/library', icon: '📖', label: 'Library' },
];

const AdminDashboard = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getSchoolDashboard().then(({ data }) => setStats(data)),
      getSchool().then(({ data }) => setSchool(data)),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const displayName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Admin';
  const curriculumProgress = stats?.curriculumProgress ?? 0;
  const alerts = stats?.recentAnnouncements ?? [];
  const termLabel = school?.settings?.currentTerm
    ? `${school.settings.currentTerm[0].toUpperCase()}${school.settings.currentTerm.slice(1)} Term`
    : null;
  const sessionLabel = school?.settings?.academicSession || null;

  const opsAlerts = [
    stats?.feeDefaulters > 0 && {
      key: 'fees',
      label: `${stats.feeDefaulters} fee defaulter${stats.feeDefaulters === 1 ? '' : 's'}`,
      to: '/fees/defaulters',
      tone: 'warn',
    },
    stats?.pendingLessonPlans > 0 && {
      key: 'plans',
      label: `${stats.pendingLessonPlans} lesson plan${stats.pendingLessonPlans === 1 ? '' : 's'} awaiting approval`,
      to: '/lesson-plans',
      tone: 'info',
    },
    stats?.overdueLibrary > 0 && {
      key: 'library',
      label: `${stats.overdueLibrary} overdue library book${stats.overdueLibrary === 1 ? '' : 's'}`,
      to: '/library/overdue',
      tone: 'warn',
    },
    stats?.upcomingExams > 0 && {
      key: 'exams',
      label: `${stats.upcomingExams} exam${stats.upcomingExams === 1 ? '' : 's'} in the next 30 days`,
      to: '/exams',
      tone: 'info',
    },
  ].filter(Boolean);

  return (
    <div className="admin-dashboard-content">
      <section className="welcome-section admin-welcome-row">
        <div>
          <h1>Welcome back, {displayName}</h1>
          <p>
            {school?.name ? `${school.name}` : 'School dashboard'}
            {termLabel && sessionLabel ? ` · ${termLabel}, ${sessionLabel}` : ''}
          </p>
        </div>
        <div className="welcome-actions">
          <Link to="/announcements/create" className="btn-dashboard-outline">New announcement</Link>
          <Link to="/analytics" className="btn-dashboard-primary">View analytics</Link>
        </div>
      </section>

      {loading ? (
        <div className="dashboard-loading">
          <div className="spinner-border text-primary" role="status" />
          <span>Loading dashboard…</span>
        </div>
      ) : (
        <>
          <section className="stats-grid-dashboard stats-grid-dashboard-8">
            <StatCard label="Students" value={stats?.totalStudents} icon="👥" to="/students" />
            <StatCard label="Teachers" value={stats?.totalTeachers} icon="🎓" to="/teachers" />
            <StatCard label="Parents" value={stats?.totalParents} icon="👪" />
            <StatCard label="Classes" value={stats?.totalClasses} icon="🏫" to="/classes" />
            <StatCard
              label="Attendance"
              value={stats?.avgAttendance != null ? `${stats.avgAttendance}%` : '—'}
              sub="School average"
              icon="✅"
              isSuccess={stats?.avgAttendance >= 75}
              to="/attendance"
            />
            <StatCard
              label="Fee collection"
              value={stats?.collectionRate != null ? `${stats.collectionRate}%` : '—'}
              sub={formatNaira(stats?.feeCollected)}
              icon="💳"
              to="/fees/collection"
            />
            <StatCard
              label="Fee defaulters"
              value={stats?.feeDefaulters}
              icon="💸"
              isDanger={stats?.feeDefaulters > 0}
              to="/fees/defaulters"
            />
            <StatCard label="Subjects" value={stats?.totalSubjects} icon="📚" to="/subjects" />
          </section>

          <div className="dashboard-content-grid">
            <div className="main-column">
              {opsAlerts.length > 0 && (
                <div className="ops-alerts-card">
                  <h3>Needs attention</h3>
                  <ul className="ops-alerts-list">
                    {opsAlerts.map((item) => (
                      <li key={item.key}>
                        <Link to={item.to} className={`ops-alert-item ops-alert-${item.tone}`}>
                          <span>{item.label}</span>
                          <span className="ops-alert-arrow">→</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="dashboard-panels-row">
                <div className="finance-snapshot-card">
                  <div className="panel-card-header">
                    <h2>Finance snapshot</h2>
                    <Link to="/fees/collection">Manage fees</Link>
                  </div>
                  <div className="finance-metrics">
                    <div className="finance-metric">
                      <span>Collected</span>
                      <strong>{formatNaira(stats?.feeCollected)}</strong>
                    </div>
                    <div className="finance-metric">
                      <span>Outstanding</span>
                      <strong className="text-warn">{formatNaira(stats?.feePending)}</strong>
                    </div>
                    <div className="finance-metric">
                      <span>Collection rate</span>
                      <strong>{stats?.collectionRate ?? 0}%</strong>
                    </div>
                    <div className="finance-metric">
                      <span>Staff (admin)</span>
                      <strong>{stats?.staffCount ?? '—'}</strong>
                    </div>
                  </div>
                  <div className="recent-payments-block">
                    <h4>Recent payments</h4>
                    {stats?.recentPayments?.length ? (
                      <ul className="recent-payments-list">
                        {stats.recentPayments.map((p) => (
                          <li key={p.id}>
                            <span>{p.studentName}</span>
                            <span className="recent-pay-meta">
                              {formatNaira(p.amount)}
                              <em>{p.time}</em>
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="panel-empty">No payments recorded yet.</p>
                    )}
                  </div>
                </div>

                <div className="academic-overview-card academic-overview-compact">
                  <div className="academic-header">
                    <div className="academic-title">
                      <h2>Academic pulse</h2>
                      <p>Performance & curriculum readiness</p>
                    </div>
                  </div>
                  <div className="academic-mini-stats">
                    <div className="academic-mini-stat">
                      <span>Lesson plans approved</span>
                      <strong>{curriculumProgress}%</strong>
                    </div>
                    <div className="academic-mini-stat">
                      <span>Pending approvals</span>
                      <strong>{stats?.pendingLessonPlans ?? 0}</strong>
                    </div>
                    <div className="academic-mini-stat">
                      <span>Upcoming exams</span>
                      <strong>{stats?.upcomingExams ?? 0}</strong>
                    </div>
                  </div>
                  <div className="prog-item">
                    <div className="prog-header">
                      <span>Curriculum coverage</span>
                      <span className="prog-percent">{curriculumProgress}%</span>
                    </div>
                    <div className="prog-bar-bg">
                      <div className="prog-bar-fill" style={{ width: `${curriculumProgress}%` }} />
                    </div>
                  </div>
                  {stats?.classPerformance?.length > 0 ? (
                    <ul className="class-performance-list">
                      {stats.classPerformance.slice(0, 5).map((c) => (
                        <li key={c.className}>
                          <span>{c.className}</span>
                          <strong>{c.average}%</strong>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="panel-empty">No class performance data yet.</p>
                  )}
                  <Link to="/results" className="panel-footer-link">View all results →</Link>
                </div>
              </div>

              <div className="ai-features-card">
                <div className="ai-card-title">
                  <span>✨</span> AI tools
                </div>
                <div className="ai-features-grid">
                  <Link to="/lesson-plans/generate" className="ai-feature-item">
                    <div className="ai-feature-icon">📝</div>
                    <div className="ai-feature-text">
                      <h4>Generate lesson plan</h4>
                      <p>Curriculum-aligned plans in seconds.</p>
                    </div>
                  </Link>
                  <Link to="/exams/question-bank" className="ai-feature-item">
                    <div className="ai-feature-icon">❓</div>
                    <div className="ai-feature-text">
                      <h4>AI question bank</h4>
                      <p>Exam questions by class and difficulty.</p>
                    </div>
                  </Link>
                  <Link to="/timetable/generate" className="ai-feature-item">
                    <div className="ai-feature-icon">🗓️</div>
                    <div className="ai-feature-text">
                      <h4>Generate timetable</h4>
                      <p>Auto-build schedules from constraints.</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            <aside className="side-column">
              <div className="widget-card dark quick-actions-widget">
                <h3 className="widget-title">Quick controls</h3>
                <div className="quick-actions-grid">
                  {QUICK_ACTIONS.map((action) => (
                    <Link key={action.to} to={action.to} className="quick-action-chip">
                      <span>{action.icon}</span>
                      {action.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="widget-card">
                <h3 className="widget-title">Recent announcements</h3>
                <div className="alert-list">
                  {alerts.length === 0 ? (
                    <p className="panel-empty">No announcements yet.</p>
                  ) : (
                    alerts.map((a) => (
                      <div key={a.id} className="alert-item">
                        <div className={`alert-dot ${a.priority === 'urgent' ? '' : a.priority === 'high' ? 'orange' : 'green'}`} />
                        <div className="alert-text">
                          <h5>{a.title}</h5>
                          <p>{(a.body || '').slice(0, 100)}{(a.body?.length > 100 ? '…' : '')}</p>
                          <span className="alert-status">{a.time}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Link to="/announcements" className="view-all-alerts">View all announcements</Link>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
