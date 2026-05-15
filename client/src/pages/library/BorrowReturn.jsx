import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import './Library.css';

const BorrowReturn = () => {
  const [books, setBooks] = useState([]);
  const [activeBorrows, setActiveBorrows] = useState([]);
  const [loadingBorrows, setLoadingBorrows] = useState(true);

  const [issueForm, setIssueForm] = useState({ studentId: '', bookId: '', dueDate: '' });
  const [returnId, setReturnId] = useState('');
  const [submittingIssue, setSubmittingIssue] = useState(false);
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const fetchData = () => {
    setLoadingBorrows(true);
    Promise.all([
      axios.get('/api/library'),
      axios.get('/api/library/borrows'),
    ])
      .then(([booksRes, borrowsRes]) => {
        setBooks(booksRes.data || []);
        setActiveBorrows(borrowsRes.data || []);
      })
      .catch(() => toast.error('Failed to load library data'))
      .finally(() => setLoadingBorrows(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleIssue = async (e) => {
    e.preventDefault();
    if (!issueForm.studentId || !issueForm.bookId) {
      toast.error('Student ID and book are required');
      return;
    }
    setSubmittingIssue(true);
    try {
      await axios.post('/api/library/borrow', issueForm);
      toast.success('Book issued successfully');
      setIssueForm({ studentId: '', bookId: '', dueDate: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to issue book');
    } finally {
      setSubmittingIssue(false);
    }
  };

  const handleReturn = async (e) => {
    e.preventDefault();
    if (!returnId) { toast.error('Borrow ID is required'); return; }
    setSubmittingReturn(true);
    try {
      await axios.post(`/api/library/return/${returnId}`);
      toast.success('Book returned successfully');
      setReturnId('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process return');
    } finally {
      setSubmittingReturn(false);
    }
  };

  return (
    <div className="library-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem' }}>
        <div>
          <h1 style={{ fontSize: '3.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.8rem' }}>Borrow &amp; Return</h1>
          <p style={{ fontSize: '1.6rem', color: '#64748b' }}>Issue books to students and process returns</p>
        </div>
        <Link to="/library" className="btn-secondary-outline" style={{ padding: '1.2rem 2.5rem' }}>
          ← Library
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '4rem' }}>

        {/* Issue Book */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '3rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '3rem' }}>
            <div style={{ width: 36, height: 36, background: '#ede9fa', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>📤</div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Issue Book</h2>
          </div>
          <form onSubmit={handleIssue}>
            <div className="form-group-premium" style={{ marginBottom: '2rem', position: 'relative' }}>
              <label>Student ID</label>
              <input
                type="text"
                placeholder="Paste student ID"
                value={issueForm.studentId}
                onChange={(e) => setIssueForm({ ...issueForm, studentId: e.target.value })}
              />
            </div>
            <div className="form-group-premium" style={{ marginBottom: '2rem', position: 'relative' }}>
              <label>Book</label>
              <select
                value={issueForm.bookId}
                onChange={(e) => setIssueForm({ ...issueForm, bookId: e.target.value })}
              >
                <option value="">— Select Book —</option>
                {books.filter((b) => b.available > 0).map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.title} ({b.available} available)
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group-premium" style={{ marginBottom: '3rem', position: 'relative' }}>
              <label>Due Date</label>
              <input
                type="date"
                value={issueForm.dueDate}
                onChange={(e) => setIssueForm({ ...issueForm, dueDate: e.target.value })}
              />
            </div>
            <button
              type="submit"
              className="btn-primary-green"
              style={{ width: '100%', padding: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}
              disabled={submittingIssue}
            >
              {submittingIssue ? <><div className="spinner-border spinner-border-sm" /> Issuing...</> : '📤 Issue Book'}
            </button>
          </form>
        </div>

        {/* Return Book */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '3rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '3rem' }}>
            <div style={{ width: 36, height: 36, background: '#dbeafe', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>📥</div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Return Book</h2>
          </div>
          <form onSubmit={handleReturn}>
            <div className="form-group-premium" style={{ marginBottom: '3rem', position: 'relative' }}>
              <label>Borrow Record ID</label>
              <input
                type="text"
                placeholder="Paste borrow record ID"
                value={returnId}
                onChange={(e) => setReturnId(e.target.value)}
              />
              <span style={{ fontSize: '1.3rem', color: '#94a3b8', display: 'block', marginTop: '0.8rem' }}>
                Find the borrow ID in the Active Borrows table below.
              </span>
            </div>
            <button
              type="submit"
              className="btn-secondary-outline"
              style={{ width: '100%', padding: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}
              disabled={submittingReturn}
            >
              {submittingReturn ? <><div className="spinner-border spinner-border-sm" /> Processing...</> : '📥 Process Return'}
            </button>
          </form>
        </div>
      </div>

      {/* Active Borrows */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '2rem 2.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Active Borrows</h3>
          <span style={{ fontSize: '1.3rem', color: '#64748b' }}>{activeBorrows.length} records</span>
        </div>
        {loadingBorrows ? (
          <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary" /></div>
        ) : activeBorrows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8', fontSize: '1.5rem' }}>No active borrows</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th style={{ padding: '1.5rem', fontSize: '1.3rem', fontWeight: 700 }}>Borrow ID</th>
                  <th style={{ fontSize: '1.3rem', fontWeight: 700 }}>Book</th>
                  <th style={{ fontSize: '1.3rem', fontWeight: 700 }}>Borrower</th>
                  <th style={{ fontSize: '1.3rem', fontWeight: 700 }}>Issued</th>
                  <th style={{ fontSize: '1.3rem', fontWeight: 700 }}>Due</th>
                  <th style={{ fontSize: '1.3rem', fontWeight: 700 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {activeBorrows.map((b) => {
                  const overdue = b.dueDate && new Date(b.dueDate) < new Date();
                  return (
                    <tr key={b._id}>
                      <td style={{ padding: '1.5rem', fontSize: '1.2rem', fontFamily: 'monospace', color: '#64748b' }}>
                        {b._id?.slice(-8)}
                      </td>
                      <td style={{ fontSize: '1.4rem', fontWeight: 600 }}>{b.book?.title || '—'}</td>
                      <td style={{ fontSize: '1.4rem' }}>{b.borrowedBy?.name || b.borrowedBy || '—'}</td>
                      <td style={{ fontSize: '1.4rem' }}>{b.borrowedAt ? new Date(b.borrowedAt).toLocaleDateString('en-NG') : '—'}</td>
                      <td style={{ fontSize: '1.4rem', color: overdue ? '#dc2626' : 'inherit', fontWeight: overdue ? 700 : 400 }}>
                        {b.dueDate ? new Date(b.dueDate).toLocaleDateString('en-NG') : '—'}
                        {overdue && ' ⚠️'}
                      </td>
                      <td>
                        <span style={{
                          padding: '0.4rem 1.2rem',
                          borderRadius: 20,
                          fontSize: '1.2rem',
                          fontWeight: 700,
                          background: overdue ? '#fee2e2' : '#ede9fa',
                          color: overdue ? '#991b1b' : '#2d2460',
                        }}>
                          {overdue ? 'Overdue' : 'Active'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BorrowReturn;
