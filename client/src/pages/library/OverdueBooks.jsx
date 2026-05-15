import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getOverdueBooks } from '../../services/libraryService';
import './Library.css';
import '../students/Students.css';

const OverdueBooks = () => {
  const [overdue, setOverdue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOverdueBooks()
      .then(({ data }) => setOverdue(data || []))
      .catch(() => toast.error('Failed to load overdue books'))
      .finally(() => setLoading(false));
  }, []);

  const borrowerName = (b) => {
    const u = b.borrowedBy;
    if (!u) return '—';
    return u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Student';
  };

  return (
    <div className="library-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem' }}>
        <div>
          <h1 style={{ fontSize: '3.6rem', fontWeight: 800 }}>Overdue Borrows</h1>
          <p style={{ fontSize: '1.6rem', color: '#64748b' }}>{overdue.length} overdue record(s)</p>
        </div>
        <Link to="/library" className="btn-secondary-outline" style={{ padding: '1.2rem 2.5rem' }}>← Library</Link>
      </div>

      <div className="exam-list-card">
        {loading ? (
          <p style={{ padding: '2rem', color: '#64748b' }}>Loading…</p>
        ) : overdue.length === 0 ? (
          <p style={{ padding: '2rem', color: '#64748b' }}>No overdue books.</p>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Borrower</th>
                <th>Due Date</th>
                <th>Days Overdue</th>
              </tr>
            </thead>
            <tbody>
              {overdue.map(b => (
                <tr key={b._id}>
                  <td>{b.book?.title || b.bookTitle || '—'}</td>
                  <td>{borrowerName(b)}</td>
                  <td>{b.dueDate ? new Date(b.dueDate).toLocaleDateString() : '—'}</td>
                  <td style={{ color: '#b91c1c', fontWeight: 800 }}>
                    {b.dueDate ? Math.max(0, Math.ceil((Date.now() - new Date(b.dueDate)) / 86400000)) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default OverdueBooks;
