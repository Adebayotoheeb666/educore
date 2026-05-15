const OnlineTransaction = require('../models/onlineTransactionModel');
const Payment = require('../models/paymentModel');
const School = require('../models/schoolModel');
const {
  SUBSCRIPTION_PLANS,
  initializeSchoolFeePayment,
  initializeSubscriptionPayment,
  verifyAndFulfill,
  processWebhookPayload,
  verifyWebhookSignature,
  getPublicKey,
} = require('../services/flutterwave/flutterwaveService');

const handleFlutterwaveWebhook = async (req, res) => {
  try {
    const signature = req.headers['verif-hash'];
    if (!verifyWebhookSignature(signature)) {
      return res.status(401).send('Invalid signature');
    }
    await processWebhookPayload(req.body);
    res.status(200).send('OK');
  } catch (error) {
    console.error('[Flutterwave webhook]', error.message);
    res.status(200).send('OK');
  }
};

const initializeFeePayment = async (req, res) => {
  try {
    const { paymentId, amount } = req.body;
    if (!paymentId) return res.status(400).json({ message: 'paymentId is required' });

    const result = await initializeSchoolFeePayment({
      paymentId,
      amount,
      user: req.user,
      school: req.school,
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const initializeSubscription = async (req, res) => {
  try {
    const { planId, billingCycle } = req.body;
    if (!planId) return res.status(400).json({ message: 'planId is required' });

    const result = await initializeSubscriptionPayment({
      planId,
      billingCycle,
      user: req.user,
      school: req.school,
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const txRef = req.query.tx_ref || req.query.txRef;
    if (!txRef) return res.status(400).json({ message: 'tx_ref is required' });

    const result = await verifyAndFulfill(txRef);
    const txn = result.transaction;

    let extra = {};
    if (txn.type === 'school_fee' && txn.payment) {
      const payment = await Payment.findById(txn.payment).populate('fee', 'title');
      extra.payment = payment;
    }
    if (txn.type === 'platform_subscription' && txn.school) {
      extra.school = await School.findById(txn.school).select('name subscription');
    }

    res.status(200).json({
      status: result.status,
      alreadyCompleted: result.alreadyCompleted,
      transaction: txn,
      ...extra,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const getSubscriptionPlans = async (req, res) => {
  const school = req.school;
  res.status(200).json({
    plans: Object.values(SUBSCRIPTION_PLANS),
    current: school
      ? {
          plan: school.subscription?.plan,
          status: school.subscription?.status,
          expiresAt: school.subscription?.expiresAt,
          billingCycle: school.subscription?.billingCycle,
        }
      : null,
    publicKey: getPublicKey(),
  });
};

const getSchoolTransactions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 20);
    const type = req.query.type;
    const status = req.query.status;

    const filter = { school: req.school._id };
    if (type) filter.type = type;
    if (status) filter.status = status;

    const [total, transactions] = await Promise.all([
      OnlineTransaction.countDocuments(filter),
      OnlineTransaction.find(filter)
        .populate('payer', 'name firstName lastName email')
        .populate('student', 'name firstName lastName')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    res.status(200).json({
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPlatformTransactions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 25);
    const type = req.query.type;
    const status = req.query.status;
    const schoolId = req.query.schoolId;

    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (schoolId) filter.school = schoolId;

    const [total, transactions, stats] = await Promise.all([
      OnlineTransaction.countDocuments(filter),
      OnlineTransaction.find(filter)
        .populate('school', 'name')
        .populate('payer', 'name email')
        .populate('student', 'name firstName lastName')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      OnlineTransaction.aggregate([
        { $match: { status: 'successful' } },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const revenue = {
      school_fees: stats.find((s) => s._id === 'school_fee') || { total: 0, count: 0 },
      subscriptions: stats.find((s) => s._id === 'platform_subscription') || { total: 0, count: 0 },
    };

    res.status(200).json({
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      revenue: {
        schoolFeesCollected: revenue.school_fees.total,
        schoolFeesCount: revenue.school_fees.count,
        subscriptionRevenue: revenue.subscriptions.total,
        subscriptionCount: revenue.subscriptions.count,
        totalRevenue: revenue.school_fees.total + revenue.subscriptions.total,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPaymentConfig = async (req, res) => {
  res.status(200).json({
    publicKey: getPublicKey(),
    currency: 'NGN',
    provider: 'flutterwave',
  });
};

module.exports = {
  handleFlutterwaveWebhook,
  initializeFeePayment,
  initializeSubscription,
  verifyPayment,
  getSubscriptionPlans,
  getSchoolTransactions,
  getPlatformTransactions,
  getPaymentConfig,
};
