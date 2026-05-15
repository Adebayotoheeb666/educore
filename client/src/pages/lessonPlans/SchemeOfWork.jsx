import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import './Planning.css';

const getSchemesOfWork = () => axios.get('/api/lesson-plans/schemes/list');

const SchemeOfWork = () => {
  const [schemes, setSchemes] = useState([]);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSchemes = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await getSchemesOfWork();

        if (!Array.isArray(data)) {
          throw new Error('Invalid schemes response format - expected array');
        }

        const schemeList = data;
        setSchemes(schemeList);
        if (schemeList.length > 0) {
          setSelectedScheme(schemeList[0]);
        }
      } catch (err) {
        const message = err?.message || err?.response?.data?.message || 'Failed to load schemes of work';
        setError(message);
        console.error('Error loading schemes:', err);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadSchemes();
  }, []);

  if (error && !loading) {
    return (
      <div className="planning-container">
        <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
          <h3>⚠️ Error Loading Schemes</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#6A5ACD', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="planning-container">
        <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
          <div className="spinner-border text-primary"></div>
          <p style={{ marginTop: '1rem' }}>Loading schemes of work...</p>
        </div>
      </div>
    );
  }

  if (!selectedScheme) {
    return (
      <div className="planning-container">
        <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
          <p>No schemes of work available. Create one to get started.</p>
        </div>
      </div>
    );
  }

  const weeklyBreakdown = selectedScheme.weeklyBreakdown ?? selectedScheme.weeks ?? [];
  const title = selectedScheme.title ?? selectedScheme.subject ?? 'Scheme of Work';
  const description = selectedScheme.description ?? selectedScheme.class ?? 'Academic roadmap';

  return (
    <div className="planning-container">
      <header className="planning-header mb-5">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 className="display-4 fw-bold text-dark mb-2">{title}</h1>
            <p className="lead text-secondary">{description}</p>
          </div>
          <button className="btn btn-primary btn-lg rounded-pill px-5 shadow-sm">
            💾 Export PDF
          </button>
        </div>
      </header>

      {selectedScheme.aiInsight && (
        <div className="ai-roadmap-banner mb-5">
          <div className="banner-icon">🎯</div>
          <div className="banner-content">
            <h3>AI Curriculum Insights</h3>
            <p>{selectedScheme.aiInsight}</p>
          </div>
        </div>
      )}

      <div className="scheme-table-card">
        <table className="premium-scheme-table">
          <thead>
            <tr>
              <th width="80">Week</th>
              <th width="300">Topic & Focus</th>
              <th>Learning Objectives</th>
              <th width="250">Instructional Materials</th>
              <th width="150">Status</th>
            </tr>
          </thead>
          <tbody>
            {weeklyBreakdown.length > 0 ? (
              weeklyBreakdown.map((item, i) => {
                const materials = typeof item.materials === 'string'
                  ? item.materials.split(',')
                  : Array.isArray(item.materials)
                  ? item.materials
                  : [];
                return (
                  <tr key={i} className={(item.status ?? 'pending').toLowerCase().replace(' ', '-')}>
                    <td className="week-number">{item.week ?? i + 1}</td>
                    <td className="topic-cell">
                      <h4 className="m-0">{item.topic ?? '—'}</h4>
                    </td>
                    <td className="obj-cell">
                      <p className="m-0 text-secondary">{item.objectives ?? '—'}</p>
                    </td>
                    <td className="materials-cell">
                      <div className="material-tags">
                        {materials.map((tag, idx) => (
                          <span key={idx} className="m-tag">{tag.trim()}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill ${(item.status ?? 'pending').toLowerCase().replace(' ', '-')}`}>
                        {item.status ?? 'Pending'}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                  No weekly breakdown available for this scheme.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-5 d-flex justify-content-center">
        <button className="btn btn-outline-indigo btn-lg rounded-pill px-5 fw-bold" style={{ borderColor: '#4f46e5', color: '#4f46e5' }}>
          ➕ Add Weekly Slot
        </button>
      </div>
    </div>
  );
};

export default SchemeOfWork;
