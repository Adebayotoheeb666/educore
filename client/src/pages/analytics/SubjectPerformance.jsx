import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, Cell } from 'recharts';
import { getSubjectPerformance } from '../../services/analyticsService';
import axios from 'axios';
import './Analytics.css';

const SubjectPerformance = () => {
  const [data, setData] = useState(null);
  const [classes, setClasses] = useState([]);
  const [filters, setFilters] = useState({ term: 'First Term', session: '2023/2024', classId: 'SS 3 Gold' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get('/api/classes').then(({ data }) => setClasses(data || [])).catch(() => {});
    handleLoad();
  }, []);

  const handleLoad = async () => {
    setLoading(true);
    try {
      const { data: res } = await getSubjectPerformance(filters);
      setData(res);
    } catch (err) { 
        console.error("Failed to fetch subject performance:", err);
        setData({ subjects: [], topStudents: [] });
    }
    finally { setLoading(false); }
  };

  return (
    <div className="analytics-container">
      <header className="ann-page-header">
        <div className="ann-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#6A5ACD', fontWeight: 800, fontSize: '0.9rem', marginBottom: '1rem' }}>
             <span>✦</span> EduCore AI Insights Enabled
          </div>
          <h1>Subject Performance Analytics</h1>
          <p>Comprehensive breakdown of academic performance for the current academic session.</p>
        </div>
        
        <div className="chart-card-premium" style={{ padding: '1.5rem', marginBottom: 0 }}>
           <div className="d-flex gap-3">
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>Session</label>
                <select className="form-select border" style={{ fontSize: '0.85rem', fontWeight: 700 }} value={filters.session} onChange={e => setFilters({...filters, session: e.target.value})}>
                  <option>2023/2024</option>
                  <option>2024/2025</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>Term</label>
                <select className="form-select border" style={{ fontSize: '0.85rem', fontWeight: 700 }} value={filters.term} onChange={e => setFilters({...filters, term: e.target.value})}>
                  <option>First Term</option>
                  <option>Second Term</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>Class</label>
                <select className="form-select border" style={{ fontSize: '0.85rem', fontWeight: 700 }} value={filters.classId} onChange={e => setFilters({...filters, classId: e.target.value})}>
                  <option>SS 3 Gold</option>
                  <option>SS 3 Silver</option>
                </select>
              </div>
           </div>
        </div>
      </header>

      {/* Subject Summary Cards */}
      <div className="subject-summary-cards">
        {data?.subjects?.slice(0, 4).map(s => (
          <div key={s.subjectName} className="subject-mini-card">
            <div className="mini-card-header">
              <h3>{s.subjectName}</h3>
              <span className={`subject-status-badge ${s.status?.toLowerCase()}`}>{s.status}</span>
            </div>
            <div className="mini-card-meta">
               <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8' }}>{s.studentCount} Students</span>
            </div>
            <span className="mini-card-val">{s.average}%</span>
            <div className="mini-card-meta" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '1rem' }}>Average Class Score</div>
            <div className="mini-card-footer">
               <span>Pass Rate</span>
               <span className="val">{s.passRate}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="charts-grid-main">
        {/* Subject Average Comparison */}
        <div className="chart-box-premium">
          <div className="chart-header-row">
            <h3>Subject Average Comparison</h3>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b' }}>
               <span style={{ color: '#5849b8' }}>●</span> Current Term
            </span>
          </div>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <BarChart data={data?.subjects} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="subjectName" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontWeight: 700, fontSize: 11}} width={100} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="average" radius={[0, 10, 10, 0]} barSize={25}>
                   {data?.subjects?.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.average > 70 ? '#5849b8' : entry.average > 50 ? '#FFD700' : '#ef4444'} />
                   ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Multi-Subject View Radar */}
        <div className="chart-box-premium">
          <div className="chart-header-row">
            <h3>Multi-Subject View</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Standard deviation across core sciences.</p>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <RadarChart data={data?.subjects}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subjectName" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 800 }} />
                <Radar name="Average" dataKey="average" stroke="#5849b8" strokeWidth={2} fill="#5849b8" fillOpacity={0.15} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="ai-insight-box-small" style={{ marginTop: '1rem', background: '#f3f0ff' }}>
             <span className="ai-spark-icon">📈</span>
             <div className="ai-insight-text">
               <p style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>Focus on Physics laboratory sessions recommended.</p>
             </div>
          </div>
        </div>
      </div>

      {/* Top Performing Students Table */}
      <div className="performance-table-card">
        <div className="table-header-custom">
          <h3>Top Performing Students</h3>
          <button className="btn-export">
             📥 Export Report
          </button>
        </div>
        <div className="table-responsive">
          <table className="performance-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student Name</th>
                <th>Roll No</th>
                <th>Average</th>
                <th>Mathematics</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.topStudents?.map(s => (
                <tr key={s.rollNo}>
                  <td className="rank-text">{s.rank}</td>
                  <td>
                    <div className="student-name-cell">
                      <div className="name-initials-circle" style={{ background: '#ede9fa', color: '#2d2460' }}>
                        {s.firstName[0]}{s.lastName[0]}
                      </div>
                      {s.firstName} {s.lastName}
                    </div>
                  </td>
                  <td>{s.rollNo}</td>
                  <td style={{ fontWeight: 800 }}>{s.average}%</td>
                  <td style={{ color: '#5849b8', fontWeight: 800 }}>{s.math}</td>
                  <td>
                    <span className={`status-cell-pill ${s.status?.toLowerCase()}`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="view-all-row">
           <Link to="/students">View All Students</Link>
        </div>
      </div>

      <footer className="ann-footer-main" style={{ background: '#f8fafc', margin: '5rem -4rem -3rem', padding: '2.5rem 8rem' }}>
        <div className="footer-left-content">
          <span className="footer-brand">EduSmart Systems Nigeria</span> | © {new Date().getFullYear()} EduSmart Systems Nigeria. All rights reserved.
        </div>
        <div className="footer-links">
          <Link to="/support">Support Desk</Link>
          <Link to="/manual">User Manual</Link>
          <Link to="/privacy">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
};

export default SubjectPerformance;
