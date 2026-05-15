import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Announcements.css';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All Updates');
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get('/api/announcements')
      .then(({ data }) => setAnnouncements(data || []))
      .catch((err) => {
          console.error("Failed to fetch announcements:", err);
          setAnnouncements([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredAnnouncements = announcements.filter(a => {
    const matchesFilter = filter === 'All Updates' || 
                         (filter === 'High Priority' && (a.priority === 'high' || a.priority === 'urgent')) ||
                         (filter === 'Recent' && new Date(a.createdAt) > new Date('2024-10-22')) ||
                         (filter === 'Drafts' && false); // Drafts logic not implemented in mock
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) || 
                         a.body.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) return <div className="announcements-container d-flex justify-content-center align-items-center"><div className="spinner-border text-success" /></div>;

  return (
    <div className="announcements-container">
      <header className="ann-page-header">
        <div className="ann-header-left">
          <h1>School Announcements</h1>
          <p>Keep the school community informed with official updates and urgent alerts.</p>
        </div>
        <Link to="/announcements/create" className="btn-new-ann">
          <div className="new-ann-icon">＋</div>
          New Announcement
        </Link>
      </header>

      <div className="ann-controls">
        <div className="ann-filters">
          {['All Updates', 'High Priority', 'Recent', 'Drafts'].map(f => (
            <button 
              key={f} 
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="ann-search-wrapper">
          <span className="search-icon-fixed">🔍</span>
          <input 
            type="text" 
            placeholder="Search announcements..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="ann-grid-premium">
        {/* Featured Announcement (First Item) */}
        {filteredAnnouncements.length > 0 && (
          <div className={`featured-ann-card ${filteredAnnouncements[0].priority}`}>
            <div className="card-label-row">
              <span className={`audience-tag ${filteredAnnouncements[0].audience}`}>
                {filteredAnnouncements[0].audience === 'all' ? 'All Audience' : filteredAnnouncements[0].audience}
              </span>
              <span className={`priority-tag ${filteredAnnouncements[0].priority}`}>
                {filteredAnnouncements[0].priority === 'urgent' && '⚠️ '}
                {filteredAnnouncements[0].priority}
              </span>
            </div>
            <h2 className="ann-card-title">{filteredAnnouncements[0].title}</h2>
            <p className="ann-card-body">{filteredAnnouncements[0].body}</p>
            <div className="ann-card-footer">
              <div className="author-info">
                <div className="author-avatar">
                   <img src={`https://ui-avatars.com/api/?name=${filteredAnnouncements[0].createdBy?.name}&background=random`} alt="Author" />
                </div>
                <div className="author-meta">
                  <h5>{filteredAnnouncements[0].createdBy?.name}</h5>
                  <p>{filteredAnnouncements[0].createdBy?.role} • {new Date(filteredAnnouncements[0].createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
              <Link to={`/announcements/${filteredAnnouncements[0]._id}`} className="read-notice-link">
                Read Full Notice <span>→</span>
              </Link>
            </div>
          </div>
        )}

        {/* Subsequent Announcements */}
        {filteredAnnouncements.slice(1).map((a, index) => (
          <div key={a._id} className="small-ann-card">
            <div>
              <div className="card-label-row">
                <span className={`audience-tag ${a.audience}`}>{a.audience}</span>
                <span className={`priority-tag ${a.priority}`}>{a.priority}</span>
              </div>
              <h3 className="ann-card-title">{a.title}</h3>
              <p className="ann-card-body">{a.body}</p>
            </div>
            <div className="ann-card-footer">
              <div className="author-info">
                <div className="author-avatar">
                   <img src={`https://ui-avatars.com/api/?name=${a.createdBy?.name}&background=random`} alt="Author" />
                </div>
                <div className="author-meta">
                  <h5>{a.createdBy?.name}</h5>
                  <p>{a.createdBy?.role} • {new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Empty Slot Card */}
        <div className="upcoming-slot-card">
          <div className="slot-icon">✍️</div>
          <h4>Upcoming Slot</h4>
          <p>No draft announcements currently pending review.</p>
        </div>
      </div>

      <footer className="ann-footer-main">
        <div className="footer-left-content">
          <span className="footer-brand">EduCore AI</span> • © {new Date().getFullYear()} EduCore AI. Empowering Nigerian Education.
        </div>
        <div className="footer-links">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/support">Support Center</Link>
          <Link to="/contact">Contact Us</Link>
        </div>
      </footer>
    </div>
  );
};

export default Announcements;
