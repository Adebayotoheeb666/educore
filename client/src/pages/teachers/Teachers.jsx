import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getTeachers, deleteTeacher } from '../../services/teacherService';
import { useClientPagination } from '../../hooks/useClientPagination';
import ListPagination from '../../components/pagination/ListPagination';
import '../students/Students.css';
import './Teachers.css';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    setLoading(true);
    getTeachers()
      .then(({ data }) => {
        setTeachers(data.teachers ?? data);
        setTotal(data.total ?? (data.teachers ?? data).length);
      })
      .catch(() => toast.error('Failed to load teachers'))
      .finally(() => setLoading(false));
  }, []);

  const filteredTeachers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return teachers;
    return teachers.filter((t) => {
      const name = (t.name ?? '').toLowerCase();
      const email = (t.email ?? '').toLowerCase();
      const dept = (t.department ?? t.dept ?? '').toLowerCase();
      const role = (t.role ?? '').toLowerCase();
      return name.includes(q) || email.includes(q) || dept.includes(q) || role.includes(q);
    });
  }, [teachers, searchQuery]);

  const {
    paginatedItems: paginatedTeachers,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems: filteredCount,
    rangeStart,
    rangeEnd,
  } = useClientPagination(filteredTeachers, 10, [searchQuery]);

  const handleDelete = async (teacherId) => {
    setDeletingId(teacherId);
    try {
      await deleteTeacher(teacherId);
      setTeachers(prev => prev.filter(t => (t._id ?? t.id) !== teacherId));
      setTotal(prev => prev - 1);
      toast.success('Teacher deleted');
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to delete teacher');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="teachers-container">
      
      {/* Page Header */}
      <div className="page-header-row" style={{marginBottom: '5rem'}}>
        <div className="page-header-text">
          <h1 style={{fontSize: '3.2rem'}}>Teacher Management</h1>
        </div>
        <div className="header-actions">
           <Link to="/teachers/add" className="btn-primary-green" style={{background: '#6A5ACD'}}>
             <span>👤+</span> Add Teacher
           </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon" style={{position: 'absolute', left: '1.8rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8'}}>🔍</span>
          <input
            type="text"
            placeholder="Search by teacher name, email or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="btn-secondary-outline">
          <span>📊</span> Filters
        </button>
      </div>

      {/* Table Section */}
      <div className="premium-table-card">
        {loading ? (
          <div style={{padding: '4rem', textAlign: 'center', color: '#64748b'}}>Loading teachers…</div>
        ) : filteredTeachers.length === 0 ? (
          <div style={{padding: '4rem', textAlign: 'center', color: '#64748b'}}>
            {teachers.length === 0 ? 'No teachers found.' : 'No teachers match your search.'}
          </div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTeachers.map(t => (
                <tr key={t._id ?? t.id}>
                  <td>
                    <div className="student-info-cell">
                      <div className="student-avatar-small">
                        <img src={t.avatar || `https://ui-avatars.com/api/?name=${t.name}&background=random`} alt="" style={{width: '100%'}} />
                      </div>
                      <div className="student-name-stack">
                        <h4>{t.name}</h4>
                        <p>{t.department ?? t.dept}</p>
                      </div>
                    </div>
                  </td>
                  <td><span style={{fontSize: '1.3rem', color: '#64748b'}}>{t.email}</span></td>
                  <td>
                    <span className="role-badge">{t.role?.replace('_', ' ')}</span>
                  </td>
                  <td><span className="phone-text">{t.phone}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <Link to={`/teachers/${t._id ?? t.id}`} className="btn-secondary-outline" style={{ padding: '0.8rem 2rem', fontSize: '1.2rem' }}>View</Link>
                      {confirmDeleteId === (t._id ?? t.id) ? (
                        <>
                          <button
                            onClick={() => handleDelete(t._id ?? t.id)}
                            disabled={!!deletingId}
                            style={{ padding: '0.5rem 1.2rem', borderRadius: '6px', background: '#ef4444', color: '#fff', border: 'none', fontSize: '1.2rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            {deletingId === (t._id ?? t.id) ? '…' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            style={{ padding: '0.5rem 1.2rem', borderRadius: '6px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', fontSize: '1.2rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(t._id ?? t.id)}
                          style={{ padding: '0.5rem 1.2rem', borderRadius: '6px', background: '#fff0f0', color: '#ef4444', border: '1px solid #fecaca', fontSize: '1.2rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && filteredCount > 0 && (
          <ListPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredCount}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            onPageChange={setCurrentPage}
            itemLabel="teachers"
            className="table-footer"
          />
        )}
      </div>


      <div style={{marginTop: '6rem', borderTop: '1px solid #f1f5f9', paddingTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{fontSize: '1.2rem', color: '#64748b'}}>
          <strong>EDUCORE AI</strong><br/>
          © 2024 EduCore AI. Nigeria's Wise Digital Assistant.
        </div>
        <div style={{display: 'flex', gap: '2.5rem', fontSize: '1.3rem', color: '#475569', fontWeight: 600}}>
          <Link to="#" style={{textDecoration: 'none', color: 'inherit'}}>Privacy Policy</Link>
          <Link to="#" style={{textDecoration: 'none', color: 'inherit'}}>Terms of Service</Link>
          <Link to="#" style={{textDecoration: 'none', color: 'inherit'}}>Help Desk</Link>
          <Link to="#" style={{textDecoration: 'none', color: 'inherit'}}>Contact Support</Link>
        </div>
      </div>

    </div>
  );
};

export default Teachers;
