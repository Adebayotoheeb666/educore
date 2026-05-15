import axios from 'axios';

export const getFeeSchedules = (params) => axios.get('/api/fees', { params });
export const getFeeSchedule = (id) => axios.get(`/api/fees/${id}`);
export const createFeeSchedule = (data) => axios.post('/api/fees', data);
export const updateFeeSchedule = (id, data) => axios.patch(`/api/fees/${id}`, data);
export const deleteFeeSchedule = (id) => axios.delete(`/api/fees/${id}`);
export const getFeeStatus = (classId) => axios.get(`/api/fees/status/${classId}`);
export const recordPayment = (data) => axios.post('/api/fees/payment', data);
export const getStudentStatement = (studentId) =>
  axios.get(`/api/fees/statement/${studentId}`);
export const getFeeDefaulters = (params) =>
  axios.get('/api/fees/defaulters', { params });
export const initializePaystackPayment = (data) =>
  axios.post('/api/fees/payment/paystack', data);
export const verifyPaystackPayment = (reference) =>
  axios.get('/api/fees/payment/paystack/verify', { params: { reference } });
export const getRecentTransactions = () => axios.get('/api/fees/transactions');
export const initializeFlutterwavePayment = (data) =>
  axios.post('/api/fees/payment/flutterwave', data).then((r) => r.data);
export const verifyFlutterwavePayment = (txRef) =>
  axios.get('/api/payments/flutterwave/verify', { params: { tx_ref: txRef } }).then((r) => r.data);
