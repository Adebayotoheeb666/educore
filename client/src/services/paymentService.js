import axios from 'axios';
import '../config/apiConfig';

export const getPaymentConfig = () =>
  axios.get('/api/payments/config').then((r) => r.data);

export const getSubscriptionPlans = () =>
  axios.get('/api/payments/plans').then((r) => r.data);

export const initializeFeePayment = (data) =>
  axios.post('/api/payments/flutterwave/fee', data).then((r) => r.data);

export const initializeSubscriptionPayment = (data) =>
  axios.post('/api/payments/flutterwave/subscription', data).then((r) => r.data);

export const verifyFlutterwavePayment = (txRef) =>
  axios.get('/api/payments/flutterwave/verify', { params: { tx_ref: txRef } }).then((r) => r.data);

export const getSchoolPaymentTransactions = (params) =>
  axios.get('/api/payments/transactions', { params }).then((r) => r.data);

export const getPlatformPaymentTransactions = (params) =>
  axios.get('/api/admin/payments/transactions', { params }).then((r) => r.data);

// Legacy fee route aliases
export const initializeFlutterwaveFee = (data) =>
  axios.post('/api/fees/payment/flutterwave', data).then((r) => r.data);
