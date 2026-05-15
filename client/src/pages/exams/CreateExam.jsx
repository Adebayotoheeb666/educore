import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Exams.css';
import '../teachers/Teachers.css';

const CreateExam = () => {
  const navigate = useNavigate();

  return (
    <div className="exams-container">
      
      <div style={{marginBottom: '4rem'}}>
        <h1 style={{fontSize: '3.6rem', fontWeight: 800, color: '#0f172a'}}>Schedule Examination</h1>
      </div>

      <div className="schedule-grid">
        {/* Left Side: Form */}
        <div className="exam-details-form-card">
           <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '4rem'}}>
              <span style={{fontSize: '2.4rem'}}>📅</span>
              <h2 style={{fontSize: '2.4rem', fontWeight: 800}}>Exam Details</h2>
           </div>

           <form onSubmit={(e) => { e.preventDefault(); navigate('/exams'); }}>
              <div className="form-grid" style={{gridTemplateColumns: '1fr 1fr', gap: '3rem'}}>
                <div className="form-group-premium">
                  <label>Subject Selection</label>
                  <select>
                    <option>Select Subject</option>
                    <option>Mathematics</option>
                    <option>English</option>
                  </select>
                  <p style={{fontSize: '1.1rem', color: '#6A5ACD', marginTop: '0.8rem', fontWeight: 700}}>✓ Auto-detected for Science Stream</p>
                </div>
                <div className="form-group-premium">
                  <label>Class Selection</label>
                  <select>
                    <option>Select Class</option>
                    <option>SS3A</option>
                    <option>SS3B</option>
                  </select>
                </div>
                <div className="form-group-premium">
                  <label>Term</label>
                  <select>
                    <option>First Term</option>
                    <option>Second Term</option>
                    <option>Third Term</option>
                  </select>
                </div>
                <div className="form-group-premium">
                  <label>Exam Type</label>
                  <select>
                    <option>Theory (Written)</option>
                    <option>MCQ (CBT)</option>
                    <option>Practical</option>
                  </select>
                </div>
                <div className="form-group-premium">
                  <label>Total Marks</label>
                  <input type="text" placeholder="e.g. 100" />
                  <span style={{position: 'absolute', right: '1.5rem', top: '4.5rem', fontSize: '1.2rem', color: '#94a3b8', fontWeight: 700}}>Pts</span>
                </div>
                <div className="form-group-premium">
                  <label>Duration (Minutes)</label>
                  <input type="text" placeholder="e.g. 120" />
                  <span style={{position: 'absolute', right: '1.5rem', top: '4.5rem', fontSize: '1.2rem', color: '#94a3b8', fontWeight: 700}}>Min</span>
                </div>
              </div>

              <div className="form-group-premium" style={{marginTop: '3rem'}}>
                <label>Scheduled Date</label>
                <div style={{position: 'relative'}}>
                  <input type="date" style={{width: '100%'}} />
                </div>
                <p style={{fontSize: '1.2rem', color: '#dc2626', marginTop: '1rem', fontWeight: 700}}>
                   ⚠ Note: Potential conflict with Mid-Term break dates
                </p>
              </div>

              <div style={{display: 'flex', justifyContent: 'flex-end', gap: '2rem', marginTop: '6rem'}}>
                 <button type="button" className="btn-cancel" onClick={() => navigate('/exams')}>Cancel</button>
                 <button type="submit" className="btn-submit" style={{background: '#5849b8', padding: '1.4rem 4rem'}}>Create Exam Schedule</button>
              </div>
           </form>
        </div>

        {/* Right Side: Insights */}
        <aside>
           <div className="ai-recommendation-card" style={{borderLeft: '5px solid #FFD700'}}>
              <div className="ai-rec-header">
                 <span style={{fontSize: '2rem'}}>💡</span> AI Recommendation
              </div>
              <p className="ai-rec-text">
                 Based on your SS3 curriculum progress, we suggest scheduling <strong>Theory Exams</strong> for at least 150 minutes to accommodate long-form questions.
              </p>
              <div style={{fontSize: '1.2rem', fontWeight: 800, color: '#6A5ACD'}}>📈 94% syllabus completion</div>
           </div>

           <div className="ai-recommendation-card">
              <h4 style={{fontSize: '1.2rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '1.5rem'}}>Term Progress</h4>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem'}}>
                 <span>Exam Slots Filled</span>
                 <span>12/20</span>
              </div>
              <div className="prog-bar-bg" style={{height: '6px'}}>
                 <div className="prog-bar-fill" style={{width: '60%', background: '#5849b8'}}></div>
              </div>

              <div className="ai-attendance-box" style={{marginTop: '3rem', display: 'flex', gap: '1.5rem', background: '#eff6ff', border: 'none'}}>
                 <div style={{width: '32px', height: '32px', background: '#1e40af', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'}}>i</div>
                 <p style={{fontSize: '1.1rem', color: '#1e3a8a', lineHeight: 1.4}}>
                   Once scheduled, invitations will be sent to the assigned Hall invigilators and HODs.
                 </p>
              </div>
           </div>

           <div className="promo-image-wrap" style={{height: '200px', borderRadius: '20px'}}>
              <img 
                src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1000" 
                alt="Nigerian Curriculum" 
                style={{width: '100%', height: '100%', objectFit: 'cover'}}
              />
              <div style={{position: 'absolute', bottom: '1.5rem', left: '1.5rem', right: '1.5rem', color: 'white', fontSize: '1.1rem', fontWeight: 800}}>
                Standardized Nigerian Curriculum Compliant
              </div>
           </div>
        </aside>
      </div>

    </div>
  );
};

export default CreateExam;
