import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getSubjects, deleteSubject } from '../../services/subjectService';
import { getTeachers } from '../../services/teacherService';
import { useClientPagination } from '../../hooks/useClientPagination';
import ListPagination from '../../components/pagination/ListPagination';
import AssignTeachersModal from './AssignTeachersModal';
import './Subjects.css';

const teacherId = (t) => (typeof t === 'string' ? t : t._id);
const teacherName = (t) => (typeof t === 'object' && t?.name ? t.name : 'Teacher');
const avatarUrl = (name) =>
  `https://ui-avatars.com/api/?background=6A5ACD&color=fff&name=${encodeURIComponent(name || 'T')}`;

const Subjects = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [allTeachers, setAllTeachers] = useState([]);
  const [assignSubject, setAssignSubject] = useState(null);

  const loadSubjects = useCallback(async () => {
    try {
      setLoading(true);
      const [subjectsRes, teachersRes] = await Promise.all([getSubjects(), getTeachers()]);
      setSubjects(subjectsRes.data || []);
      setAllTeachers(teachersRes.data?.teachers ?? teachersRes.data ?? []);
      setError(null);
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to load subjects';
      setError(message);
      toast.error(message);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  const stats = useMemo(() => {
    const total = subjects.length;
    const teacherIds = new Set();
    let unassigned = 0;
    subjects.forEach(s => {
      if (!s.teachers?.length) unassigned += 1;
      else s.teachers.forEach(t => teacherIds.add(typeof t === 'string' ? t : t._id));
    });
    return { total, uniqueTeachers: teacherIds.size, unassigned };
  }, [subjects]);

  const {
    paginatedItems: paginatedSubjects,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    rangeStart,
    rangeEnd,
  } = useClientPagination(subjects, 10);

  const handleSubjectUpdated = (updated) => {
    setSubjects(prev => prev.map(s => (s._id === updated._id ? updated : s)));
    setAssignSubject(updated);
  };

  const handleDelete = async (subjectId) => {
    setDeletingId(subjectId);
    try {
      await deleteSubject(subjectId);
      setSubjects(prev => prev.filter(s => s._id !== subjectId));
      toast.success('Subject deleted');
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to delete subject');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="subjects-container d-flex justify-content-center align-items-center">
        <div className="spinner-border text-success" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="subjects-container">
        <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
          <h3>⚠️ Error Loading Subjects</h3>
          <p>{error}</p>
          <button onClick={loadSubjects} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#5849b8', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="subjects-container">
      {assignSubject && (
        <AssignTeachersModal
          subject={assignSubject}
          allTeachers={allTeachers}
          onClose={() => setAssignSubject(null)}
          onUpdated={handleSubjectUpdated}
        />
      )}
      <header className="ann-page-header">
        <div className="ann-header-left">
          <h1>Subject Catalog</h1>
          <p>Manage and assign curriculum subjects for the 2024 Academic Session.</p>
        </div>
        <button type="button" className="btn-new-ann" style={{ background: '#5849b8' }} onClick={() => navigate('/subjects/add')}>
          <div className="new-ann-icon">＋</div>
          Add Subject
        </button>
      </header>

      <div className="catalog-summary-row">
        <div className="catalog-stat-card">
          <div className="cat-icon-box blue">📚</div>
          <div className="cat-info">
            <h5>Total Subjects</h5>
            <h2>{stats.total}</h2>
          </div>
        </div>
        <div className="catalog-stat-card">
          <div className="cat-icon-box green">👨‍🏫</div>
          <div className="cat-info">
            <h5>Assigned Teachers</h5>
            <h2>{stats.uniqueTeachers}</h2>
          </div>
        </div>
        <div className="catalog-stat-card">
          <div className="cat-icon-box red">⚠️</div>
          <div className="cat-info">
            <h5>Unassigned</h5>
            <h2>{String(stats.unassigned).padStart(2, '0')}</h2>
          </div>
        </div>
        <div className="catalog-stat-card ai-catalog-insight">
          <div className="cat-icon-box amber">⚡️</div>
          <div className="cat-info">
            <h5>Catalog</h5>
            <p>{stats.total === 0 ? 'Add your first subject to get started.' : `${stats.total} subject${stats.total === 1 ? '' : 's'} in catalog.`}</p>
          </div>
        </div>
      </div>

      <div className="catalog-table-card">
        <div className="catalog-table-header">
          <h3>Academic Curriculum</h3>
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
              {subjects.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No subjects yet. Click &quot;Add Subject&quot; to create one.
                  </td>
                </tr>
              ) : paginatedSubjects.map(s => (
                <tr key={s._id}>
                  <td>
                    <div className="subject-name-cell">
                      <div className="subject-icon-box">{s.icon || '📚'}</div>
                      {s.name}
                    </div>
                  </td>
                  <td style={{ color: '#64748b' }}>{s.code || '—'}</td>
                  <td>
                    {s.category ? (
                      <span className={`cat-badge ${s.category.toLowerCase()}`}>
                        {s.category}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    {s.teachers?.length > 0 ? (
                      <div>
                        <div className="teacher-avatars-row">
                          {s.teachers.slice(0, 3).map(t => {
                            const name = teacherName(t);
                            return (
                              <div key={teacherId(t)} className="teacher-mini-avatar" title={name}>
                                <img src={avatarUrl(name)} alt={name} />
                              </div>
                            );
                          })}
                          {s.teachers.length > 3 && (
                            <div className="teacher-plus-count">+{s.teachers.length - 3}</div>
                          )}
                        </div>
                        <div className="teacher-names-preview">
                          {s.teachers.slice(0, 2).map(teacherName).join(', ')}
                          {s.teachers.length > 2 ? ` +${s.teachers.length - 2} more` : ''}
                        </div>
                      </div>
                    ) : (
                      <span className="unassigned-text">
                        <span>!</span> Unassigned
                      </span>
                    )}
                    <button
                      type="button"
                      className="btn-assign-teachers"
                      style={{ marginTop: '0.5rem', display: 'block' }}
                      onClick={() => setAssignSubject(s)}
                    >
                      {s.teachers?.length ? 'Manage' : 'Assign'} teachers
                    </button>
                  </td>
                  <td>
                    <div className="d-flex gap-3 align-items-center flex-wrap">
                      <button
                        type="button"
                        className="btn-table-icon"
                        title="Assign teachers"
                        onClick={() => setAssignSubject(s)}
                      >
                        👨‍🏫
                      </button>
                      <button
                        type="button"
                        className="btn-table-icon"
                        title="Edit subject"
                        onClick={() => navigate(`/subjects/${s._id}/edit`)}
                      >
                        ✏️
                      </button>
                      {confirmDeleteId === s._id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleDelete(s._id)}
                            disabled={!!deletingId}
                            style={{ padding: '0.25rem 0.75rem', borderRadius: '6px', background: '#ef4444', color: '#fff', border: 'none', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            {deletingId === s._id ? '…' : 'Confirm'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            style={{ padding: '0.25rem 0.75rem', borderRadius: '6px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="btn-table-icon"
                          title="Delete subject"
                          onClick={() => setConfirmDeleteId(s._id)}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {subjects.length > 0 && (
          <ListPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            onPageChange={setCurrentPage}
            itemLabel="subjects"
          />
        )}
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
