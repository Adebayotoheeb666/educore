import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getParentResults } from '../../services/resultService';

const GRADE_COLORS = { A1: 'success', B2: 'success', B3: 'success', C4: 'primary', C5: 'primary', C6: 'primary', D7: 'warning', E8: 'warning', F9: 'danger' };

const ParentResults = () => {
  const { studentId } = useParams();
  const [results, setResults] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState('');

  useEffect(() => {
    getParentResults(studentId)
      .then(({ data }) => {
        setResults(data.results || []);
        setStudent(data.student);
        if (data.results?.length > 0) setSelectedTerm(data.results[0].term);
      })
      .catch(() => toast.error('Failed to load results'))
      .finally(() => setLoading(false));
  }, [studentId]);

  const selected = results.find(r => r.term === selectedTerm);
  const terms = [...new Set(results.map(r => r.term))];

  if (loading) return <div className="container mt-4"><div className="spinner-border" /></div>;

  return (
    <div className="container mt-4" style={{ maxWidth: 800 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="fw-bold mb-0">{student?.firstName} {student?.lastName}</h4>
          <small className="text-muted">{student?.class?.name} {student?.class?.arm}</small>
        </div>
        <Link to="/parent" className="btn btn-outline-secondary btn-sm">Back</Link>
      </div>

      {terms.length > 0 && (
        <ul className="nav nav-tabs mb-3">
          {terms.map(t => (
            <li key={t} className="nav-item">
              <button className={`nav-link ${selectedTerm === t ? 'active' : ''}`} onClick={() => setSelectedTerm(t)}>{t}</button>
            </li>
          ))}
        </ul>
      )}

      {selected ? (
        <div className="card p-4">
          <div className="row mb-3">
            <div className="col"><strong>Term:</strong> {selected.term}</div>
            <div className="col"><strong>Session:</strong> {selected.session}</div>
            <div className="col"><strong>Position:</strong> {selected.positionInClass || '—'}</div>
            <div className="col"><strong>Overall:</strong> <span className="text-primary fw-bold">{selected.overallPercentage}%</span></div>
          </div>
          <table className="table table-bordered table-sm">
            <thead className="table-light"><tr><th>Subject</th><th>CA (30)</th><th>Exam (70)</th><th>Total</th><th>Grade</th></tr></thead>
            <tbody>
              {selected.subjects?.map((s, i) => (
                <tr key={i}>
                  <td>{s.subject?.name || s.subjectName}</td>
                  <td>{s.caScore}</td>
                  <td>{s.examScore}</td>
                  <td><strong>{s.totalScore}</strong></td>
                  <td><span className={`badge bg-${GRADE_COLORS[s.grade] || 'secondary'}`}>{s.grade}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {selected.classTeacherComment && (
            <div className="mt-3">
              <strong>Class Teacher:</strong>
              <p className="fst-italic mt-1">{selected.classTeacherComment}</p>
            </div>
          )}
          {selected.principalComment && (
            <div>
              <strong>Principal:</strong>
              <p className="fst-italic mt-1">{selected.principalComment}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-5 text-muted">No results available</div>
      )}
    </div>
  );
};

export default ParentResults;
