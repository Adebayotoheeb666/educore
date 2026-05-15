const axios = require('axios');
const OnlineTransaction = require('../../models/onlineTransactionModel');
const Payment = require('../../models/paymentModel');
const User = require('../../models/userModel');
const { generateTxRef, fulfillTransaction } = require('./paymentFulfillment');
const { getPlan, getPlanPrice, SUBSCRIPTION_PLANS } = require('../../config/subscriptionPlans');

const FLW_BASE = 'https://api.flutterwave.com/v3';

const getSecretKey = () => process.env.FLUTTERWAVE_SECRET_KEY;
const getPublicKey = () => process.env.FLUTTERWAVE_PUBLIC_KEY;
const getSecretHash = () => process.env.FLUTTERWAVE_SECRET_HASH;
const getFrontendUrl = () => process.env.FRONTEND_URL || 'http://localhost:3000';

const flwHeaders = () => ({
  Authorization: `Bearer ${getSecretKey()}`,
  'Content-Type': 'application/json',
});

const assertConfigured = () => {
  if (!getSecretKey()) {
    const err = new Error('Flutterwave is not configured. Set FLUTTERWAVE_SECRET_KEY on the server.');
    err.statusCode = 503;
    throw err;
  }
};

const createFlutterwavePayment = async ({
  txRef,
  amount,
  email,
  name,
  phone,
  title,
  description,
  meta,
}) => {
  assertConfigured();
  const payload = {
    tx_ref: txRef,
    amount: Number(amount),
    currency: 'NGN',
    redirect_url: `${getFrontendUrl()}/payments/callback`,
    payment_options: 'card,banktransfer,ussd',
    customer: {
      email,
      name: name || 'EduCore Customer',
      phonenumber: phone || '',
    },
    customizations: {
      title: title || 'EduCore AI',
      description: description || 'Payment',
      logo: `${getFrontendUrl()}/logo192.png`,
    },
    meta,
  };

  const { data } = await axios.post(`${FLW_BASE}/payments`, payload, { headers: flwHeaders() });
  if (data.status !== 'success') {
    throw new Error(data.message || 'Flutterwave initialization failed');
  }
  return data.data;
};

const verifyByTxRef = async (txRef) => {
  assertConfigured();
  const { data } = await axios.get(
    `${FLW_BASE}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`,
    { headers: flwHeaders() }
  );
  if (data.status !== 'success') {
    throw new Error(data.message || 'Verification failed');
  }
  return data.data;
};

const verifyWebhookSignature = (signature) => {
  const hash = getSecretHash();
  if (!hash) return process.env.NODE_ENV !== 'production';
  return signature === hash;
};

const initializeSchoolFeePayment = async ({ paymentId, amount, user, school }) => {
  const payment = await Payment.findOne({ _id: paymentId, school: school._id }).populate('fee', 'title');
  if (!payment) {
    const err = new Error('Payment record not found');
    err.statusCode = 404;
    throw err;
  }
  if (payment.balance <= 0) {
    const err = new Error('This fee is already fully paid');
    err.statusCode = 400;
    throw err;
  }

  const payAmount = Math.min(Number(amount) || payment.balance, payment.balance);
  if (payAmount < 100) {
    const err = new Error('Minimum online payment is ₦100');
    err.statusCode = 400;
    throw err;
  }

  if (user.role === 'parent') {
    const parent = await User.findById(user._id);
    const allowed = (parent.children || []).some((c) => c.toString() === payment.student.toString());
    if (!allowed) {
      const err = new Error('Not authorized to pay for this student');
      err.statusCode = 403;
      throw err;
    }
  } else if (user.role === 'student' && user._id.toString() !== payment.student.toString()) {
    const err = new Error('Not authorized');
    err.statusCode = 403;
    throw err;
  }

  const student = await User.findById(payment.student);
  const txRef = generateTxRef('FEE');
  const payerEmail = user.email || student?.parentPhone || `${txRef}@educore.ng`;

  const transaction = await OnlineTransaction.create({
    txRef,
    type: 'school_fee',
    status: 'pending',
    amount: payAmount,
    school: school._id,
    student: payment.student,
    payment: payment._id,
    fee: payment.fee?._id || payment.fee,
    payer: user._id,
    customerEmail: payerEmail,
    customerName: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    description: payment.fee?.title || 'School fee',
    meta: { paymentId: payment._id.toString() },
  });

  const flw = await createFlutterwavePayment({
    txRef,
    amount: payAmount,
    email: payerEmail,
    name: transaction.customerName,
    phone: user.phone,
    title: 'School Fee Payment',
    description: transaction.description,
    meta: {
      transaction_id: transaction._id.toString(),
      type: 'school_fee',
      school_id: school._id.toString(),
    },
  });

  transaction.gatewayResponse = { init: flw };
  await transaction.save();

  return {
    link: flw.link,
    txRef,
    transactionId: transaction._id,
    amount: payAmount,
    publicKey: getPublicKey(),
  };
};

