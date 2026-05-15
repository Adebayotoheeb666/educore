import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFeeAnalytics } from '../../services/analyticsService';
import { getRecentTransactions, getFeeDefaulters } from '../../services/feeService';

const BursarDashboard = ({ user }) => {
  const displayName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Bursar';
  const [loading, setLoading] = useState(true);
  const [feeStats, setFeeStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [defaulters, setDefaulters] = useState([]);

  useEffect(() => {
    Promise.all([getFeeAnalytics(), getRecentTransactions(), getFeeDefaulters()])
      .then(([feeRes, txRes, defRes]) => {
        setFeeStats(feeRes.data);
        setTransactions((txRes.data || []).slice(0, 5));
        setDefaulters((defRes.data || []).slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatNaira = (n) => `₦${Number(n || 0).toLocaleString()}`;

  return (
    <div className="container-fluid" style={{ padding: '4rem' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
          Finance — {displayName}
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Fee collection overview and recent activity.</p>
      </header>

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-success" />
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>COLLECTED</span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem' }}>{formatNaira(feeStats?.paid)}</h2>
            </div>
            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>PENDING</span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem' }}>{formatNaira(feeStats?.pending)}</h2>
            </div>
            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>COLLECTION RATE</span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem' }}>{feeStats?.percent ?? 0}%</h2>
            </div>
            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>DEFAULTERS</span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem' }}>{defaulters.length}</h2>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontWeight: 800, margin: 0 }}>Recent Transactions</h3>
                <Link to="/fees/collection" style={{ fontWeight: 700, color: '#5849b8' }}>View all</Link>
              </div>
              {transactions.length === 0 ? (
                <p style={{ color: '#64748b' }}>No recent payments.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {transactions.map((tx, i) => (
                    <li key={tx._id || i} style={{ padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' }}>
                      <strong>{tx.student?.firstName} {tx.student?.lastName}</strong>
                      <span style={{ float: 'right' }}>{formatNaira(tx.amountPaid)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontWeight: 800, margin: 0 }}>Fee Defaulters</h3>
                <Link to="/fees/defaulters" style={{ fontWeight: 700, color: '#5849b8' }}>View all</Link>
              </div>
              {defaulters.length === 0 ? (
                <p style={{ color: '#64748b' }}>No outstanding defaulters.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {defaulters.map((p, i) => (
                    <li key={p._id || i} style={{ padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' }}>
                      <strong>{p.student?.firstName} {p.student?.lastName}</strong>
                      <span style={{ float: 'right', color: '#b45309' }}>{formatNaira(p.balance)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/fees/collection" className="btn-new-ann" style={{ background: '#5849b8', textDecoration: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', color: 'white', fontWeight: 700 }}>
              Record Payment
            </Link>
            <Link to="/fees/schedules" className="btn-catalog-action" style={{ textDecoration: 'none', padding: '0.8rem 1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              Fee Schedules
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default BursarDashboard;
