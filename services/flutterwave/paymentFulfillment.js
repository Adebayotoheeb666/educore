const Payment = require('../../models/paymentModel');
const School = require('../../models/schoolModel');
const OnlineTransaction = require('../../models/onlineTransactionModel');
const { getPlan } = require('../../config/subscriptionPlans');

const applySchoolFeePayment = async (transaction, verifiedAmount) => {
  const payment = await Payment.findById(transaction.payment);
  if (!payment) throw new Error('Linked fee payment record not found');

  const amount = Math.min(Number(verifiedAmount), payment.balance);
  if (amount <= 0) return payment;

  payment.amountPaid += amount;
  payment.balance = Math.max(0, payment.amountDue - payment.amountPaid);
  payment.status = payment.balance <= 0 ? 'paid' : 'partial';
  payment.method = 'flutterwave';
  payment.transactionRef = transaction.txRef;
  payment.installments.push({
    amount,
    method: 'flutterwave',
    date: new Date(),
  });
  await payment.save();
  return payment;
};

const applySubscriptionPayment = async (transaction) => {
  const school = await School.findById(transaction.school);
  if (!school) throw new Error('School not found');

  const plan = getPlan(transaction.plan || 'basic');
  const cycle = transaction.billingCycle === 'monthly' ? 'monthly' : 'yearly';
  const months = cycle === 'monthly' ? 1 : 12;
  const expires = new Date();
  expires.setMonth(expires.getMonth() + months);

  school.subscription = school.subscription || {};
  school.subscription.plan = plan.id;
  school.subscription.status = 'active';
  school.subscription.aiTokenBudget = plan.aiTokenBudget;
  school.subscription.expiresAt = expires;
  school.subscription.lastPaidAt = new Date();
  school.subscription.billingCycle = cycle;
  await school.save();
  return school;
};

const fulfillTransaction = async (transaction, verifiedData = {}) => {
  if (transaction.status === 'successful') {
    return { alreadyFulfilled: true, transaction };
  }

  const amount = Number(verifiedData.amount || transaction.amount);
  transaction.status = 'successful';
  transaction.flwRef = verifiedData.flw_ref || verifiedData.id || transaction.flwRef;
  transaction.gatewayResponse = verifiedData;
  transaction.paidAt = new Date();
  await transaction.save();

  if (transaction.type === 'school_fee') {
    await applySchoolFeePayment(transaction, amount);
  } else if (transaction.type === 'platform_subscription') {
    await applySubscriptionPayment(transaction);
  }

  return { transaction, fulfilled: true };
};

const generateTxRef = (prefix = 'EDU') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`.toUpperCase();

module.exports = {
  applySchoolFeePayment,
  applySubscriptionPayment,
  fulfillTransaction,
  generateTxRef,
};
