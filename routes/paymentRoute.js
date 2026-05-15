const express = require('express');
const router = express.Router();
const {
  initializeFeePayment,
  initializeSubscription,
  verifyPayment,
  getSubscriptionPlans,
  getSchoolTransactions,
  getPaymentConfig,
} = require('../controllers/paymentController');
const { protect } = require('../middleWare/authMiddleware');
const requireRole = require('../middleWare/requireRole');
const requireSchool = require('../middleWare/requireSchool');

router.get('/flutterwave/verify', protect, verifyPayment);

router.use(protect);

router.get('/config', getPaymentConfig);

router.use(requireSchool);

router.get('/plans', getSubscriptionPlans);
router.get('/transactions', requireRole(['principal', 'school_owner', 'vp_admin', 'bursar']), getSchoolTransactions);
router.post(
  '/flutterwave/fee',
  requireRole(['parent', 'student', 'bursar', 'principal', 'school_owner']),
  initializeFeePayment
);
router.post(
  '/flutterwave/subscription',
  requireRole(['school_owner', 'principal']),
  initializeSubscription
);

module.exports = router;
