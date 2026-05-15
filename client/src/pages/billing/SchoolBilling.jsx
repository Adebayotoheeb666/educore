import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  getSubscriptionPlans,
  initializeSubscriptionPayment,
  getSchoolPaymentTransactions,
} from '../../services/paymentService';
import '../admin/SuperAdmin.css';

const formatNaira = (n) => `₦${Number(n || 0).toLocaleString()}`;

const SchoolBilling = () => {
  const [plansData, setPlansData] = useState(null);
  const [billingCycle, setBillingCycle] = useState('yearly');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingPlan, setPayingPlan] = useState(null);

  useEffect(() => {
    Promise.all([getSubscriptionPlans(), getSchoolPaymentTransactions({ type: 'platform_subscription', limit: 10 })])
      .then(([plans, tx]) => {
        setPlansData(plans);
        setTransactions(tx.transactions || []);
      })
      .catch(() => toast.error('Failed to load billing'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (planId) => {
    setPayingPlan(planId);
    try {
      const data = await initializeSubscriptionPayment({ planId, billingCycle });
      if (data.link) window.location.href = data.link;
      else toast.error('Could not start checkout');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to start payment');
    } finally {
      setPayingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  const current = plansData?.current;
  const plans = plansData?.plans || [];

  return (
    <div style={{ padding: '2rem 0' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, margin: '0 0 0.5rem' }}>Billing & subscription</h1>
        <p style={{ color: '#64748b', margin: 0 }}>
          Manage your EduCore plan. Payments are processed securely via Flutterwave.
        </p>
      </header>

      {current && (
        <section className="sa-panel" style={{ marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontWeight: 800 }}>Current plan</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center' }}>
            <div>
              <span className="sa-list-meta">Plan</span>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.25rem 0 0', textTransform: 'capitalize' }}>
                {current.plan || 'trial'}
              </p>
            </div>
            <div>
              <span className="sa-list-meta">Status</span>
              <p style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0.25rem 0 0' }}>{current.status}</p>
            </div>
            {current.expiresAt && (
              <div>
                <span className="sa-list-meta">Renews / expires</span>
                <p style={{ fontWeight: 700, margin: '0.25rem 0 0' }}>
                  {new Date(current.expiresAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
        <button
          type="button"
          className={billingCycle === 'monthly' ? 'sa-btn-primary' : 'sa-btn-outline'}
          onClick={() => setBillingCycle('monthly')}
        >
          Monthly
        </button>
        <button
          type="button"
          className={billingCycle === 'yearly' ? 'sa-btn-primary' : 'sa-btn-outline'}
          onClick={() => setBillingCycle('yearly')}
        >
          Yearly (save more)
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {plans.map((plan) => {
          const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
          const isCurrent = current?.plan === plan.id && current?.status === 'active';
          return (
            <section key={plan.id} className="sa-panel" style={{ borderColor: isCurrent ? '#5849b8' : undefined }}>
              <h3 style={{ margin: '0 0 0.5rem', fontWeight: 800 }}>{plan.name}</h3>
              <p className="sa-list-meta" style={{ marginBottom: '1rem' }}>{plan.description}</p>
              <p style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 1rem' }}>{formatNaira(price)}</p>
              <ul style={{ paddingLeft: '1.2rem', margin: '0 0 1.25rem', color: '#64748b', fontSize: '0.9rem' }}>
                <li>Up to {plan.maxStudents?.toLocaleString()} students</li>
                <li>{plan.aiTokenBudget?.toLocaleString()} AI tokens</li>
              </ul>
              <button
                type="button"
                className="sa-btn-primary"
                style={{ width: '100%' }}
                disabled={isCurrent || payingPlan === plan.id}
                onClick={() => handleSubscribe(plan.id)}
              >
                {payingPlan === plan.id ? 'Redirecting…' : isCurrent ? 'Current plan' : 'Subscribe'}
              </button>
            </section>
          );
        })}
      </div>

      <section className="sa-panel">
        <h3 style={{ margin: '0 0 1rem', fontWeight: 800 }}>Subscription payment history</h3>
        {transactions.length === 0 ? (
          <p className="sa-empty">No subscription payments yet.</p>
        ) : (
          transactions.map((t) => (
            <div key={t._id} className="sa-list-row" style={{ cursor: 'default' }}>
              <span>{t.description || t.plan}</span>
              <span>
                {formatNaira(t.amount)} · <span className={`sa-blog-status ${t.status === 'successful' ? 'published' : 'draft'}`}>{t.status}</span>
              </span>
            </div>
          ))
        )}
      </section>
    </div>
  );
};

export default SchoolBilling;
