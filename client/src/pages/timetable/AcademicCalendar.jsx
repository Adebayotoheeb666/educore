import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import axios from 'axios';
import './Timetable.css';

const EVENT_TYPES = ['holiday', 'exam', 'activity', 'meeting', 'other'];
const EVENT_COLORS = {
  holiday:  { bg: '#fef9c3', color: '#854d0e', border: '#fde68a' },
  exam:     { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
  activity: { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
  meeting:  { bg: '#f3e8ff', color: '#6d28d9', border: '#c4b5fd' },
  other:    { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
};
const CAN_CREATE = ['principal', 'vp_admin', 'school_owner'];

const AcademicCalendar = () => {
  const { user } = useSelector((s) => s.auth);
  const canCreate = CAN_CREATE.includes(user?.role);

  const [calendar, setCalendar] = useState(null);
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', type: 'activity', description: '' });

  const fetchCalendar = () => {
    axios.get('/api/calendar')
      .then(({ data }) => {
        if (Array.isArray(data)) {
          setEvents(data);
        } else {
          setCalendar(data);
          setEvents(data?.events || data?.terms?.flatMap((t) => t.events || []) || []);
        }
      })
      .catch(() => toast.error('Failed to load academic calendar'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCalendar(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date) { toast.error('Title and date are required'); return; }
    setSubmitting(true);
    try {
      await axios.post('/api/calendar', form);
      toast.success('Event added to calendar');
      setForm({ title: '', date: '', type: 'activity', description: '' });
      setShowForm(false);
      fetchCalendar();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  const upcoming = [...events]
    .filter((e) => e.date && new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const past = [...events]
    .filter((e) => e.date && new Date(e.date) < new Date())
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (loading) return (
    <div className="timetable-container d-flex justify-content-center align-items-center">
      <div className="spinner-border text-primary" />
    </div>
  );

  return (
    <div className="timetable-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem' }}>
        <div>
          <h1 style={{ fontSize: '3.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.8rem' }}>Academic Calendar</h1>
          <p style={{ fontSize: '1.6rem', color: '#64748b' }}>
            {calendar?.session ? `Session: ${calendar.session}` : 'School events, holidays, and term dates'}
          </p>
        </div>
        {canCreate && (
          <button
            className="btn-primary-green"
            style={{ padding: '1.2rem 3rem' }}
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? '✕ Cancel' : '➕ Add Event'}
          </button>
        )}
      </div>

      {showForm && canCreate && (
        <div style={{ background: '#fff', borderRadius: 16, padding: '3rem', border: '1px solid #e2e8f0', marginBottom: '3rem' }}>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '2.5rem' }}>New Calendar Event</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <div className="form-group-premium" style={{ position: 'relative' }}>
                <label>Title</label>
                <input type="text" placeholder="e.g. Mid-Term Break" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-group-premium" style={{ position: 'relative' }}>
                <label>Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="form-group-premium" style={{ position: 'relative' }}>
                <label>Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {EVENT_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group-premium" style={{ position: 'relative', marginBottom: '2.5rem' }}>
              <label>Description (optional)</label>
              <input type="text" placeholder="Brief description of the event" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <button
              type="submit"
              className="btn-primary-green"
              style={{ padding: '1.3rem 3.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}
              disabled={submitting}
            >
              {submitting ? <><div className="spinner-border spinner-border-sm" /> Saving...</> : 'Save Event'}
            </button>
          </form>
        </div>
      )}

      {calendar?.terms && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginBottom: '4rem' }}>
          {calendar.terms.map((term) => (
            <div key={term.term} style={{ background: '#fff', borderRadius: 16, padding: '2.5rem', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>{term.name || `Term ${term.term}`}</h4>
              <p style={{ fontSize: '1.3rem', color: '#64748b', margin: 0 }}>
                {term.startDate ? new Date(term.startDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : '—'}
                {' → '}
                {term.endDate ? new Date(term.endDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
              </p>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
        <div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '2rem' }}>Upcoming Events ({upcoming.length})</h3>
          {upcoming.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: 12, color: '#94a3b8', fontSize: '1.5rem' }}>
              No upcoming events
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {upcoming.map((ev, i) => {
                const s = EVENT_COLORS[ev.type] || EVENT_COLORS.other;
                return (
                  <div key={ev._id || i} style={{ background: '#fff', borderRadius: 12, padding: '2rem', border: `1px solid ${s.border}`, borderLeft: `4px solid ${s.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>{ev.title}</p>
                        {ev.description && <p style={{ fontSize: '1.3rem', color: '#64748b', margin: 0 }}>{ev.description}</p>}
                      </div>
                      <span style={{ padding: '0.3rem 1rem', borderRadius: 20, fontSize: '1.2rem', fontWeight: 700, background: s.bg, color: s.color, whiteSpace: 'nowrap', marginLeft: '1rem' }}>
                        {ev.type}
                      </span>
                    </div>
                    <p style={{ fontSize: '1.3rem', color: '#94a3b8', marginTop: '1rem', marginBottom: 0 }}>
                      📅 {new Date(ev.date).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '2rem' }}>Past Events ({past.length})</h3>
          {past.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: 12, color: '#94a3b8', fontSize: '1.5rem' }}>
              No past events
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {past.slice(0, 10).map((ev, i) => {
                const s = EVENT_COLORS[ev.type] || EVENT_COLORS.other;
                return (
                  <div key={ev._id || i} style={{ background: '#f8fafc', borderRadius: 12, padding: '2rem', border: '1px solid #e2e8f0', opacity: 0.75 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#64748b', margin: 0 }}>{ev.title}</p>
                      <span style={{ padding: '0.3rem 1rem', borderRadius: 20, fontSize: '1.2rem', fontWeight: 700, background: s.bg, color: s.color }}>
                        {ev.type}
                      </span>
                    </div>
                    <p style={{ fontSize: '1.3rem', color: '#94a3b8', marginTop: '0.8rem', marginBottom: 0 }}>
                      {new Date(ev.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AcademicCalendar;
