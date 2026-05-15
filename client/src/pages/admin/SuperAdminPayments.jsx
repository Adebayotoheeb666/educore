import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getPlatformPaymentTransactions } from '../../services/paymentService';
import './SuperAdmin.css';

const formatNaira = (n) => `₦${Number(n || 0).toLocaleString()}`;

const TYPE_LABELS = {
  school_fee: 'School fee',
  platform_subscription: 'Subscription',
};

const SuperAdminPayments = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    getPlatformPaymentTransactions({
      page,
      limit: 25,
      type: type || undefined,
      status: status || undefined,
    })
      .then(setData)
      .catch(() => toast.error('Failed to load payments'))
      .finally(() => setLoading(false));
  }, [page, type, status]);

  useEffect(() => {
    load();
  }, [load]);

  const revenue = data?.revenue || {};

  return (
    <div className="super-admin-page">
      <div className="sa-welcome-row">
        <div>
          <h2>Platform payments</h2>
          <p>All Flutterwave transactions — school fees and subscriptions</p>
        </div>
      </div>

      <section className="sa-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="sa-stat-card">
          <p className="sa-stat-label">Total revenue</p>
          <p className="sa-stat-value" style={{ fontSize: '1.5rem' }}>{formatNaira(revenue.totalRevenue)}</p>
        </div>
        <div className="sa-stat-card">
          <p className="sa-stat-label">School fees (online)</p>
          <p className="sa-stat-value" style={{ fontSize: '1.5rem' }}>{formatNaira(revenue.schoolFeesCollected)}</p>
          <p className="sa-stat-sub">{revenue.schoolFeesCount || 0} transactions</p>
        </div>
        <div className="sa-stat-card">
          <p className="sa-stat-label">Subscriptions</p>
          <p className="sa-stat-value" style={{ fontSize: '1.5rem' }}>{formatNaira(revenue.subscriptionRevenue)}</p>
          <p className="sa-stat-sub">{revenue.subscriptionCount || 0} transactions</p>
        </div>
      </section>

      <section className="sa-panel sa-blog-toolbar">
        <div className="sa-blog-filters">
          <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="sa-blog-select">
            <option value="">All types</option>
            <option value="school_fee">School fees</option>
            <option value="platform_subscription">Subscriptions</option>
          </select>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="sa-blog-select">
            <option value="">All statuses</option>
            <option value="successful">Successful</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </section>

      <section className="sa-panel sa-blog-table-wrap">
        {loading ? (
          <div className="d-flex justify-content-center py-5">
            <div className="spinner-border text-primary" />
          </div>
        ) : !data?.transactions?.length ? (
          <p className="sa-empty">No transactions found.</p>
        ) : (
          <div className="sa-blog-table-scroll">
            <table className="sa-blog-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Type</th>
                  <th>School</th>
                  <th>Payer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((t) => (
                  <tr key={t._id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{t.txRef}</td>
                    <td>{TYPE_LABELS[t.type] || t.type}</td>
                    <td>{t.school?.name || '—'}</td>
                    <td>{t.payer?.name || t.payer?.email || '—'}</td>
                    <td><strong>{formatNaira(t.amount)}</strong></td>
                    <td>
                      <span className={`sa-blog-status ${t.status === 'successful' ? 'published' : 'draft'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td>{new Date(t.createdAt).toLocaleDateString('en-NG')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data?.totalPages > 1 && (
          <div className="sa-blog-pagination">
            <button type="button" className="sa-btn-outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
            <span className="sa-list-meta">Page {page} of {data.totalPages}</span>
            <button type="button" className="sa-btn-outline" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        )}
      </section>
    </div>
  );
};

export default SuperAdminPayments;
