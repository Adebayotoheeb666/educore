const express = require('express');
const router = express.Router();
const {
  createFeeSchedule, getFeeSchedules, getFeeStatus, recordPayment,
  initializePaystackPayment, verifyPaystackPayment, paystackWebhook,
  initializeFlutterwavePayment, verifyFlutterwavePayment, flutterwaveWebhook,
  getStudentFeeStatement, getFeeDefaulters, getRecentTransactions
} = require('../controllers/feeController');
const { protect } = require("../middleWare/authMiddleware");
const requireRole = require("../middleWare/requireRole");
const requireSchool = require("../middleWare/requireSchool");

router.post("/webhook/paystack", paystackWebhook);
router.post("/webhook/flutterwave", flutterwaveWebhook);

router.use(protect, requireSchool);

router.post("/", requireRole(['principal','bursar']), createFeeSchedule);
router.get("/", getFeeSchedules);
router.get("/status/:classId", getFeeStatus);
router.post("/payment", requireRole(['bursar','parent']), recordPayment);
router.post("/payment/paystack", initializePaystackPayment);
router.get("/payment/paystack/verify", verifyPaystackPayment);
router.post("/payment/flutterwave", initializeFlutterwavePayment);
router.get("/statement/:studentId", getStudentFeeStatement);
router.get("/transactions", requireRole(['bursar','principal']), getRecentTransactions);
router.get("/defaulters", requireRole(['bursar','principal']), getFeeDefaulters);

module.exports = router;
