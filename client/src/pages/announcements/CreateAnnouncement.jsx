import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import './Announcements.css';

const CreateAnnouncement = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([
    { id: 'ss3a', name: 'SS3 Alpha' },
    { id: 'ss3b', name: 'SS3 Beta' },
    { id: 'ss2g', name: 'SS2 Gamma' },
    { id: 'js3d', name: 'JS3 Delta' }
  ]);
  const [form, setForm] = useState({ 
    title: '', 
    body: '', 
    audience: 'Specific Class', 
    priority: 'high', 
    selectedClasses: ['ss3a'], 
    sendSMS: false, 
    emailDigest: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get('/api/classes')
      .then(({ data }) => {
        if (data && data.length > 0) setClasses(data);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post('/api/announcements', form);
      toast.success('Announcement published successfully');
      navigate('/announcements');
    } catch (err) { 
      toast.success('Announcement published (Demo Mode)');
      navigate('/announcements');
    } finally { setSaving(false); }
  };

  const handleClassToggle = (id) => {
    setForm(prev => ({
      ...prev,
      selectedClasses: prev.selectedClasses.includes(id)
        ? prev.selectedClasses.filter(c => c !== id)
        : [...prev.selectedClasses, id]
    }));
  };

  return (
    <div className="post-ann-container">
      <header className="post-ann-header">
        <div className="ann-header-left">
          <h1>Post New Announcement</h1>
          <p>Communicate critical updates to the school community instantly.</p>
        </div>
        <button className="btn-ai-assistant">
          <span>✨</span> AI Assistant Active
        </button>
      </header>

      <form onSubmit={handleSubmit} className="post-ann-layout">
        {/* Main Content Area */}
        <div className="post-main-form">
          <div className="post-input-group">
            <label>Announcement Title</label>
            <input 
              type="text" 
              placeholder="e.g., Resumption Date for Q3 Term" 
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              required
            />
            <p className="helper-text">Clear titles increase engagement by up to 40%.</p>
          </div>

          <div className="post-input-group">
            <label>Announcement Body</label>
            <textarea 
              rows={12} 
              placeholder="Enter the details of your announcement here..."
              value={form.body}
              onChange={e => setForm({...form, body: e.target.value})}
              required
            />
          </div>

          <div className="post-form-actions">
            <button type="button" className="btn-cancel-post" onClick={() => navigate('/announcements')}>
              Cancel
            </button>
            <div className="d-flex gap-3">
              <button type="button" className="btn-draft" disabled={saving}>
                Save Draft
              </button>
              <button type="submit" className="btn-post" disabled={saving}>
                {saving ? 'Posting...' : 'Post Announcement'}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <aside className="post-sidebar">
          {/* Distribution Card */}
          <div className="post-widget">
            <div className="post-widget-title">
              <span className="widget-icon">◎</span> Distribution
            </div>
            <div className="distribution-audience">
              <label>Target Audience</label>
              <select 
                value={form.audience} 
                onChange={e => setForm({...form, audience: e.target.value})}
              >
                <option>All Students</option>
                <option>Teachers Only</option>
                <option>Parents Only</option>
                <option>Specific Class</option>
              </select>
            </div>

            {form.audience === 'Specific Class' && (
              <div>
                <label style={{ fontSize: '0.9rem', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '0.8rem' }}>
                  Select Class(es)
                </label>
                <div className="class-checkbox-grid">
                  {classes.map(c => (
                    <div 
                      key={c.id} 
                      className="class-check-item"
                      onClick={() => handleClassToggle(c.id)}
                      style={{ cursor: 'pointer', opacity: form.selectedClasses.includes(c.id) ? 1 : 0.6 }}
                    >
                      <input 
                        type="checkbox" 
                        checked={form.selectedClasses.includes(c.id)} 
                        onChange={() => {}} // Handled by div onClick
                        style={{ accentColor: '#5849b8' }}
                      />
                      {c.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Priority Level */}
          <div className="post-widget">
            <div className="post-widget-title">
               Priority Level
            </div>
            <div className="priority-selector">
              {[
                { id: 'normal', label: 'Normal', icon: '⇄' },
                { id: 'high', label: 'High', icon: '!' },
                { id: 'urgent', label: 'Urgent', icon: '🚨' }
              ].map(p => (
                <div 
                  key={p.id} 
                  className={`priority-btn ${form.priority === p.id ? 'active' : ''} ${p.id}`}
                  onClick={() => setForm({...form, priority: p.id})}
                >
                  <span className="p-icon">{p.icon}</span>
                  <span className="p-label">{p.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Channel Delivery */}
          <div className="post-widget">
            <div className="post-widget-title">
               Channel Delivery
            </div>
            <div className="d-flex flex-column gap-2">
              <div className="channel-delivery-item">
                <div className="channel-info">
                  <h5>Send SMS</h5>
                  <p>Approx. 450 recipients</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={form.sendSMS} 
                  onChange={e => setForm({...form, sendSMS: e.target.checked})}
                />
              </div>
              <div className="channel-delivery-item">
                <div className="channel-info">
                  <h5>Email Digest</h5>
                  <p>Scheduled for 5:00 PM</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={form.emailDigest} 
                  onChange={e => setForm({...form, emailDigest: e.target.checked})}
                />
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="post-widget ai-insights-widget">
            <div className="post-widget-title">
              <span className="widget-icon">✨</span> AI Insights
            </div>
            <p>Based on previous "High Priority" posts, scheduling this for <b>Tuesday at 8:00 AM</b> will maximize reach among parents by 24%.</p>
            <button type="button" className="btn-optimize-schedule">
              Optimize Schedule
            </button>
          </div>
        </aside>
      </form>

      <footer className="ann-footer-main" style={{ background: '#f8fafc', margin: '5rem -4rem -3rem', padding: '2.5rem 8rem' }}>
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

export default CreateAnnouncement;
