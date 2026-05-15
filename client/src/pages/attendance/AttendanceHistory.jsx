import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import { getStudentAttendance, getAttendanceSummary } from '../../services/attendanceService';
import './Attendance.css';

const ADMIN_ROLES = ['principal', 'school_owner', 'vp_admin', 'admin_staff', 'class_teacher', 'subject_teacher'];

const STATUS_BADGE = {
  present: { bg: '#ede9fa', color: '#2d2460', label: 'Present' },
  absent:  { bg: '#fee2e2', color: '#991b1b', label: 'Absent' },
  late:    { bg: '#fef9c3', color: '#854d0e', label: 'Late' },
};

const AttendanceHistory = () => {
  const { user } = useSelector((s) => s.auth);
  const isAdmin = ADMIN_ROLES.includes(user?.role);

  const [studentId, setStudentId] = useState(user?.role === 'student' ? user.id : '');
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchHistory = (id) => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getStudentAttendance(id),
      getAttendanceSummary({ student: id }),
    ])
      .then(([recRes, sumRes]) => {
        if (!Array.isArray(recRes.data)) {
          throw new Error('Invalid attendance records response');
        }
        if (!sumRes.data || typeof sumRes.data !== 'object') {
          throw new Error('Invalid attendance summary response');
        }
        setRecords(recRes.data);
        setSummary(sumRes.data);
      })
      .catch((error) => {
        const message = error?.message || 'Failed to load attendance history';
        console.error('Error loading attendance history:', error);
        toast.error(message);
        setRecords([]);
        setSummary(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isAdmin && user?.id) fetchHistory(user.id);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchHistory(studentId);
  };

  return (
    <div className="attendance-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem' }}>
        <div>
          <h1 style={{ fontSize: '3.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.8rem' }}>Attendance History</h1>
          <p style={{ fontSize: '1.6rem', color: '#64748b' }}>
            {isAdmin ? 'View any student\'s attendance record' : 'Your attendance record this session'}
          </p>
        </div>
      </div>

      {isAdmin && (
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1.5rem', marginBottom: '4rem', alignItems: 'flex-end' }}>
          <div className="form-group-premium" style={{ flex: 1, position: 'relative' }}>
            <label>Student ID</label>
            <input
              type="text"
              placeholder="Paste student ID"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary-green" style={{ padding: '1.3rem 3rem', height: 'fit-content' }}>
            Search
          </button>
        </form>
      )}

      {loading && (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" />
        </div>
      )}

      {!loading && summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', marginBottom: '4rem' }}>
          {[
            { label: 'Total Days',  value: summary.totalDays  || 0, icon: '📅', color: 'blue' },
            { label: 'Present',     value: summary.present    || 0, icon: '✅', color: 'green' },
            { label: 'Absent',      value: summary.absent     || 0, icon: '❌', color: 'red' },
            { label: 'Late',        value: summary.late       || 0, icon: '⏰', color: 'amber' },
          ].map((s) => (
            <div key={s.label} className="stat-card-premium">
              <div className="stat-info">
                <h4>{s.label}</h4>
                <p>{s.value}</p>
              </div>
              <div className={`stat-icon-box ${s.color}`}>{s.icon}</div>
            </div>
          ))}
        </div>
      )}

      {!loading && records.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '2rem 2.5rem', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: '1.6rem' }}>
            Attendance Log ({records.length} records)
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th style={{ padding: '1.5rem', fontSize: '1.3rem', fontWeight: 700 }}>Date</th>
                  <th style={{ fontSize: '1.3rem', fontWeight: 700 }}>Class</th>
                  <th style={{ fontSize: '1.3rem', fontWeight: 700 }}>Term</th>
                  <th style={{ fontSize: '1.3rem', fontWeight: 700 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => {
                  const badge = STATUS_BADGE[r.status] || STATUS_BADGE.present;
                  return (
                    <tr key={r._id || i}>
                      <td style={{ padding: '1.5rem', fontSize: '1.4rem' }}>
                        {r.date ? new Date(r.date).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{ fontSize: '1.4rem' }}>{r.class?.name || '—'}</td>
                      <td style={{ fontSize: '1.4rem' }}>{r.term || '—'}</td>
                      <td>
                        <span style={{
                          padding: '0.4rem 1.2rem',
                          borderRadius: 20,
                          fontSize: '1.2rem',
                          fontWeight: 700,
                          background: badge.bg,
                          color: badge.color,
                        }}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && records.length === 0 && (studentId || !isAdmin) && (
        <div style={{ textAlign: 'center', padding: '6rem 2rem' }}>
          <span style={{ fontSize: '4rem' }}>📋</span>
          <p style={{ fontSize: '1.6rem', color: '#64748b', marginTop: '1.5rem' }}>No attendance records found.</p>
        </div>
      )}
    </div>
  );
};

export default AttendanceHistory;
