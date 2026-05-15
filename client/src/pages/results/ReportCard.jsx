import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getReportCard } from '../../services/resultService';
import { getAttendanceSummary } from '../../services/attendanceService';
import './Results.css';

const TERMS = ['First Term', 'Second Term', 'Third Term'];

const gradeFromPercent = (pct) => {
  if (pct >= 75) return 'A1';
  if (pct >= 70) return 'B2';
  if (pct >= 65) return 'B3';
  if (pct >= 60) return 'C4';
  if (pct >= 55) return 'C5';
  if (pct >= 50) return 'C6';
  if (pct >= 45) return 'D7';
  if (pct >= 40) return 'E8';
  return 'F9';
};

const ReportCard = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [activeTerm, setActiveTerm] = useState('First Term');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getReportCard(id, { term: activeTerm }),
      getAttendanceSummary({ student: id }),
    ])
      .then(([resultRes, attRes]) => {
        setResult(resultRes.data);
        setAttendance(attRes.data);
      })
      .catch(() => {
        setResult(null);
        toast.error('Failed to load report card');
      })
      .finally(() => setLoading(false));
  }, [id, activeTerm]);

  if (loading) {
    return (
      <div className="report-card-container d-flex justify-content-center align-items-center">
        <div className="spinner-border text-success" />
      </div>
    );
  }

  const studentName =
    result?.student?.name ||
    `${result?.student?.firstName || ''} ${result?.student?.lastName || ''}`.trim() ||
    'Student';
  const className = result?.class?.name
    ? `${result.class.name}${result.class.arm ? ` ${result.class.arm}` : ''}`.trim()
    : '—';
  const overallPct = result?.overallPercentage ?? (
    result?.subjects?.length
      ? Math.round(
          result.subjects.reduce((acc, s) => acc + (s.totalScore || 0), 0) / result.subjects.length
        )
      : null
  );
  const overallGrade = overallPct != null ? gradeFromPercent(overallPct) : '—';
  const performance = (result?.subjects || []).map(s => ({
    subject: s.subject?.name ?? 'Subject',
    ca: s.caScore ?? 0,
    exam: s.examScore ?? 0,
    total: s.totalScore ?? 0,
    grade: s.grade ?? '—',
    remark: s.remark ?? '',
  }));
  const attRate = attendance?.attendanceRate != null ? Number(attendance.attendanceRate) : null;

  return (
    <div className="report-card-container">
      <header className="ann-page-header" style={{ marginBottom: '1.5rem' }}>
        <div className="ann-header-left">
          <p style={{ color: '#64748b', fontWeight: 700, margin: 0, fontSize: '0.9rem' }}>Students / Academic Results</p>
          <h1 style={{ fontSize: '2.4rem' }}>{studentName} ({className})</h1>
          <p style={{ fontSize: '1rem', color: '#0f172a' }}>
            📅 {result?.session || '—'} • {result?.term || activeTerm}
          </p>
        </div>
        <div className="ann-header-right">
          <button type="button" className="btn-catalog-action" style={{ background: 'white', border: '1px solid #e2e8f0', padding: '0.8rem 1.5rem' }}>
            📥 Export PDF
          </button>
          <button type="button" className="btn-new-ann" style={{ background: '#5849b8' }}>
            🖨 Print Result
          </button>
        </div>
      </header>

      <div className="ann-filters" style={{ marginBottom: '3rem' }}>
        {TERMS.map(t => (
          <button
            key={t}
            type="button"
            className={`filter-tab ${activeTerm === t ? 'active' : ''}`}
            onClick={() => setActiveTerm(t)}
          >
            {t}{t === 'Third Term' ? ' (Current)' : ''}
          </button>
        ))}
      </div>

      {!result ? (
        <p style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>
          No result record for {activeTerm}. Compute or release results first.
        </p>
      ) : (
        <div className="report-card-main-grid">
          <aside className="student-result-sidebar">
            <div className="result-stat-box-premium">
              <span className="result-stat-label">OVERALL PERFORMANCE</span>
              <h2 className="result-stat-val">{overallPct != null ? `${overallPct}%` : '—'}</h2>
              <div className="d-flex justify-content-center gap-3">
                {overallPct != null && overallPct >= 70 && (
                  <span className="result-stat-badge excellence">Excellence</span>
                )}
                {result?.positionInClass && (
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>
                    Position {result.positionInClass} in class
                  </span>
                )}
              </div>
              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', padding: '0 1rem' }}>
                <div className="text-start">
                  <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>Class Position</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>{result?.positionInClass ?? '—'}</span>
                </div>
                <div className="text-end">
                  <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>Grade</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#5849b8' }}>{overallGrade}</span>
                </div>
              </div>
              <div style={{ position: 'absolute', top: 20, right: 20, opacity: 0.1, fontSize: '4rem' }}>🏆</div>
            </div>

            <div className="attendance-bar-chart-card">
              <div className="attendance-chart-header">
                <h3>TERM ATTENDANCE</h3>
              </div>
              <div className="attendance-bars-row" style={{ alignItems: 'flex-end', minHeight: 120 }}>
                <div
                  className="att-bar"
                  style={{ height: `${Math.min(100, attRate ?? 0)}%`, background: '#5849b8', flex: 1 }}
                />
              </div>
              <div className="att-stats-footer">
                <span>{attRate != null ? `${attRate}% Attendance` : 'No attendance data'}</span>
                <span style={{ color: '#64748b' }}>
                  {attendance?.present != null && attendance?.totalDays != null
                    ? `${attendance.present} of ${attendance.totalDays} days`
                    : '—'}
                </span>
              </div>
            </div>
          </aside>

          <section className="subject-perf-table-card">
            <div className="perf-table-header">
              <h3>Subject Performance</h3>
              <span className="term-result-pill">TERM RESULT</span>
            </div>
            <div className="table-responsive">
              <table className="subject-perf-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>CA (40)</th>
                    <th>Exam (60)</th>
                    <th>Total</th>
                    <th>Grade</th>
                    <th>Teacher&apos;s Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                        No subject scores for this term.
                      </td>
                    </tr>
                  ) : (
                    performance.map((p, i) => (
                      <tr key={i}>
                        <td>{p.subject}</td>
                        <td>{p.ca}</td>
                        <td>{p.exam}</td>
                        <td style={{ color: '#5849b8' }}>{p.total}</td>
                        <td>
                          <span
                            className="status-cell-pill"
                            style={{
                              background: p.grade === 'A1' ? '#ede9fa' : '#eff6ff',
                              color: p.grade === 'A1' ? '#2d2460' : '#1e40af',
                            }}
                          >
                            {p.grade}
                          </span>
                        </td>
                        <td>{p.remark || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="remark-footer-premium">
              <div className="remark-text-area" style={{ width: '100%' }}>
                <h4>Principal&apos;s Remark</h4>
                <blockquote>
                  {result?.principalComment || 'No remark recorded for this term.'}
                </blockquote>
              </div>
            </div>
          </section>
        </div>
      )}

      <footer className="ann-footer-main" style={{ background: '#f8fafc', margin: '5rem -4rem -3rem', padding: '2.5rem 8rem' }}>
        <div className="footer-left-content">
          © {new Date().getFullYear()} EduCore AI. Empowering Nigerian Education.
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

export default ReportCard;
