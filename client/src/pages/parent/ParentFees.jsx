import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { getStudentStatement } from '../../services/feeService';
import FlutterwavePayButton from '../../components/payments/FlutterwavePayButton';
import './Parent.css';

const statusLabel = (status) => {
  if (status === 'paid') return 'Paid';
  if (status === 'partial') return 'Partial';
  return 'Pending';
};

const ParentFees = () => {
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [statement, setStatement] = useState(null);

  useEffect(() => {
    axios.get('/api/analytics/parent-dashboard')
      .then(({ data }) => {
        const list = data.children || [];
        setChildren(list);
        if (list.length > 0) setSelectedChildId(list[0].id);
      })
      .catch(() => toast.error('Failed to load children'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedChildId) return;
    setLoading(true);
    getStudentStatement(selectedChildId)
      .then(({ data }) => setStatement(data))
      .catch(() => {
        setStatement(null);
        toast.error('Failed to load fee statement');
      })
      .finally(() => setLoading(false));
  }, [selectedChildId]);

  if (loading && !statement) {
    return (
      <div className="parent-dashboard-container d-flex justify-content-center align-items-center">
        <div className="spinner-border text-success" />
      </div>
    );
  }

  const student = statement?.student;
  const payments = statement?.transactions || [];
  const paidPct = statement?.totalInvoiced
    ? Math.round((statement.totalPaid / statement.totalInvoiced) * 100)
    : 0;

  return (
    <div className="parent-dashboard-container">
      <header className="ann-page-header">
        <div className="ann-header-left">
          {children.length > 1 && (
            <div className="attendance-select-wrap" style={{ marginBottom: '1rem', maxWidth: 320 }}>
              <label>Select child</label>
              <select
                className="attendance-select"
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
              >
                {children.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          {student && (
            <div className="d-flex align-items-center gap-3">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || 'Student')}&background=6A5ACD&color=fff`}
                alt=""
                style={{ width: 60, height: 60, borderRadius: '12px' }}
              />
              <div>
                <h1 style={{ margin: 0 }}>{student.name}</h1>
                <p style={{ margin: 0 }}>
                  {student.admissionNumber ? `Student ID: ${student.admissionNumber}` : 'Fee statement'}
                  {student.className && (
                    <span style={{ background: '#FFD700', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, verticalAlign: 'middle', marginLeft: '0.5rem' }}>
                      {student.className}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
        <button type="button" className="btn-catalog-action" style={{ background: 'white', border: '1px solid #e2e8f0', padding: '0.8rem 1.5rem' }} onClick={() => window.print()}>
          📥 Statement
        </button>
      </header>

      {statement?.outstandingDue && statement.outstandingDue.amount > 0 && (
        <div className="child-card-premium" style={{ background: '#fee2e2', border: '1px solid #fecaca', marginBottom: '3rem', padding: '1.5rem 2.5rem' }}>
          <div className="d-flex align-items-center gap-4 w-100">
            <div style={{ width: 50, height: 50, background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>⚠️</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#991b1b', margin: 0 }}>Outstanding Balance</h3>
              <p style={{ margin: 0, color: '#991b1b', fontWeight: 600 }}>Please settle the remaining amount for the current term.</p>
            </div>
            <div className="text-end" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#991b1b', margin: 0 }}>
                  ₦{statement.balance.toLocaleString()}
                </h2>
                {statement.outstandingDue.dueDate && (
                  <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 800, color: '#991b1b' }}>
                    DUE BY {new Date(statement.outstandingDue.dueDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
                  </p>
                )}
              </div>
              {statement.outstandingDue.paymentId && (
                <FlutterwavePayButton
                  paymentId={statement.outstandingDue.paymentId}
                  amount={statement.outstandingDue.amount}
                  label="Pay online with Flutterwave"
                  style={{ background: '#6A5ACD', color: '#fff', padding: '0.9rem 1.5rem', borderRadius: 12, border: 'none', fontWeight: 800, cursor: 'pointer' }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      <div className="snapshots-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="snapshot-card-premium">
          <span className="snapshot-label">Total Invoiced</span>
          <h2 className="snapshot-val">₦{(statement?.totalInvoiced ?? 0).toLocaleString()}</h2>
        </div>
        <div className="snapshot-card-premium">
          <span className="snapshot-label">Total Paid</span>
          <h2 className="snapshot-val">₦{(statement?.totalPaid ?? 0).toLocaleString()}</h2>
          <div className="perf-bar-bg" style={{ height: '6px', marginTop: '1rem' }}>
            <div className="perf-bar-fill" style={{ width: `${paidPct}%`, background: '#6A5ACD' }} />
          </div>
        </div>
        <div className="snapshot-card-premium">
          <span className="snapshot-label">Last Payment</span>
          <h2 className="snapshot-val">₦{(statement?.lastPaymentAmount ?? 0).toLocaleString()}</h2>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8' }}>
            {statement?.lastPaymentDate
              ? new Date(statement.lastPaymentDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
              : '—'}
          </span>
        </div>
      </div>

      <div className="catalog-table-card" style={{ padding: 0 }}>
        <div className="table-header-custom" style={{ padding: '2rem 2.5rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Detailed Fee Statement</h3>
        </div>
        <div className="table-responsive">
          <table className="curriculum-table">
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th style={{ padding: '1rem 2.5rem' }}>Fee Description</th>
                <th>Term</th>
                <th>Amount</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Pay</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No fee records for this student.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p._id}>
                    <td style={{ padding: '1.5rem 2.5rem', fontWeight: 800 }}>{p.fee?.title || 'Fee'}</td>
                    <td style={{ fontWeight: 700, color: '#475569' }}>{p.fee?.term || '—'}</td>
                    <td style={{ fontWeight: 800 }}>₦{(p.amountDue ?? 0).toLocaleString()}</td>
                    <td style={{ fontWeight: 800, color: '#5849b8' }}>₦{(p.amountPaid ?? 0).toLocaleString()}</td>
                    <td style={{ fontWeight: 800, color: p.balance > 0 ? '#ef4444' : '#0f172a' }}>₦{(p.balance ?? 0).toLocaleString()}</td>
                    <td>
                      <span className="status-cell-pill" style={{ background: p.status === 'paid' ? '#ede9fa' : '#fef3c7', color: p.status === 'paid' ? '#2d2460' : '#b8860b' }}>
                        {statusLabel(p.status)}
                      </span>
                    </td>
                    <td>
                      {p.balance > 0 ? (
                        <FlutterwavePayButton
                          paymentId={p._id}
                          amount={p.balance}
                          label="Pay"
                          className="btn-catalog-action"
                          style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', background: '#6A5ACD', color: '#fff', border: 'none', borderRadius: 8 }}
                        />
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="ann-footer-main" style={{ background: '#f8fafc', margin: '5rem -4rem -3rem', padding: '2.5rem 8rem' }}>
        <div className="footer-left-content">
          <span className="footer-brand">EduCore AI</span> • © {new Date().getFullYear()} EduCore AI. Empowering Nigerian Education.
        </div>
        <div className="footer-links">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/support">Support Center</Link>
          <Link to="/contact">Contact Us</Link>
        </div>
      </footer>
    </div>
  );
};

export default ParentFees;
