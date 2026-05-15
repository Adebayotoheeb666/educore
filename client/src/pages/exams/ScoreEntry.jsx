import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { enterScores, getExamById } from '../../services/examService';
import { getClassStudents } from '../../services/classService';
import './Exams.css';
import '../students/Students.css';

const ScoreEntry = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    getExamById(id)
      .then(({ data: exam }) => {
        const classId = exam.class?._id || exam.class;
        if (!classId) { setStudents([]); return; }
        return getClassStudents(classId).then(({ data }) => {
          const list = data.students ?? data ?? [];
          setStudents(list.map(s => ({
            _id: s._id,
            name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim(),
            admissionNo: s.admissionNumber || s.admissionNo,
          })));
        });
      })
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleScoreChange = (studentId, value) => {
    setScores(prev => ({ ...prev, [studentId]: value }));
  };

  const submitScores = async () => {
    setSaving(true);
    try {
      const payload = Object.entries(scores).map(([student, score]) => ({ student, score: Number(score) || 0 }));
      await enterScores(id, payload);
      toast.success('Scores saved successfully');
      navigate('/exams');
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to save scores');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => submitScores();
  const handleSubmit = () => submitScores();

  return (
    <div className="exams-container">
      
      {/* Navigation Header */}
      <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '3rem'}}>
         <Link to="/exams" style={{textDecoration: 'none', color: '#64748b', fontSize: '1.4rem', fontWeight: 700}}>Exams</Link>
         <span style={{color: '#94a3b8'}}>›</span>
         <span style={{fontSize: '1.4rem', fontWeight: 700, color: '#64748b'}}>SS3 MATHEMATICS</span>
         <span style={{color: '#94a3b8'}}>›</span>
         <span style={{fontSize: '1.4rem', fontWeight: 800, color: '#0f172a'}}>MID-TERM ENTRY</span>
      </div>

      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem'}}>
         <h1 style={{fontSize: '4.2rem', fontWeight: 800, color: '#0f172a'}}>SS3 Mathematics Mid-term</h1>
         <div style={{display: 'flex', gap: '1.5rem'}}>
            <button className="btn-secondary-outline" style={{background: '#eff6ff', border: 'none', padding: '1.2rem 2.5rem'}}>
               <span>📥</span> Export CSV
            </button>
            <button className="btn-primary-green" style={{background: '#6A5ACD', padding: '1.2rem 2.5rem'}} onClick={handleSave}>
               <span>💾</span> Save Progress
            </button>
         </div>
      </div>

      <div className="score-entry-header-card">
         <div style={{display: 'flex', gap: '2rem'}}>
            <div className="score-meta-pill">
               <span>📅</span> Term 1, 2024
            </div>
            <div className="score-meta-pill">
               <span>👤</span> Mr. Chinedu Okafor
            </div>
            <div className="score-meta-pill" style={{background: '#f3f0ff', color: '#b8860b'}}>
               <span>🎓</span> {students.length} Students Enrolled
            </div>
         </div>
         <div style={{display: 'flex', alignItems: 'center', gap: '2rem', fontSize: '1.2rem', fontWeight: 800}}>
            <span style={{color: '#64748b'}}>Legend:</span>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.8rem'}}><span className="dot green"></span> Excellent (>75)</div>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.8rem'}}><span className="dot" style={{background: '#FFD700'}}></span> Average (40-75)</div>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.8rem'}}><span className="dot" style={{background: '#dc2626'}}></span> Risk (&lt;40)</div>
         </div>
      </div>

      {/* Score Table */}
      <div className="exam-list-card">
         <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3.5rem'}}>
            <h2 style={{fontSize: '2.4rem', fontWeight: 800}}>Student Roster & Score Sheet</h2>
         </div>

         <table className="premium-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Admission ID</th>
                <th>CA Score (40)</th>
                <th>Exam Score (60)</th>
                <th>Total (100)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Loading…</td></tr>
              ) : students.map(s => (
                <tr key={s._id}>
                  <td><strong>{s.name}</strong></td>
                  <td style={{ fontFamily: 'monospace' }}>{s.admissionNo || s._id}</td>
                  <td colSpan={2}>
                    <input type="number" className="score-input-mini" min="0" max="100" placeholder="Score" value={scores[s._id] ?? ''} onChange={e => handleScoreChange(s._id, e.target.value)} />
                  </td>
                  <td>{scores[s._id] ?? '—'}</td>
                  <td>—</td>
                </tr>
              ))}
            </tbody>
         </table>

         <div style={{marginTop: '3.5rem', display: 'flex', justifyContent: 'flex-end'}}>
            <div className="pagination-wrap">
               <button className="pag-btn">❮</button>
               <button className="pag-btn active">1</button>
               <button className="pag-btn">2</button>
               <button className="pag-btn">3</button>
               <button className="pag-btn">❯</button>
            </div>
         </div>
      </div>

      {/* Finalize Bar */}
      <div className="finalize-bar">
         <div style={{display: 'flex', alignItems: 'center', gap: '2.5rem'}}>
            <div style={{width: '60px', height: '60px', background: '#ede9fa', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.4rem'}}>☁️</div>
            <div>
               <h3 style={{fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem'}}>Ready to Finalize?</h3>
               <p style={{fontSize: '1.3rem', color: '#64748b'}}>Saving progress allows you to return later. Publishing will make these results visible to students and parents.</p>
            </div>
         </div>
         <div style={{display: 'flex', alignItems: 'center', gap: '3rem'}}>
            <label style={{display: 'flex', alignItems: 'center', gap: '1.2rem', fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', cursor: 'pointer'}}>
               <input type="checkbox" style={{width: '20px', height: '20px'}} />
               Publish Results immediately
            </label>
            <div style={{display: 'flex', gap: '1.5rem'}}>
               <button className="btn-secondary-outline" style={{padding: '1.5rem 3rem', background: '#eff6ff', border: 'none', borderRadius: '12px', fontWeight: 800}} onClick={handleSave}>Save as Draft</button>
               <button className="btn-primary-green" style={{padding: '1.5rem 4rem', background: '#0f172a', borderRadius: '12px', fontWeight: 800}} onClick={handleSubmit}>
                 Submit & Publish <span>→</span>
               </button>
            </div>
         </div>
      </div>

      <div style={{marginTop: '6rem', borderTop: '1px solid #f1f5f9', paddingTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{fontSize: '1.2rem', color: '#64748b'}}>
          <strong>EDUCORE AI</strong><br/>
          © 2024 EduCore AI. Empowering Nigerian Education.
        </div>
        <div style={{display: 'flex', gap: '2.5rem', fontSize: '1.3rem', color: '#475569', fontWeight: 600}}>
          <Link to="#" style={{textDecoration: 'none', color: 'inherit'}}>Privacy Policy</Link>
          <Link to="#" style={{textDecoration: 'none', color: 'inherit'}}>Terms of Service</Link>
          <Link to="#" style={{textDecoration: 'none', color: 'inherit'}}>Support Center</Link>
        </div>
      </div>

    </div>
  );
};

export default ScoreEntry;
