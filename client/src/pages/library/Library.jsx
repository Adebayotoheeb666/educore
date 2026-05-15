import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getBooks, addBook } from '../../services/libraryService';
import { useClientPagination } from '../../hooks/useClientPagination';
import ListPagination from '../../components/pagination/ListPagination';
import './Library.css';
import '../teachers/Teachers.css';

const Library = () => {
  const [activeTab, setActiveTab] = useState('Inventory');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ title: '', author: '', isbn: '', subject: '', quantity: 1 });

  const loadBooks = () => {
    setLoading(true);
    getBooks()
      .then(({ data }) => setBooks(data || []))
      .catch(() => toast.error('Failed to load books'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadBooks(); }, []);

  const {
    paginatedItems: paginatedBooks,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    rangeStart,
    rangeEnd,
  } = useClientPagination(books, 10);

  const handleAddBook = async (e) => {
    e.preventDefault();
    if (!form.title?.trim()) { toast.error('Title is required'); return; }
    setSubmitting(true);
    try {
      await addBook(form);
      toast.success('Book registered');
      setForm({ title: '', author: '', isbn: '', subject: '', quantity: 1 });
      setShowAddForm(false);
      loadBooks();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to add book');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="library-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '3.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Library Management</h1>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-secondary-outline"
            style={{ padding: '1.2rem 2rem' }}
            onClick={() => setShowAddForm((v) => !v)}
          >
            {showAddForm ? 'Hide form' : '➕ Add New Book'}
          </button>
          <Link to="/library/overdue" className="btn-secondary-outline" style={{ padding: '1.2rem 2rem', textDecoration: 'none' }}>
            Overdue
          </Link>
          <Link
            to="/library/borrow-return"
            className="btn-primary-green"
            style={{ background: '#6A5ACD', padding: '1.2rem 3rem', textDecoration: 'none', color: '#fff' }}
          >
            Borrow / Return
          </Link>
        </div>
      </div>

      {showAddForm && (
        <div className="add-book-card library-add-book-standalone" style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ width: 36, height: 36, background: '#ede9fa', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2d2460', fontSize: '1.6rem' }}>📚</div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0 }}>Add New Book</h2>
          </div>
          <form onSubmit={handleAddBook}>
            <div className="form-group-premium" style={{ marginBottom: '2rem' }}>
              <label>Book Title *</label>
              <input type="text" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
              <div className="form-group-premium">
                <label>Author</label>
                <input type="text" value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} />
              </div>
              <div className="form-group-premium">
                <label>Subject</label>
                <input type="text" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
              </div>
              <div className="form-group-premium">
                <label>ISBN-13</label>
                <input type="text" value={form.isbn} onChange={(e) => setForm((f) => ({ ...f, isbn: e.target.value }))} />
              </div>
              <div className="form-group-premium">
                <label>Number of Copies</label>
                <input type="number" min="1" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))} />
              </div>
            </div>
            <button type="submit" disabled={submitting} className="btn-primary-green" style={{ padding: '1.2rem 2.5rem', background: '#6A5ACD', borderRadius: 12, fontSize: '1.1rem', fontWeight: 800 }}>
              {submitting ? 'Saving…' : 'Register Book'}
            </button>
          </form>
        </div>
      )}

      <div className="lib-nav-tabs">
        <div className={`lib-tab ${activeTab === 'Inventory' ? 'active' : ''}`} onClick={() => setActiveTab('Inventory')}>Books Inventory</div>
        <div className={`lib-tab ${activeTab === 'Borrows' ? 'active' : ''}`} onClick={() => setActiveTab('Borrows')}>Active Borrows</div>
        <div className={`lib-tab ${activeTab === 'Analytics' ? 'active' : ''}`} onClick={() => setActiveTab('Analytics')}>Library Analytics</div>
      </div>

      <section className="library-inventory-standalone">
        <div className="inv-stats-grid">
          <div className="inv-stat-box">
            <h4>Total Titles</h4>
            <p>{books.length}</p>
          </div>
          <div className="inv-stat-box green">
            <h4>Available Copies</h4>
            <p>{books.reduce((s, b) => s + (b.available || 0), 0)}</p>
          </div>
          <div className="inv-stat-box red">
            <h4>Out of Stock</h4>
            <p>{books.filter((b) => (b.available || 0) === 0).length}</p>
          </div>
        </div>

        <div className="exam-list-card library-inventory-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 800, margin: 0 }}>Inventory List</h2>
          </div>

          <table className="premium-table">
            <thead>
              <tr>
                <th>Book Title</th>
                <th>Author</th>
                <th>ISBN</th>
                <th>Status</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading…</td></tr>
              ) : books.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No books in inventory.</td></tr>
              ) : (
                paginatedBooks.map((b) => (
                  <tr key={b._id}>
                    <td><strong>{b.title}</strong></td>
                    <td>{b.author || '—'}</td>
                    <td>{b.isbn || '—'}</td>
                    <td>
                      <span className={`status-label-lib ${b.available > 0 ? 'available' : 'borrowed'}`}>
                        {b.available > 0 ? 'Available' : 'Out'}
                      </span>
                    </td>
                    <td>{b.available} / {b.quantity}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {!loading && totalItems > 0 && (
            <ListPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              onPageChange={setCurrentPage}
              itemLabel="books"
            />
          )}
        </div>
      </section>
    </div>
  );
};

export default Library;
