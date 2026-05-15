import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getTeacherEffectiveness } from '../../services/analyticsService';
import './Analytics.css';

const TeacherEffectiveness = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeacherEffectiveness()
      .then(({ data: d }) => setData(d || []))
      .catch(() => toast.error('Failed to load teacher effectiveness data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="analytics-container d-flex justify-content-center align-items-center">
      <div className="spinner-border text-primary" />
    </div>
  );

  return (
    <div className="analytics-container">
      <header className="mb-5 d-flex justify-content-between align-items-center">
        <div>
          <Link to="/analytics" style={{ fontSize: '1.4rem', color: '#64748b', fontWeight: 700, textDecoration: 'none' }}>
            ← Analytics
          </Link>
          <h1 className="display-4 fw-bold text-dark mb-2 mt-2">Teacher Effectiveness</h1>
          <p className="lead text-secondary">Lesson plan submissions, attendance marking rates, and class outcomes per teacher</p>
        </div>
      </header>

      {data.length === 0 ? (
        <div className="chart-card-premium d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 300 }}>
          <span style={{ fontSize: '3rem' }}>📊</span>
          <p className="text-secondary mt-3">No effectiveness data available yet. Data populates once lesson plans and results are recorded.</p>
        </div>
      ) : (
        <>
          <div className="chart-card-premium mb-5">
            <div className="chart-header">
              <h3>Lesson Plan Submission Rate by Teacher</h3>
              <div className="badge bg-light text-dark p-2 px-3 border">This Term</div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="teacherName" angle={-35} textAnchor="end" tick={{ fontSize: 12 }} />
                <YAxis unit="%" domain={[0, 100]} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="lessonPlanRate" fill="#4f46e5" name="Lesson Plan Rate" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card-premium">
            <div className="chart-header mb-4">
              <h3>Teacher Performance Summary</h3>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th style={{ fontSize: '1.3rem', fontWeight: 700, padding: '1.5rem' }}>#</th>
                    <th style={{ fontSize: '1.3rem', fontWeight: 700 }}>Teacher</th>
                    <th style={{ fontSize: '1.3rem', fontWeight: 700 }}>Subjects</th>
                    <th style={{ fontSize: '1.3rem', fontWeight: 700 }}>Lesson Plans</th>
                    <th style={{ fontSize: '1.3rem', fontWeight: 700 }}>Attendance Marked</th>
                    <th style={{ fontSize: '1.3rem', fontWeight: 700 }}>Avg Class Score</th>
                    <th style={{ fontSize: '1.3rem', fontWeight: 700 }}>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((t, i) => (
                    <tr key={t._id || i}>
                      <td style={{ padding: '1.5rem', fontSize: '1.4rem', color: '#94a3b8' }}>{i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '1.5rem', color: '#0f172a' }}>{t.teacherName}</div>
                        <div style={{ fontSize: '1.2rem', color: '#94a3b8' }}>{t.email}</div>
                      </td>
                      <td style={{ fontSize: '1.4rem' }}>{(t.subjects || []).join(', ') || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ flex: 1, background: '#e2e8f0', borderRadius: 4, height: 8 }}>
                            <div style={{ width: `${t.lessonPlanRate || 0}%`, background: '#4f46e5', height: 8, borderRadius: 4 }} />
                          </div>
                          <span style={{ fontSize: '1.3rem', fontWeight: 700 }}>{t.lessonPlanRate || 0}%</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '1.4rem' }}>{t.attendanceMarked || 0} days</td>
                      <td>
                        <span style={{
                          fontWeight: 800,
                          fontSize: '1.5rem',
                          color: (t.avgClassScore || 0) >= 60 ? '#6A5ACD' : (t.avgClassScore || 0) >= 40 ? '#b8860b' : '#dc2626'
                        }}>
                          {t.avgClassScore != null ? `${t.avgClassScore}%` : '—'}
                        </span>
                      </td>
                      <td>
                        {(t.lessonPlanRate || 0) >= 80
                          ? <span className="badge bg-success">Excellent</span>
                          : (t.lessonPlanRate || 0) >= 50
                          ? <span className="badge bg-warning text-dark">Good</span>
                          : <span className="badge bg-danger">Needs Improvement</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TeacherEffectiveness;
