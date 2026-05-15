import { useState } from 'react';
import { toast } from 'sonner';
import { initializeFeePayment } from '../../services/paymentService';

/**
 * Redirects to Flutterwave hosted checkout for a school fee payment record.
 */
const FlutterwavePayButton = ({
  paymentId,
  amount,
  label = 'Pay with Flutterwave',
  className = 'btn-primary-green',
  style,
  onSuccess,
  disabled,
}) => {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!paymentId) {
      toast.error('No payment record selected');
      return;
    }
    setLoading(true);
    try {
      const data = await initializeFeePayment({ paymentId, amount });
      if (data.link) {
        if (onSuccess) onSuccess(data);
        window.location.href = data.link;
      } else {
        toast.error('Could not start payment');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Payment failed to start');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={className}
      style={style}
      onClick={handlePay}
      disabled={disabled || loading}
    >
      {loading ? 'Redirecting…' : label}
    </button>
  );
};

export default FlutterwavePayButton;