const initializeSubscriptionPayment = async ({ planId, billingCycle, user, school }) => {
  const plan = getPlan(planId);
  const cycle = billingCycle === 'monthly' ? 'monthly' : 'yearly';
  const amount = getPlanPrice(plan.id, cycle);
  const txRef = generateTxRef('SUB');

  const transaction = await OnlineTransaction.create({
    txRef,
    type: 'platform_subscription',
    status: 'pending',
    amount,
    school: school._id,
    payer: user._id,
    plan: plan.id,
    billingCycle: cycle,
    customerEmail: user.email,
    customerName: user.name || school.name,
    description: `${plan.name} plan (${cycle})`,
    meta: { planId: plan.id, billingCycle: cycle },
  });

  const flw = await createFlutterwavePayment({
    txRef,
    amount,
    email: user.email,
    name: transaction.customerName,
    phone: user.phone || school.phone,
    title: 'EduCore Subscription',
    description: transaction.description,
    meta: {
      transaction_id: transaction._id.toString(),
      type: 'platform_subscription',
      school_id: school._id.toString(),
      plan: plan.id,
    },
  });

  transaction.gatewayResponse = { init: flw };
  await transaction.save();

  return {
    link: flw.link,
    txRef,
    transactionId: transaction._id,
    amount,
    plan: plan.id,
    billingCycle: cycle,
    publicKey: getPublicKey(),
  };
};

const verifyAndFulfill = async (txRef) => {
  const transaction = await OnlineTransaction.findOne({ txRef });
  if (!transaction) {
    const err = new Error('Transaction not found');
    err.statusCode = 404;
    throw err;
  }

  if (transaction.status === 'successful') {
    return { transaction, status: 'successful', alreadyCompleted: true };
  }

  const verified = await verifyByTxRef(txRef);
  const paid = verified.status === 'successful' && verified.amount >= transaction.amount;

  if (!paid) {
    transaction.status = 'failed';
    transaction.failureReason = verified.processor_response || 'Payment not completed';
    transaction.gatewayResponse = verified;
    await transaction.save();
    return { transaction, status: 'failed', verified };
  }

  await fulfillTransaction(transaction, verified);
  const updated = await OnlineTransaction.findById(transaction._id);
  return { transaction: updated, status: 'successful', verified };
};

const processWebhookPayload = async (body) => {
  const event = body.event;
  const data = body.data;
  if (event !== 'charge.completed' || !data?.tx_ref) {
    return { ignored: true };
  }

  const transaction = await OnlineTransaction.findOne({ txRef: data.tx_ref });
  if (!transaction) return { ignored: true, reason: 'unknown tx_ref' };

  if (data.status === 'successful') {
    await fulfillTransaction(transaction, data);
  } else {
    transaction.status = 'failed';
    transaction.failureReason = data.processor_response;
    transaction.gatewayResponse = data;
    await transaction.save();
  }

  return { processed: true, txRef: data.tx_ref };
};

module.exports = {
  SUBSCRIPTION_PLANS,
  getPlan,
  getPlanPrice,
  initializeSchoolFeePayment,
  initializeSubscriptionPayment,
  verifyAndFulfill,
  processWebhookPayload,
  verifyWebhookSignature,
  getPublicKey,
};
