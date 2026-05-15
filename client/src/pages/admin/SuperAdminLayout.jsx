import { NavLink, Outlet } from 'react-router-dom';

const tabs = [
  { label: 'Overview', path: '/admin', end: true },
  { label: 'Schools', path: '/admin/schools' },
  { label: 'Users', path: '/admin/users' },
  { label: 'Blog', path: '/admin/blog' },
  { label: 'Payments', path: '/admin/payments' },
];

const SuperAdminLayout = () => (
  <div style={{ padding: '3rem 4rem', maxWidth: 1400, margin: '0 auto' }}>
    <header style={{ marginBottom: '2.5rem' }}>
      <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#5849b8', textTransform: 'uppercase', margin: 0 }}>
        Platform Admin
      </p>
      <h1 style={{ fontSize: '2.8rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0 0.5rem' }}>
        Super Admin Console
      </h1>
      <p style={{ fontSize: '1.05rem', color: '#64748b', margin: 0 }}>
        Manage schools, users, subscriptions, and platform activity.
      </p>
    </header>

    <nav
      style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2.5rem',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '0.25rem',
      }}
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          end={tab.end}
          style={({ isActive }) => ({
            padding: '0.75rem 1.25rem',
            borderRadius: '8px 8px 0 0',
            fontWeight: 700,
            fontSize: '0.95rem',
            textDecoration: 'none',
            color: isActive ? '#5849b8' : '#64748b',
            borderBottom: isActive ? '3px solid #5849b8' : '3px solid transparent',
            marginBottom: -1,
          })}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>

    <Outlet />
  </div>
);

export default SuperAdminLayout;
