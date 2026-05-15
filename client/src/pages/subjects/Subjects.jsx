import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import './Subjects.css';

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/subjects')
      .then(({ data }) => setSubjects(data || []))
      .catch(() => {
          setSubjects([
              { _id: '1', name: 'Advanced Physics', code: 'PHY-301', category: 'Science', teachers: [{}, {}], icon: '🔬' },
              { _id: '2', name: 'Creative Arts', code: 'ART-102', category: 'Arts', teachers: [], icon: '🎨' },
              { _id: '3', name: 'Accounting I', code: 'ACC-201', category: 'Commercial', teachers: [{}], icon: '💵' },
              { _id: '4', name: 'English Literature', code: 'ENG-101', category: 'General', teachers: [{}, {}], icon: '📖' },
              { _id: '5', name: 'Computer Science', code: 'CSC-205', category: 'Science', teachers: [], icon: '💻' }
          ]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="subjects-container d-flex justify-content-center align-items-center"><div className="spinner-border text-success" /></div>;

  return (
    <div className="subjects-container">
      <header className="ann-page-header">
        <div className="ann-header-left">
          <h1>Subject Catalog</h1>
          <p>Manage and assign curriculum subjects for the 2024 Academic Session.</p>
        </div>
        <button className="btn-new-ann" style={{ background: '#5849b8' }}>
          <div className="new-ann-icon">＋</div>
          Add Subject
        </button>
      </header>

      <div className="catalog-summary-row">
        <div className="catalog-stat-card">
          <div className="cat-icon-box blue">📚</div>
          <div className="cat-info">
            <h5>Total Subjects</h5>
            <h2>42</h2>
          </div>
        </div>
        <div className="catalog-stat-card">
          <div className="cat-icon-box green">👨‍🏫</div>
          <div className="cat-info">
            <h5>Total Teachers</h5>
            <h2>128</h2>
          </div>
        </div>
        <div className="catalog-stat-card">
          <div className="cat-icon-box red">⚠️</div>
          <div className="cat-info">
            <h5>Unassigned</h5>
            <h2>04</h2>
          </div>
        </div>
        <div className="catalog-stat-card ai-catalog-insight">
          <div className="cat-icon-box amber">⚡️</div>
          <div className="cat-info">
            <h5>AI Insight</h5>
            <p>Physics needs 2 more teachers.</p>
          </div>
        </div>
      </div>

      <div className="catalog-table-card">
        <div className="catalog-table-header">
          <h3>Academic Curriculum</h3>
          <div className="catalog-table-actions">
            <button className="btn-catalog-action">
              <span>F</span> Filter
            </button>
            <button className="btn-catalog-action">
              <span>E</span> Export
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="curriculum-table">
            <thead>
              <tr>
                <th>Subject Name</th>
                <th>Code</th>
                <th>Category</th>
                <th>Assigned Teachers</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map(s => (
                <tr key={s._id}>
                  <td>
                    <div className="subject-name-cell">
                      <div className="subject-icon-box">{s.icon || '📚'}</div>
                      {s.name}
                    </div>
                  </td>
                  <td style={{ color: '#64748b' }}>{s.code}</td>
                  <td>
                    <span className={`cat-badge ${s.category?.toLowerCase()}`}>
                      {s.category}
                    </span>
                  </td>
                  <td>
                    {s.teachers?.length > 0 ? (
                      <div className="teacher-avatars-row">
                        {s.teachers.slice(0, 2).map((_, i) => (
                          <div key={i} className="teacher-mini-avatar">
                            <img src={`https://ui-avatars.com/api/?background=random&name=T${i}`} alt="T" />
                          </div>
                        ))}
                        {s.teachers.length > 2 && (
                          <div className="teacher-plus-count">+{s.teachers.length - 2}</div>
                        )}
                      </div>
                    ) : (
                      <span className="unassigned-text">
                        <span>!</span> Unassigned
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="d-flex gap-3">
                      <button className="btn-table-icon">✏️</button>
                      <button className="btn-table-icon">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="catalog-pagination">
          <div className="pagination-info">Showing 1 to 5 of 42 subjects</div>
          <div className="pagination-controls">
            <div className="page-btn nav">{'<'}</div>
            <div className="page-btn active">1</div>
            <div className="page-btn">2</div>
            <div className="page-btn">3</div>
            <div className="page-btn nav">{'>'}</div>
          </div>
        </div>
      </div>

      <footer className="ann-footer-main" style={{ background: '#f8fafc', margin: '5rem -4rem -3rem', padding: '2.5rem 8rem' }}>
        <div className="footer-left-content">
          <span className="footer-brand">© 2024 EduSmart Systems Nigeria</span>. All rights reserved.
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

export default Subjects;
