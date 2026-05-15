import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './Results.css';

const ReportCard = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [activeTerm, setActiveTerm] = useState('3rd Term (Current)');

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) return <div className="report-card-container d-flex justify-content-center align-items-center"><div className="spinner-border text-success" /></div>;

  const performance = [
    { subject: 'Mathematics', ca: 38, exam: 56, total: 94, grade: 'A1', remark: 'Exceptional logic and problem-solving skills.' },
    { subject: 'English Language', ca: 32, exam: 45, total: 77, grade: 'B2', remark: 'Great improvement in creative writing.' },
    { subject: 'Physics', ca: 35, exam: 52, total: 87, grade: 'A1', remark: 'Consistent mastery of theoretical concepts.' },
    { subject: 'Chemistry', ca: 30, exam: 48, total: 78, grade: 'B2', remark: 'Very good laboratory practical participation.' },
    { subject: 'Geography', ca: 28, exam: 42, total: 70, grade: 'B3', remark: 'Can perform better with more revision.' }
  ];

  return (
    <div className="report-card-container">
      <header className="ann-page-header" style={{ marginBottom: '1.5rem' }}>
        <div className="ann-header-left">
          <p style={{ color: '#64748b', fontWeight: 700, margin: 0, fontSize: '0.9rem' }}>Students / Academic Results</p>
          <h1 style={{ fontSize: '2.4rem' }}>Olawale Adeyemi (SS2)</h1>
          <p style={{ fontSize: '1rem', color: '#0f172a' }}>📅 2023/2024 Academic Session • Science Department</p>
        </div>
        <div className="ann-header-right">
           <button className="btn-catalog-action" style={{ background: 'white', border: '1px solid #e2e8f0', padding: '0.8rem 1.5rem' }}>
             📥 Export PDF
           </button>
           <button className="btn-new-ann" style={{ background: '#5849b8' }}>
             🖨 Print Result
           </button>
        </div>
      </header>

      <div className="ann-filters" style={{ marginBottom: '3rem' }}>
         {['1st Term', '2nd Term', '3rd Term (Current)'].map(t => (
           <button key={t} className={`filter-tab ${activeTerm === t ? 'active' : ''}`} onClick={() => setActiveTerm(t)}>
             {t}
           </button>
         ))}
      </div>

      <div className="report-card-main-grid">
        <aside className="student-result-sidebar">
          {/* Overall Performance */}
          <div className="result-stat-box-premium">
             <span className="result-stat-label">OVERALL PERFORMANCE</span>
             <h2 className="result-stat-val">84.2%</h2>
             <div className="d-flex justify-content-center gap-3">
               <span className="result-stat-badge excellence">Excellence</span>
               <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>Top 5% of Class</span>
             </div>
             <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', padding: '0 1rem' }}>
               <div className="text-start">
                 <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>Class Position</span>
                 <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>4th / 42</span>
               </div>
               <div className="text-end">
                 <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>Grade</span>
                 <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#5849b8' }}>A1</span>
               </div>
             </div>
             <div style={{ position: 'absolute', top: 20, right: 20, opacity: 0.1, fontSize: '4rem' }}>🏆</div>
          </div>

          {/* AI Learning Insights */}
          <div className="ai-learning-insight-box">
             <div className="ai-insight-tag-absolute">
                <span>✨</span> AI LEARNING INSIGHTS
             </div>
             <div className="ai-insight-title">Strong aptitude in Mathematics and Physics noted.</div>
             <div className="ai-insight-body">
               Olawale's performance in STEM subjects is exceptional. Consider enrolling him in the upcoming National Olympiad competitions for Further Mathematics.
             </div>
             <div className="ai-insight-quote">
               "Focusing on advanced problem sets would help balance his overall aggregate for the final session."
             </div>
          </div>

          {/* Term Attendance */}
          <div className="attendance-bar-chart-card">
             <div className="attendance-chart-header">
                <h3>TERM ATTENDANCE</h3>
             </div>
             <div className="attendance-bars-row">
                {[40, 70, 50, 90, 85, 100].map((h, i) => (
                  <div key={i} className="att-bar" style={{ height: `${h}%`, background: i === 5 ? '#5849b8' : '#5849b8' }}></div>
                ))}
             </div>
             <div className="att-stats-footer">
                <span>94% Attendance</span>
                <span style={{ color: '#64748b' }}>62 of 66 days</span>
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
                     <th>Teacher's Remarks</th>
                   </tr>
                 </thead>
                 <tbody>
                   {performance.map((p, i) => (
                     <tr key={i}>
                       <td>{p.subject}</td>
                       <td>{p.ca}</td>
                       <td>{p.exam}</td>
                       <td style={{ color: '#5849b8' }}>{p.total}</td>
                       <td>
                         <span className="status-cell-pill" style={{ background: p.grade === 'A1' ? '#ede9fa' : '#eff6ff', color: p.grade === 'A1' ? '#2d2460' : '#1e40af' }}>
                           {p.grade}
                         </span>
                       </td>
                       <td>{p.remark}</td>
                     </tr>
                   ))}
                 </tbody>
              </table>
           </div>
           <div className="remark-footer-premium">
              <img src="https://ui-avatars.com/api/?name=Amina+Yusuf&background=random" alt="T" />
              <div className="remark-text-area">
                 <h4>Form Teacher's Remark</h4>
                 <p style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', marginBottom: '1rem' }}>Mrs. Amina Yusuf • Senior Secondary Form Lead</p>
                 <blockquote>
                   "Olawale is a brilliant student who consistently demonstrates high academic standards. His discipline and curiosity make him a standout in the Science department. He is a role model to his peers and we are very proud of his progress this term."
                 </blockquote>
              </div>
           </div>
        </section>
      </div>

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
