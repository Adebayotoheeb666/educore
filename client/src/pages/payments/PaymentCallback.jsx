import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { verifyFlutterwavePayment } from '../../services/paymentService';
import './PaymentCallback.css';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const { user } = useSelector((s) => s.auth);
  const [status, setStatus] = useState('loading');
  const [details, setDetails] = useState(null);

  const txRef = searchParams.get('tx_ref') || searchParams.get('trx_ref') || searchParams.get('reference');

  useEffect(() => {
    if (!txRef) {
      setStatus('error');
      return;
    }
    verifyFlutterwavePayment(txRef)
      .then((data) => {
        setDetails(data);
        if (data.status === 'successful') {
          setStatus('success');
          toast.success('Payment successful');
        } else {
          setStatus('failed');
          toast.error('Payment was not completed');
        }
      })
      .catch((err) => {
        setStatus('error');
        toast.error(err?.response?.data?.message || 'Verification failed');
      });
  }, [txRef]);

  const isSubscription = details?.transaction?.type === 'platform_subscription';
  const dashboardPath =
    user?.role === 'super_admin'
      ? '/admin'
      : user?.role === 'parent'
        ? '/parent/fees'
        : user?.role === 'school_owner' || user?.role === 'principal'
          ? '/settings/billing'
          : '/dashboard';

  return (
    <div className="payment-callback-page">
      <div className="payment-callback-card">
        {status === 'loading' && (
          <>
            <div className="spinner-border text-primary" />
            <h1>Verifying payment…</h1>
            <p>Please wait while we confirm your transaction.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="payment-callback-icon success">✓</div>
            <h1>Payment successful</h1>
            <p>
              {isSubscription
                ? 'Your school subscription has been activated.'
                : 'Your fee payment has been recorded.'}
            </p>
            {details?.transaction?.amount != null && (
              <p className="payment-callback-amount">
                ₦{Number(details.transaction.amount).toLocaleString()}
              </p>
            )}
            <p className="payment-callback-ref">Reference: {txRef}</p>
          </>
        )}
        {(status === 'failed' || status === 'error') && (
          <>
            <div className="payment-callback-icon failed">✕</div>
            <h1>Payment not completed</h1>
            <p>Your payment could not be verified. If you were charged, contact support with your reference.</p>
            {txRef && <p className="payment-callback-ref">Reference: {txRef}</p>}
          </>
        )}
        <div className="payment-callback-actions">
          <Link to={dashboardPath} className="payment-callback-btn primary">
            Continue
          </Link>
          {!isSubscription && user?.role === 'parent' && (
            <Link to="/parent/fees" className="payment-callback-btn outline">
              Back to fees
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentCallback;
