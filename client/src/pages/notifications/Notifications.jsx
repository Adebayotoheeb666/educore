import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import './Notifications.css';

const TYPE_ICONS = {
  payment: { icon: '💰', bg: '#ede9fa' },
  academic: { icon: '📊', bg: '#eff6ff' },
  attendance: { icon: '⚠️', bg: '#f3f0ff' },
  announcement: { icon: '📢', bg: '#f8fafc' },
  default: { icon: '🔔', bg: '#f3f0ff' },
};

const Notifications = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get('/api/announcements')
      .then(({ data }) => {
        const raw = Array.isArray(data) ? data : (data.announcements ?? []);
        setNotifications(raw.map(item => {
          const type = item.type ?? item.category ?? 'announcement';
          const { icon, bg } = TYPE_ICONS[type] ?? TYPE_ICONS.default;
          const createdAt = item.createdAt ? new Date(item.createdAt) : null;
          const now = new Date();
          let time = '—';
          if (createdAt) {
            const diffMs = now - createdAt;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHrs = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHrs / 24);
            if (diffMins < 60) time = `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
            else if (diffHrs < 24) time = `${diffHrs} hour${diffHrs !== 1 ? 's' : ''} ago`;
            else if (diffDays === 1) time = 'Yesterday';
            else time = createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
          }
          return {
            id: item._id ?? item.id,
            type,
            title: item.title ?? item.subject ?? '—',
            message: item.message ?? item.body ?? item.content ?? '',
            time,
            unread: !item.readAt,
            icon,
            bg,
          };
        }));
      })
      .catch(() => toast.error('Failed to load notifications'))
      .finally(() => setLoading(false));
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;
  const filteredNotifs = activeTab === 'all' ? notifications : notifications.filter(n => n.unread);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  return (
    <div className="notifications-container">
      <header className="notif-header-row">
        <div className="notif-header-left">
          <h1>Notifications</h1>
          <p>Stay updated with the latest school activities and administrative alerts.</p>
        </div>
        <button className="btn-new-ann" style={{ background: '#0f172a' }} onClick={markAllRead}>
          Mark All as Read
        </button>
      </header>

      <div className="notif-main-grid">
        <div className="notif-list-card">
          <div className="notif-list-header">
            <div
              className={`notif-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Notifications
            </div>
            <div
              className={`notif-tab ${activeTab === 'unread' ? 'active' : ''}`}
              onClick={() => setActiveTab('unread')}
            >
              Unread ({unreadCount})
            </div>
          </div>

          <div className="notif-items-wrapper">
            {loading ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>Loading notifications…</div>
            ) : filteredNotifs.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>No notifications found.</div>
            ) : filteredNotifs.map(notif => (
              <div key={notif.id} className={`notif-item ${notif.unread ? 'unread' : ''}`}>
                <div className="notif-icon-box" style={{ background: notif.bg }}>
                  {notif.icon}
                </div>
                <div className="notif-item-content">
                  <h4>{notif.title}</h4>
                  <p>{notif.message}</p>
                  <div className="notif-meta-row">
                    <span>🕒 {notif.time}</span>
                    <span>•</span>
                    <span style={{ textTransform: 'capitalize' }}>{notif.type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="notif-sidebar">
          <div className="notif-sidebar-card">
            <h3>Notif. Settings</h3>
            <div className="notif-setting-list">
              <div className="notif-setting-item">
                <div className="notif-setting-info">
                  <h5>Email Notifications</h5>
                  <p>Daily summary of activities</p>
                </div>
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" defaultChecked />
                </div>
              </div>
              <div className="notif-setting-item">
                <div className="notif-setting-info">
                  <h5>SMS Alerts</h5>
                  <p>For urgent school notices</p>
                </div>
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" defaultChecked />
                </div>
              </div>
              <div className="notif-setting-item">
                <div className="notif-setting-info">
                  <h5>Payment Alerts</h5>
                  <p>Real-time fee confirmations</p>
                </div>
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" defaultChecked />
                </div>
              </div>
            </div>
            <button className="btn-ai-insights" style={{ marginTop: '2rem', width: '100%' }}>
              Save Preferences
            </button>
          </div>

          <div className="ai-parent-insight-box" style={{ marginTop: '2rem' }}>
            <h3><span>✨</span> Smart Digest</h3>
            <p>AI has summarized recent updates into a single concise report for you. Ready to view?</p>
            <button className="btn-ai-action">View Digest</button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Notifications;
