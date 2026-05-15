import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getExams } from '../../services/examService';
import '../portal/Portal.css';

const STATUS_STYLES = {
  scheduled: { background: '#dbeafe', color: '#1e40af', label: 'Scheduled' },
  ongoing:   { background: '#fef9c3', color: '#854d0e', label: 'Ongoing' },
  completed: { background: '#ede9fa', color: '#2d2460', label: 'Completed' },
  cancelled: { background: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
};

const StudentExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');

  useEffect(() => {
    getExams({ student: 'me' })
      .then(({ data }) => setExams(data || []))
      .catch(() => toast.error('Failed to load exams'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="portal-container d-flex justify-content-center align-items-center">
      <div className="spinner-border text-primary" />
    </div>
  );

  const now = new Date();
  const upcoming = exams.filter((e) => e.status === 'scheduled' || new Date(e.scheduledDate) >= now);
  const past     = exams.filter((e) => e.status === 'completed' || new Date(e.scheduledDate) < now);
  const shown    = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="portal-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '3.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>My Exams</h1>
          <p style={{ fontSize: '1.5rem', color: '#64748b' }}>View scheduled and completed examinations</p>
        </div>
        <Link to="/student/results" className="btn-secondary-outline" style={{ padding: '1.2rem 2.5rem' }}>
          View Results
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem' }}>
        {['upcoming', 'past'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '0.9rem 2.5rem',
              borderRadius: 8,
              border: 'none',
              fontWeight: 700,
              fontSize: '1.4rem',
              cursor: 'pointer',
              background: tab === t ? '#0f172a' : '#f1f5f9',
              color: tab === t ? '#fff' : '#64748b',
            }}
          >
            {t === 'upcoming' ? `Upcoming (${upcoming.length})` : `Past (${past.length})`}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '6rem 2rem' }}>
          <span style={{ fontSize: '4rem' }}>📝</span>
          <p style={{ fontSize: '1.6rem', color: '#64748b', marginTop: '1.5rem' }}>
            No {tab} exams found.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2.5rem' }}>
          {shown.map((exam) => {
            const style = STATUS_STYLES[exam.status] || STATUS_STYLES.scheduled;
            return (
              <div key={exam._id} style={{
                background: '#fff',
                borderRadius: 16,
                padding: '2.5rem',
                boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                border: '1px solid #e2e8f0',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '2.8rem' }}>📋</span>
                  <span style={{
                    padding: '0.4rem 1.2rem',
                    borderRadius: 20,
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    background: style.background,
                    color: style.color,
                  }}>
                    {style.label}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                  {exam.subject?.name || exam.subject || 'Exam'}
                </h3>
                <p style={{ fontSize: '1.3rem', color: '#64748b', marginBottom: '2rem' }}>
                  {exam.type || 'Written'} · {exam.totalMarks} marks · {exam.duration} mins
                </p>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '1.3rem', color: '#475569' }}>
                  <span>📅 {exam.scheduledDate ? new Date(exam.scheduledDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                  {exam.status === 'completed' && exam.myScore != null && (
                    <span style={{ fontWeight: 700, color: exam.myScore >= 50 ? '#6A5ACD' : '#dc2626' }}>
                      Score: {exam.myScore}/{exam.totalMarks}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentExams;
