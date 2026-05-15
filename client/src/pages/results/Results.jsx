import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getResults, computeResults, releaseResults } from '../../services/resultService';
import { getClasses } from '../../services/classService';
import { useClientPagination } from '../../hooks/useClientPagination';
import ListPagination from '../../components/pagination/ListPagination';
import './Results.css';
import '../students/Students.css';

const Results = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [term, setTerm] = useState('First Term');
  const [session, setSession] = useState('2024/2025');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([getResults(), getClasses()])
      .then(([res, cls]) => {
        setResults(res.data?.results ?? res.data ?? []);
        const list = cls.data?.classes ?? cls.data ?? [];
        setClasses(list);
        if (list[0]) setSelectedClass(list[0]._id);
      })
      .catch(() => toast.error('Failed to load results'))
      .finally(() => setLoading(false));
  }, []);

  const handleCompute = async () => {
    if (!selectedClass) { toast.error('Select a class'); return; }
    setComputing(true);
    try {
      await computeResults({ classId: selectedClass, term, session });
      toast.success('Result computation started');
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to compute results');
    } finally {
      setComputing(false);
    }
  };

  const handleRelease = async () => {
    try {
      await releaseResults({ classId: selectedClass, term, session });
      toast.success('Results released to parents and students');
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to release results');
    }
  };

  const normalizeTermKey = (t) => (t || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const filteredResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const termKey = normalizeTermKey(term);
    return results.filter((r) => {
      const classId = r.class?._id ?? r.class;
      if (selectedClass && classId && String(classId) !== String(selectedClass)) return false;
      const rTerm = normalizeTermKey(r.term);
      if (termKey && rTerm && rTerm !== termKey && !rTerm.includes(termKey) && !termKey.includes(rTerm)) {
        return false;
      }
      if (!q) return true;
      const studentName =
        r.student?.name ||
        `${r.student?.firstName || ''} ${r.student?.lastName || ''}`.trim();
      return studentName.toLowerCase().includes(q);
    });
  }, [results, selectedClass, term, searchQuery]);

  const {
    paginatedItems: paginatedResults,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems: filteredCount,
    rangeStart,
    rangeEnd,
  } = useClientPagination(filteredResults, 10, [selectedClass, term, searchQuery]);

  const summary = useMemo(() => {
    if (!filteredResults.length) {
      return { avg: null, aboveAvg: 0, below40: 0 };
    }
    const scores = filteredResults.map((r) => Number(r.overallPercentage) || 0);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return {
      avg: avg.toFixed(1),
      aboveAvg: scores.filter((s) => s >= avg).length,
      below40: scores.filter((s) => s < 40).length,
    };
  }, [filteredResults]);

  return (
    <div className="results-container">
      
      {/* Header & Main Summary */}
      <div className="results-header-summary">
        <div>
           <h1 style={{fontSize: '3.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.2rem'}}>Results Management</h1>
           <p style={{fontSize: '1.6rem', color: '#64748b'}}>Manage academic performance records and approve termly distributions.</p>
           
           <div className="performance-overview-card" style={{marginTop: '4rem'}}>
              <div className="perf-chart-mini">📈</div>
              <div className="perf-stats-text">
                 <label>Average Class Performance</label>
                 <p>{summary.avg != null ? `${summary.avg}%` : '—'}</p>
              </div>
              <div className="perf-indicators">
                 <div className="indicator-item green">
                    <span style={{fontSize: '1.8rem'}}>•</span> {summary.aboveAvg} at or above class average
                 </div>
                 <div className="indicator-item red">
                    <span style={{fontSize: '1.8rem'}}>•</span> {summary.below40} below 40%
                 </div>
              </div>
           </div>
        </div>

        <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
           <div style={{display: 'flex', gap: '1.5rem'}}>
              <select className="attendance-select" value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={{ minWidth: '140px' }}>
                {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <select className="attendance-select" value={term} onChange={e => setTerm(e.target.value)} style={{ minWidth: '120px' }}>
                <option>First Term</option>
                <option>Second Term</option>
                <option>Third Term</option>
              </select>
              <button type="button" className="btn-primary-green" style={{background: '#6A5ACD', padding: '1.2rem 3rem'}} onClick={handleCompute} disabled={computing}>
                 <span>🔢</span> {computing ? 'Computing…' : 'Compute Results'}
              </button>
              <button type="button" className="btn-secondary-outline" style={{padding: '1.2rem 3rem'}} onClick={handleRelease}>
                 <span>🔓</span> Release Results
              </button>
           </div>
           
        </div>
      </div>

      {/* Results Table */}
      <div className="exam-list-card">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3.5rem'}}>
           <div style={{display: 'flex', gap: '2rem'}}>
             <div className="topbar-search" style={{maxWidth: '300px', margin: 0}}>
                <span className="topbar-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search student name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             <select
               className="attendance-select"
               style={{ minWidth: '140px' }}
               value={selectedClass}
               onChange={(e) => setSelectedClass(e.target.value)}
             >
               {classes.map(c => (
                 <option key={c._id} value={c._id}>{c.name}{c.arm ? ` ${c.arm}` : ''}</option>
               ))}
             </select>
           </div>
           <button className="btn-secondary-outline" style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              <span>🎚️</span> Filter
           </button>
        </div>

        {loading ? (
          <div style={{padding: '4rem', textAlign: 'center', color: '#64748b'}}>Loading results…</div>
        ) : filteredResults.length === 0 ? (
          <div style={{padding: '4rem', textAlign: 'center', color: '#64748b'}}>
            {results.length === 0 ? 'No results found.' : 'No results match your filters.'}
          </div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Class</th>
                <th>Overall %</th>
                <th>Position</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedResults.map((r, i) => {
                const studentName =
                  r.student?.name ||
                  `${r.student?.firstName || ''} ${r.student?.lastName || ''}`.trim() ||
                  r.name ||
                  '—';
                const initials = studentName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                const admNo = r.student?.admissionNo ?? r.admissionNo ?? r.id ?? '—';
                const className = r.class?.name ?? r.class ?? '—';
                const overall = r.overallPercentage != null ? `${r.overallPercentage.toFixed(1)}%` : (r.score ?? '—');
                const pos = r.positionInClass ?? r.position;
                const position = pos != null ? `${pos}${['st','nd','rd'][pos-1] ?? 'th'}` : '—';
                const status = r.status ?? 'pending';
                return (
                  <tr key={r._id ?? i}>
                    <td>
                      <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
                        <div className="student-avatar-circle" style={{width: '40px', height: '40px', background: '#ede9fa', color: '#6A5ACD'}}>{initials}</div>
                        <div className="student-info-mini">
                          <h4>{studentName}</h4>
                          <p>{admNo}</p>
                        </div>
                      </div>
                    </td>
                    <td>{className}</td>
                    <td style={{fontWeight: 800}}>{overall}</td>
                    <td>
                      <span style={{padding: '0.4rem 1rem', background: '#ede9fa', color: '#2d2460', borderRadius: '12px', fontWeight: 800, fontSize: '1.1rem'}}>
                        {position}
                      </span>
                    </td>
                    <td>
                      <span className={`status-label ${status === 'released' ? 'active' : status === 'approved' ? 'pending' : 'absent'}`} style={{textTransform: 'capitalize'}}>
                        {status}
                      </span>
                    </td>
                    <td>
                      <Link to={`/results/${r.student?._id ?? r._id}`} style={{color: '#2d2460', fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                        View Report <span>↗</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
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
            itemLabel="results"
          />
        )}
      </div>


      <div style={{marginTop: '6rem', borderTop: '1px solid #f1f5f9', paddingTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{fontSize: '1.2rem', color: '#64748b'}}>
          <strong>EDUCORE AI</strong><br/>
          © 2024 EduCore AI. Empowering Nigerian Education.
        </div>
        <div style={{display: 'flex', gap: '2.5rem', fontSize: '1.3rem', color: '#475569', fontWeight: 600}}>
          <Link to="#" style={{textDecoration: 'none', color: 'inherit'}}>Privacy Policy</Link>
          <Link to="#" style={{textDecoration: 'none', color: 'inherit'}}>Support Center</Link>
          <Link to="#" style={{textDecoration: 'none', color: 'inherit'}}>Documentation</Link>
        </div>
      </div>

    </div>
  );
};

export default Results;
