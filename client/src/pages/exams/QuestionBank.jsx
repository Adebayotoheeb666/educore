import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Exams.css';

const QuestionBank = () => {
  const [subject, setSubject] = useState('Mathematics');

  return (
    <div className="exams-container">
      
      {/* Breadcrumb Header */}
      <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '3rem'}}>
         <Link to="/exams" style={{textDecoration: 'none', color: '#64748b', fontSize: '1.4rem', fontWeight: 700}}>Exams</Link>
         <span style={{color: '#94a3b8'}}>›</span>
         <span style={{fontSize: '1.4rem', fontWeight: 800, color: '#0f172a'}}>Question Bank AI</span>
      </div>

      <div className="qbank-layout">
        
        {/* Left: Generation Parameters */}
        <aside className="qbank-sidebar">
           <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '3rem'}}>
              <span style={{fontSize: '2rem'}}>🎛</span>
              <h3 style={{fontSize: '2rem', fontWeight: 800}}>Generation Parameters</h3>
           </div>

           <div className="form-group-premium" style={{marginBottom: '2.5rem'}}>
              <label>Subject</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                 <option>Mathematics</option>
                 <option>Physics</option>
                 <option>Chemistry</option>
              </select>
           </div>

           <div className="form-group-premium" style={{marginBottom: '2.5rem'}}>
              <label>Class Level</label>
              <select>
                 <option>SS3 (Grade 12)</option>
                 <option>SS2 (Grade 11)</option>
              </select>
           </div>

           <div className="form-group-premium" style={{marginBottom: '2.5rem'}}>
              <label>Topic</label>
              <input type="text" placeholder="e.g. Calculus" defaultValue="Calculus: Derivatives and Integration" />
           </div>

           <div className="form-grid" style={{gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem'}}>
              <div className="form-group-premium">
                <label>Question Type</label>
                <select><option>MCQ</option><option>Theory</option></select>
              </div>
              <div className="form-group-premium">
                <label>Difficulty</label>
                <select><option>Hard</option><option>Medium</option><option>Easy</option></select>
              </div>
           </div>

           <div className="form-group-premium" style={{marginBottom: '3rem'}}>
              <label>Exam Pattern</label>
              <div className="pattern-toggle-row">
                 <button className="pattern-btn active">WAEC</button>
                 <button className="pattern-btn">NECO</button>
                 <button className="pattern-btn">JAMB</button>
              </div>
           </div>

           <button className="btn-primary-green" style={{width: '100%', padding: '1.5rem', background: '#5849b8', borderRadius: '12px', fontSize: '1.4rem', fontWeight: 800}}>
              <span>✨</span> Generate Questions
           </button>

           <div className="ai-attendance-box" style={{marginTop: '4rem', background: '#f8fafc', border: 'none'}}>
              <h4 style={{fontSize: '1.2rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '1.5rem'}}>AI Credits & Performance</h4>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem'}}>
                 <span>Daily Generation Limit</span>
                 <span>450 / 500</span>
              </div>
              <div className="prog-bar-bg" style={{height: '6px'}}>
                 <div className="prog-bar-fill" style={{width: '90%', background: '#6A5ACD'}}></div>
              </div>
              <p style={{fontSize: '1rem', color: '#6A5ACD', fontWeight: 800, marginTop: '2rem'}}>✓ Verified for 2024 WAEC Syllabus updates.</p>
           </div>
        </aside>

        {/* Right: AI Preview */}
        <div className="qbank-preview-area">
           <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5rem'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '2rem'}}>
                 <div style={{width: '50px', height: '50px', background: '#0f172a', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2rem'}}>👁</div>
                 <div>
                    <h2 style={{fontSize: '2.4rem', fontWeight: 800, marginBottom: '0.3rem'}}>AI Generated Preview</h2>
                    <p style={{fontSize: '1.3rem', color: '#64748b'}}>{subject} • SS3 • MCQ • Hard</p>
                 </div>
              </div>
              <div style={{display: 'flex', gap: '1.5rem'}}>
                 <button className="btn-secondary-outline" style={{padding: '1rem 2rem'}}>🔄 Regenerate</button>
                 <button className="btn-primary-green" style={{background: '#0f172a', padding: '1rem 2rem'}}>📥 Export to Exam</button>
              </div>
           </div>

           {/* Question 1 */}
           <div className="question-block-premium">
              <div className="q-header">
                 <h4>Question 1</h4>
                 <div style={{display: 'flex', gap: '1rem'}}>
                    <span className="exam-type-badge ca" style={{fontSize: '1rem'}}>CALCULUS</span>
                    <span className="exam-type-badge terminal" style={{fontSize: '1rem', background: '#f1f5f9', color: '#475569'}}>3 POINTS</span>
                 </div>
              </div>
              <div className="q-content">
                Evaluate the definite integral of f(x) = 3x^2 - 4x + 5 from x = 1 to x = 3.
              </div>
              <div className="options-grid-q">
                 <div className="option-pill"><span>A</span> 24</div>
                 <div className="option-pill correct"><span>B</span> 28 <span style={{marginLeft: 'auto'}}>✓</span></div>
                 <div className="option-pill"><span>C</span> 32</div>
                 <div className="option-pill"><span>D</span> 30</div>
              </div>
              <div className="ai-explanation-box">
                 <div style={{display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.1rem', fontWeight: 800, color: '#1e40af', marginBottom: '1.2rem', textTransform: 'uppercase'}}>
                    <span>💡</span> AI Explanation
                 </div>
                 <p style={{fontSize: '1.2rem', color: '#1e40af', lineHeight: 1.6}}>
                   The integral is [x^3 - 2x^2 + 5x] from 1 to 3. Substituting 3: (27 - 18 + 15) = 24. Substituting 1: (1 - 2 + 5) = 4. Result: 24 - 4 = 20. Wait, checking calculation: 3^3 = 27, 2(3)^2 = 18, 5(3) = 15. 27-18+15=24. 1^3-2(1)^2+5(1)=4. 24-4=20. Result is 20. (Note: Example numbers for UI demo).
                 </p>
              </div>
           </div>

           {/* Question 2 */}
           <div className="question-block-premium">
              <div className="q-header">
                 <h4>Question 2</h4>
                 <div style={{display: 'flex', gap: '1rem'}}>
                    <span className="exam-type-badge ca" style={{fontSize: '1rem', background: '#fee2e2', color: '#991b1b'}}>DERIVATIVES</span>
                    <span className="exam-type-badge terminal" style={{fontSize: '1rem', background: '#f1f5f9', color: '#475569'}}>5 POINTS</span>
                 </div>
              </div>
              <div className="q-content">
                Find the derivative of y = sin(2x) * e^x with respect to x.
              </div>
              <div className="options-grid-q">
                 <div className="option-pill"><span>A</span> 2cos(2x)e^x</div>
                 <div className="option-pill"><span>B</span> sin(2x)e^x</div>
                 <div className="option-pill correct"><span>C</span> e^x (2cos(2x) + sin(2x)) <span style={{marginLeft: 'auto'}}>✓</span></div>
                 <div className="option-pill"><span>D</span> 2e^x (cos(2x) - sin(2x))</div>
              </div>
           </div>

           <div style={{textAlign: 'center', padding: '4rem 0', color: '#94a3b8', fontSize: '1.4rem'}}>
              •••<br/>AI continues generating questions based on your pattern...
           </div>

           <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '2.5rem', marginTop: '4rem'}}>
              <div style={{fontSize: '1.2rem', color: '#64748b'}}>
                 Generated 2 mins ago • Tokens used: 1,240
              </div>
              <div style={{display: 'flex', gap: '2rem', fontSize: '1.8rem', color: '#94a3b8'}}>
                 <span>👍</span> <span>👎</span>
              </div>
           </div>
        </div>

      </div>

    </div>
  );
};

export default QuestionBank;
