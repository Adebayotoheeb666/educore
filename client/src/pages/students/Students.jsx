import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getStudents, deleteStudent } from '../../services/studentService';
import './Students.css';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    setLoading(true);
    getStudents()
      .then(({ data }) => {
        const list = data.students ?? data;
        setStudents(list);
        setTotal(data.total ?? list.length);
      })
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setLoading(false));
  }, []);

  const classes = useMemo(() => {
    const names = students.map(s => s.class?.name ?? s.class).filter(Boolean);
    return [...new Set(names)].sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return students.filter(s => {
      const matchesSearch =
        !q ||
        (s.name ?? '').toLowerCase().includes(q) ||
        (s.admissionNo ?? '').toLowerCase().includes(q) ||
        (s.parentPhone ?? s.phone ?? '').includes(q);

      const matchesClass =
        !classFilter || (s.class?.name ?? s.class) === classFilter;

      const matchesGender =
        !genderFilter || (s.gender ?? '').toLowerCase() === genderFilter.toLowerCase();

      return matchesSearch && matchesClass && matchesGender;
    });
  }, [students, searchQuery, classFilter, genderFilter]);

  const handleDelete = async (studentId) => {
    setDeletingId(studentId);
    try {
      await deleteStudent(studentId);
      setStudents(prev => prev.filter(s => (s._id ?? s.id) !== studentId));
      setTotal(prev => prev - 1);
      toast.success('Student deleted');
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to delete student');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="students-container">

      {/* Page Header */}
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>{total ? `${total.toLocaleString()} Total Students` : 'Students'}</h1>
          <p>Managing the academic records of the 2023/2024 academic session.</p>
        </div>
        <div className="header-actions">
          <Link to="/students/bulk-import" className="btn-secondary-outline">
            <span>📤</span> Bulk Import
          </Link>
          <Link to="/students/add" className="btn-primary-green">
            <span>👤+</span> Add Student
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon" style={{position: 'absolute', left: '1.8rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8'}}>🔍</span>
          <input
            type="text"
            placeholder="Search by name, ID, or parent phone number..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={classFilter}
          onChange={e => setClassFilter(e.target.value)}
        >
          <option value="">All Classes</option>
          {classes.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={genderFilter}
          onChange={e => setGenderFilter(e.target.value)}
        >
          <option value="">Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
        <button
          className="filter-icon-btn"
          onClick={() => { setSearchQuery(''); setClassFilter(''); setGenderFilter(''); }}
          title="Clear filters"
        >
          <span>📊</span>
        </button>
      </div>

      {/* Table Section */}
      <div className="premium-table-card">
        {loading ? (
          <div style={{padding: '4rem', textAlign: 'center', color: '#64748b'}}>Loading students…</div>
        ) : filteredStudents.length === 0 ? (
          <div style={{padding: '4rem', textAlign: 'center', color: '#64748b'}}>
            {students.length === 0 ? 'No students found.' : 'No students match your filters.'}
          </div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Admission No.</th>
                <th>Class</th>
                <th>Gender</th>
                <th>Parent Phone</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => (
                <tr key={student._id ?? student.id}>
                  <td>
                    <div className="student-info-cell">
                      <div className="student-avatar-small">
                        <img src={student.avatar || `https://ui-avatars.com/api/?name=${student.name}&background=random`} alt="" style={{width: '100%'}} />
                      </div>
                      <div className="student-name-stack">
                        <h4>{student.name}</h4>
                        <p>Joined {student.joinDate || new Date(student.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className="admission-no">{student.admissionNo}</span></td>
                  <td><span className="class-tag">{student.class?.name ?? student.class}</span></td>
                  <td><span className="gender-text">{student.gender}</span></td>
                  <td><span className="phone-text">{student.parentPhone ?? student.phone}</span></td>
                  <td>
                    <span className={`status-badge ${(student.status || 'active').toLowerCase()}`}>
                      {student.status || 'Active'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <Link to={`/students/${student._id ?? student.id}`} className="view-profile-link">View</Link>
                      {confirmDeleteId === (student._id ?? student.id) ? (
                        <>
                          <button
                            onClick={() => handleDelete(student._id ?? student.id)}
                            disabled={!!deletingId}
                            style={{ padding: '0.5rem 1.2rem', borderRadius: '6px', background: '#ef4444', color: '#fff', border: 'none', fontSize: '1.2rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            {deletingId === (student._id ?? student.id) ? '…' : 'Confirm'}
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
                          onClick={() => setConfirmDeleteId(student._id ?? student.id)}
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

        {!loading && filteredStudents.length > 0 && (
          <div className="table-footer">
            <div className="showing-text">
              Showing {filteredStudents.length} of {total.toLocaleString()} students
              {(searchQuery || classFilter || genderFilter) && ' (filtered)'}
            </div>
          </div>
        )}
      </div>

      <div style={{marginTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem', color: '#6A5ACD', fontSize: '1.3rem', fontWeight: 700}}>
          <span>🛡️</span> Live data from database.
        </div>
        <div style={{display: 'flex', gap: '2rem', fontSize: '1.2rem', color: '#64748b'}}>
          <Link to="#" style={{textDecoration: 'none', color: 'inherit'}}>Privacy Policy</Link>
          <Link to="#" style={{textDecoration: 'none', color: 'inherit'}}>Export Logs</Link>
          <Link to="#" style={{textDecoration: 'none', color: 'inherit'}}>Support</Link>
        </div>
      </div>
    </div>
  );
};

export default Students;
