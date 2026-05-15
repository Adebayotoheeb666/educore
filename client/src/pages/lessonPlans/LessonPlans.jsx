import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import './Planning.css';

const getLessonPlans = (params) => axios.get('/api/lesson-plans', { params });

const LessonPlans = () => {
  const [view, setView] = useState('list');
  const [lessonPlans, setLessonPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, aiAssisted: 0 });

  useEffect(() => {
    const loadPlans = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await getLessonPlans();

        if (!Array.isArray(data)) {
          throw new Error('Invalid lesson plans response format - expected array');
        }

        const plans = data;
        setLessonPlans(plans);
        setStats({
          total: plans.length,
          approved: plans.filter(p => p.status === 'approved').length,
          pending: plans.filter(p => p.status === 'pending').length,
          aiAssisted: plans.filter(p => p.aiGenerated).length,
        });
      } catch (err) {
        const message = err?.message || err?.response?.data?.message || 'Failed to load lesson plans';
        setError(message);
        console.error('Error loading lesson plans:', err);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  return (
    <div className="planning-container">
      <header className="planning-header d-flex justify-content-between align-items-end">
        <div>
          <h1 className="display-4 fw-bold text-dark mb-2">Lesson Planning</h1>
          <p className="lead text-secondary">Collaborative curriculum design & AI generation</p>
        </div>
        <div className="d-flex gap-3">
          <button
            className={`btn btn-lg px-4 rounded-pill ${view === 'list' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setView('list')}
          >
            📚 View All Plans
          </button>
          <button
            className={`btn btn-lg px-4 rounded-pill ${view === 'ai-studio' ? 'btn-indigo' : 'btn-outline-indigo'}`}
            style={{ backgroundColor: view === 'ai-studio' ? '#6A5ACD' : 'transparent', color: view === 'ai-studio' ? 'white' : '#6A5ACD', borderColor: '#6A5ACD' }}
            onClick={() => setView('ai-studio')}
          >
            ✨ AI Lesson Studio
          </button>
        </div>
      </header>

      <div className="planning-summary">
        <div className="summary-stat-card">
          <h4 className="text-secondary small fw-bold text-uppercase">Total Plans</h4>
          <p className="display-6 fw-bold m-0">{stats.total}</p>
        </div>
        <div className="summary-stat-card">
          <h4 className="text-secondary small fw-bold text-uppercase">Approved</h4>
          <p className="display-6 fw-bold m-0 text-success">{stats.approved}</p>
        </div>
        <div className="summary-stat-card">
          <h4 className="text-secondary small fw-bold text-uppercase">Pending</h4>
          <p className="display-6 fw-bold m-0 text-warning">{stats.pending}</p>
        </div>
        <div className="summary-stat-card">
          <h4 className="text-secondary small fw-bold text-uppercase">AI Assisted</h4>
          <p className="display-6 fw-bold m-0" style={{ color: '#6A5ACD' }}>{stats.aiAssisted}</p>
        </div>
      </div>

      {error && !loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444', backgroundColor: '#fee2e2', borderRadius: '8px', marginBottom: '2rem' }}>
          <h3>⚠️ Error Loading Lesson Plans</h3>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#6A5ACD', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      ) : null}

      {view === 'list' ? (
        loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
            <div className="spinner-border text-primary"></div>
            <p style={{ marginTop: '1rem' }}>Loading lesson plans…</p>
          </div>
        ) : lessonPlans.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>No lesson plans found. Create your first lesson plan to get started.</div>
        ) : (
          <div className="lp-grid">
            {lessonPlans.map(plan => {
              const teacherName = plan.teacher
                ? `${plan.teacher.firstName ?? ''} ${plan.teacher.lastName ?? ''}`.trim()
                : '—';
              const className = plan.class?.name ?? plan.class ?? '—';
              const subjectName = plan.subject?.name ?? plan.subject ?? '—';
              const date = plan.date
                ? new Date(plan.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : plan.createdAt
                ? new Date(plan.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : '—';
              const status = plan.status ?? 'draft';
              return (
                <div key={plan._id ?? plan.id} className="lp-card">
                  <span className={`lp-badge ${status.toLowerCase()}`}>{status}</span>
                  <div className="lp-info">
                    <p className="mb-1 fw-bold text-primary">{subjectName}</p>
                    <h3>{plan.topic ?? plan.title ?? '—'}</h3>
                    <p>For Class: <strong>{className}</strong></p>
                    <div className="lp-metadata">
                      <div className="meta-item"><span>📅</span> {date}</div>
                      <div className="meta-item"><span>👤</span> {teacherName}</div>
                    </div>
                    <div className="d-flex gap-2">
                      <button className="btn btn-light flex-grow-1 fw-bold">View Details</button>
                      <button className="btn btn-outline-primary fw-bold">Edit</button>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="lp-card d-flex align-items-center justify-content-center" style={{ borderStyle: 'dashed', backgroundColor: 'transparent' }}>
              <div className="text-center">
                <div className="fs-1 text-muted mb-3">+</div>
                <h4 className="text-muted fw-bold">Create New Plan</h4>
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="ai-studio-layout">
          <div className="ai-form-card">
            <h2 className="fw-bold mb-4">AI Lesson Designer</h2>
            <div className="mb-4">
              <label className="form-label fw-bold">Subject Area</label>
              <select className="form-select form-select-lg">
                <option>Mathematics</option>
                <option>English Literature</option>
                <option>Chemistry</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="form-label fw-bold">Lesson Topic</label>
              <input type="text" className="form-control form-control-lg" placeholder="e.g. Introduction to Calculus" />
            </div>
            <div className="mb-4">
              <label className="form-label fw-bold">Learning Objectives</label>
              <textarea className="form-control" rows="4" placeholder="What should students achieve?"></textarea>
            </div>
            <div className="mb-5">
              <label className="form-label fw-bold">Complexity Level</label>
              <div className="d-flex justify-content-between px-2">
                <span className="small fw-bold">Basic</span>
                <span className="small fw-bold">Intermediate</span>
                <span className="small fw-bold">Advanced</span>
              </div>
              <input type="range" className="form-range" min="1" max="3" />
            </div>
            <button className="btn btn-lg w-100 py-3 rounded-pill fw-bold" style={{ background: '#6A5ACD', color: 'white' }}>
              ✨ Generate Lesson Plan
            </button>
          </div>

          <div className="ai-preview-card">
            <div className="ai-generation-overlay">
              <div className="spinner-grow mb-4" style={{ width: '4rem', height: '4rem', color: '#6A5ACD' }}></div>
              <h3 className="fw-bold">Ready to Design</h3>
              <p className="text-secondary">Input your lesson parameters to start the AI generation engine.</p>
            </div>
            <div className="preview-skeleton">
              <div className="h-25 w-100 bg-light rounded-4 mb-4"></div>
              <div className="h-10 w-75 bg-light rounded-4 mb-3"></div>
              <div className="h-10 w-50 bg-light rounded-4 mb-5"></div>
              <div className="row g-4">
                <div className="col-4"><div className="h-25 bg-light rounded-4"></div></div>
                <div className="col-8"><div className="h-25 bg-light rounded-4"></div></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonPlans;
