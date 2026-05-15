import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getRecentTransactions, recordPayment, getFeeDefaulters } from '../../services/feeService';
import './Fees.css';
import '../students/Students.css';

const FeeCollection = () => {
  const [transactions, setTransactions] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ paymentId: '', amount: '', method: 'cash', transactionRef: '' });

  const load = () => {
    setLoading(true);
    Promise.all([getRecentTransactions(), getFeeDefaulters()])
      .then(([txRes, defRes]) => {
        setTransactions(txRes.data || []);
        setPendingPayments(defRes.data || []);
      })
      .catch(() => toast.error('Failed to load collection data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.paymentId || !form.amount) {
      toast.error('Select a payment record and enter amount');
      return;
    }
    setSubmitting(true);
    try {
      await recordPayment({
        paymentId: form.paymentId,
        amount: Number(form.amount),
        method: form.method,
        transactionRef: form.transactionRef,
      });
      toast.success('Payment recorded');
      setForm({ paymentId: '', amount: '', method: 'cash', transactionRef: '' });
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const studentLabel = (p) => {
    const s = p.student;
    if (!s) return 'Student';
    return `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student';
  };

  return (
    <div className="fees-container">
      <div style={{ marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '3.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.8rem' }}>Fee Collection</h1>
        <p style={{ fontSize: '1.6rem', color: '#64748b' }}>Record tuition payments and view recent transactions.</p>
      </div>

      <div className="collection-record-card">
        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '2rem' }}>Record New Payment</h2>
        <form onSubmit={handleSubmit}>
          <div className="payment-form-grid">
            <div className="form-group-premium">
              <label>Outstanding payment *</label>
              <select required value={form.paymentId} onChange={e => {
                const p = pendingPayments.find(x => x._id === e.target.value);
                setForm(f => ({ ...f, paymentId: e.target.value, amount: p?.balance?.toString() || f.amount }));
              }}>
                <option value="">Select payment record</option>
                {pendingPayments.map(p => (
                  <option key={p._id} value={p._id}>
                    {studentLabel(p)} — {p.fee?.title || 'Fee'} (₦{(p.balance ?? 0).toLocaleString()} due)
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group-premium">
              <label>Amount (₦) *</label>
              <input type="number" required min="1" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div className="form-group-premium">
              <label>Payment Method</label>
              <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="pos">POS</option>
              </select>
            </div>
            <div className="form-group-premium">
              <label>Transaction Reference</label>
              <input type="text" value={form.transactionRef} onChange={e => setForm(f => ({ ...f, transactionRef: e.target.value }))} placeholder="TXN-123456" />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" disabled={submitting} className="btn-primary-green" style={{ width: '100%', padding: '1.4rem', background: '#6A5ACD' }}>
                {submitting ? 'Processing…' : 'Process Payment'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="exam-list-card" style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '2rem' }}>Recent Transactions</h2>
        {loading ? (
          <p style={{ color: '#64748b' }}>Loading…</p>
        ) : transactions.length === 0 ? (
          <p style={{ color: '#64748b' }}>No transactions yet.</p>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Fee</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t._id}>
                  <td>{studentLabel(t)}</td>
                  <td>{t.fee?.title || '—'}</td>
                  <td>₦{(t.amountPaid ?? 0).toLocaleString()}</td>
                  <td>₦{(t.balance ?? 0).toLocaleString()}</td>
                  <td><span className={`status-pill-${t.status === 'paid' ? 'paid' : 'partial'}`}>{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default FeeCollection;
