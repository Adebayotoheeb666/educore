import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import { getStudentStatement } from '../../services/feeService';
import './Fees.css';

const ADMIN_ROLES = ['principal', 'school_owner', 'vp_admin', 'admin_staff', 'bursar'];

const METHOD_ICONS = { cash: '💵', bank_transfer: '🏦', paystack: '💳', flutterwave: '💳', pos: '🖨️' };

const STATUS_STYLE = {
  paid:    { bg: '#ede9fa', color: '#2d2460' },
  partial: { bg: '#fef9c3', color: '#854d0e' },
  unpaid:  { bg: '#fee2e2', color: '#991b1b' },
};

const PaymentHistory = () => {
  const { user } = useSelector((s) => s.auth);
  const isAdmin = ADMIN_ROLES.includes(user?.role);

  const [studentId, setStudentId] = useState(
    ['student', 'parent'].includes(user?.role) ? user.id : ''
  );
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const fetchStatement = (id) => {
    if (!id) return;
    setLoading(true);
    setSearched(true);
    getStudentStatement(id)
      .then(({ data }) => setStatement(data || null))
      .catch(() => toast.error('Failed to load payment statement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isAdmin && user?.id) fetchStatement(user.id);
  }, []);

  const handlePrint = () => window.print();

  const transactions = statement?.transactions || [];
  const totalPaid = statement?.totalPaid ?? transactions.reduce((s, t) => s + (t.amountPaid || 0), 0);
  const totalDue  = statement?.totalInvoiced ?? transactions.reduce((s, t) => s + (t.amountDue  || 0), 0);
  const balance   = statement?.balance ?? (totalDue - totalPaid);

  return (
    <div className="fees-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem' }}>
        <div>
          <h1 style={{ fontSize: '3.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.8rem' }}>Payment History</h1>
          <p style={{ fontSize: '1.6rem', color: '#64748b' }}>
            {isAdmin ? 'View a student\'s complete fee payment statement' : 'Your fee payment statement'}
          </p>
        </div>
        {statement && (
          <button onClick={handlePrint} className="btn-secondary-outline" style={{ padding: '1.2rem 2.5rem' }}>
            🖨️ Print Statement
          </button>
        )}
      </div>

      {isAdmin && (
        <form onSubmit={(e) => { e.preventDefault(); fetchStatement(studentId); }}
          style={{ display: 'flex', gap: '1.5rem', marginBottom: '4rem', alignItems: 'flex-end' }}>
          <div className="form-group-premium" style={{ flex: 1, position: 'relative' }}>
            <label>Student ID</label>
            <input
              type="text"
              placeholder="Paste student ID"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary-green" style={{ padding: '1.3rem 3rem', height: 'fit-content' }}>
            Load Statement
          </button>
        </form>
      )}

      {loading && (
        <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary" /></div>
      )}

      {!loading && statement && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginBottom: '4rem' }}>
            {[
              { label: 'Total Billed',   value: `₦${totalDue.toLocaleString()}`,  icon: '📋', color: 'blue' },
              { label: 'Total Paid',     value: `₦${totalPaid.toLocaleString()}`, icon: '✅', color: 'green' },
              { label: 'Outstanding',    value: `₦${balance.toLocaleString()}`,   icon: balance > 0 ? '⚠️' : '🎉', color: balance > 0 ? 'amber' : 'green' },
            ].map((s) => (
              <div key={s.label} className="stat-card-premium">
                <div className="stat-info">
                  <h4>{s.label}</h4>
                  <p>{s.value}</p>
                </div>
                <div className={`stat-icon-box ${s.color}`}>{s.icon}</div>
              </div>
            ))}
          </div>

          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8', fontSize: '1.5rem' }}>
              No payment transactions recorded yet.
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '2rem 2.5rem', borderBottom: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Transaction History</h3>
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead style={{ background: '#f8fafc' }}>
                    <tr>
                      <th style={{ padding: '1.5rem', fontSize: '1.3rem', fontWeight: 700 }}>Date</th>
                      <th style={{ fontSize: '1.3rem', fontWeight: 700 }}>Fee</th>
                      <th style={{ fontSize: '1.3rem', fontWeight: 700 }}>Amount Due</th>
                      <th style={{ fontSize: '1.3rem', fontWeight: 700 }}>Amount Paid</th>
                      <th style={{ fontSize: '1.3rem', fontWeight: 700 }}>Method</th>
                      <th style={{ fontSize: '1.3rem', fontWeight: 700 }}>Reference</th>
                      <th style={{ fontSize: '1.3rem', fontWeight: 700 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t, i) => {
                      const s = STATUS_STYLE[t.status] || STATUS_STYLE.unpaid;
                      return (
                        <tr key={t._id || i}>
                          <td style={{ padding: '1.5rem', fontSize: '1.4rem' }}>
                            {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          <td style={{ fontSize: '1.4rem', fontWeight: 600 }}>{t.fee?.title || '—'}</td>
                          <td style={{ fontSize: '1.4rem' }}>₦{(t.amountDue || 0).toLocaleString()}</td>
                          <td style={{ fontSize: '1.4rem', fontWeight: 700, color: '#6A5ACD' }}>₦{(t.amountPaid || 0).toLocaleString()}</td>
                          <td style={{ fontSize: '1.4rem' }}>
                            {METHOD_ICONS[t.method] || '💰'} {t.method?.replace(/_/g, ' ') || '—'}
                          </td>
                          <td style={{ fontSize: '1.2rem', fontFamily: 'monospace', color: '#64748b' }}>
                            {t.transactionRef || '—'}
                          </td>
                          <td>
                            <span style={{ padding: '0.4rem 1.2rem', borderRadius: 20, fontSize: '1.2rem', fontWeight: 700, background: s.bg, color: s.color }}>
                              {t.status || 'unpaid'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!loading && searched && !statement && (
        <div style={{ textAlign: 'center', padding: '6rem 2rem' }}>
          <span style={{ fontSize: '4rem' }}>🔍</span>
          <p style={{ fontSize: '1.6rem', color: '#64748b', marginTop: '1.5rem' }}>No statement found for this student.</p>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
