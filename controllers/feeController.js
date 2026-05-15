const Fee = require("../models/feeModel");
const Payment = require("../models/paymentModel");
const User = require("../models/userModel");

const createFeeSchedule = async (req, res) => {
  try {
    const { title, session, term, classId, items, totalAmount, dueDate } = req.body;
    const fee = await Fee.create({
      school: req.school._id,
      title,
      session,
      term,
      class: classId,
      items,
      totalAmount,
      dueDate
    });

    // Automatically create payment records for all students in that class
    const students = await User.find({ schoolId: req.school._id, class: classId, role: 'student' });
    const paymentRecords = students.map(student => ({
      school: req.school._id,
      student: student._id,
      fee: fee._id,
      method: 'cash', // default placeholder
      amountDue: totalAmount,
      balance: totalAmount,
      status: 'pending'
    }));
    
    if (paymentRecords.length > 0) {
      await Payment.insertMany(paymentRecords);
    }

    res.status(201).json(fee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFeeSchedules = async (req, res) => {
  try {
    const fees = await Fee.find({ school: req.school._id }).populate('class', 'name arm');
    res.status(200).json(fees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFeeSchedule = async (req, res) => {
  try {
    const fee = await Fee.findOne({ _id: req.params.id, school: req.school._id }).populate('class', 'name arm');
    if (!fee) return res.status(404).json({ message: 'Fee schedule not found' });
    res.status(200).json(fee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateFeeSchedule = async (req, res) => {
  try {
    const { title, session, term, classId, items, totalAmount, dueDate } = req.body;
    const existing = await Fee.findOne({ _id: req.params.id, school: req.school._id });
    if (!existing) return res.status(404).json({ message: 'Fee schedule not found' });

    existing.title = title ?? existing.title;
    existing.session = session ?? existing.session;
    existing.term = term ?? existing.term;
    if (classId) existing.class = classId;
    if (items) existing.items = items;
    const prevTotal = existing.totalAmount;
    if (totalAmount != null) existing.totalAmount = totalAmount;
    if (dueDate) existing.dueDate = dueDate;
    await existing.save();

    if (totalAmount != null && totalAmount !== prevTotal) {
      await Payment.updateMany(
        { fee: existing._id, school: req.school._id, status: 'pending' },
        { $set: { amountDue: totalAmount, balance: totalAmount } }
      );
    }

    const fee = await Fee.findById(existing._id).populate('class', 'name arm');
    res.status(200).json(fee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteFeeSchedule = async (req, res) => {
  try {
    const fee = await Fee.findOne({ _id: req.params.id, school: req.school._id });
    if (!fee) return res.status(404).json({ message: 'Fee schedule not found' });

    const hasPayments = await Payment.findOne({
      fee: fee._id,
      school: req.school._id,
      amountPaid: { $gt: 0 },
    });
    if (hasPayments) {
      return res.status(400).json({
        message: 'Cannot delete a fee schedule that already has recorded payments',
      });
    }

    await Payment.deleteMany({ fee: fee._id, school: req.school._id });
    await fee.deleteOne();
    res.status(200).json({ message: 'Fee schedule deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFeeStatus = async (req, res) => {
  try {
    const schoolId = req.school._id;
    const stats = await Payment.aggregate([
      { $match: { school: schoolId } },
      { $group: {
          _id: null,
          totalPaid: { $sum: "$amountPaid" },
          totalBalance: { $sum: "$balance" },
          paidCount: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] } },
          partialCount: { $sum: { $cond: [{ $eq: ["$status", "partial"] }, 1, 0] } },
          pendingCount: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } }
      }}
    ]);
    res.status(200).json(stats[0] || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const recordPayment = async (req, res) => {
  try {
    const { paymentId, amount, method, transactionRef } = req.body;
    const payment = await Payment.findOne({ _id: paymentId, school: req.school._id });
    
    if (!payment) return res.status(404).json({ message: "Payment record not found" });

    payment.amountPaid += amount;
    payment.balance = payment.amountDue - payment.amountPaid;
    payment.status = payment.balance <= 0 ? 'paid' : 'partial';
    payment.installments.push({ amount, method, date: new Date() });
    payment.method = method;
    payment.transactionRef = transactionRef;

    await payment.save();
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFeeDefaulters = async (req, res) => {
  try {
    const defaulters = await Payment.find({ 
      school: req.school._id, 
      status: { $in: ['pending', 'partial'] } 
    }).populate('student', 'firstName lastName profilePicture').populate('fee', 'title');
    res.status(200).json(defaulters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const initializePaystackPayment = async (req, res) => {
  try {
    res.status(200).json({
      message: "Paystack payment initialization coming soon",
      authorization_url: null,
      reference: null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyPaystackPayment = async (req, res) => {
  try {
    res.status(200).json({
      message: "Paystack payment verification coming soon",
      status: "pending"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const paystackWebhook = async (req, res) => {
  // HMAC verification will be added here
  console.log("Paystack Webhook received");
  res.status(200).send("OK");
};

const initializeFlutterwavePayment = async (req, res) => {
  try {
    res.status(200).json({
      message: "Flutterwave payment initialization coming soon",
      link: null,
      reference: null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyFlutterwavePayment = async (req, res) => {
  try {
    res.status(200).json({
      message: "Flutterwave payment verification coming soon",
      status: "pending"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const flutterwaveWebhook = async (req, res) => {
  console.log("Flutterwave Webhook received");
  res.status(200).send("OK");
};

const getStudentFeeStatement = async (req, res) => {
  try {
    const { studentId } = req.params;
    const schoolId = req.school._id;

    if (req.user.role === 'parent') {
      const parent = await User.findById(req.user._id);
      const allowed = (parent.children || []).some((c) => c.toString() === studentId);
      if (!allowed) return res.status(403).json({ message: 'Not authorized to view this statement' });
    } else if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({ message: 'Not authorized to view this statement' });
    }

    const student = await User.findOne({ _id: studentId, schoolId, role: 'student' })
      .populate('classId', 'name arm');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const transactions = await Payment.find({ school: schoolId, student: studentId })
      .populate('fee', 'title term session dueDate')
      .sort({ updatedAt: -1 });

    const totalInvoiced = transactions.reduce((s, p) => s + (p.amountDue || 0), 0);
    const totalPaid = transactions.reduce((s, p) => s + (p.amountPaid || 0), 0);
    const balance = transactions.reduce((s, p) => s + (p.balance || 0), 0);
    const lastPayment = transactions.find((p) => p.amountPaid > 0);

    const outstandingDue = transactions
      .filter((p) => p.balance > 0)
      .sort((a, b) => new Date(a.fee?.dueDate || 0) - new Date(b.fee?.dueDate || 0))[0];

    res.status(200).json({
      student: {
        id: student._id,
        name: student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim(),
        admissionNumber: student.admissionNumber,
        className: student.classId?.name
          ? `${student.classId.name}${student.classId.arm ? ` ${student.classId.arm}` : ''}`.trim()
          : 'N/A',
      },
      totalInvoiced,
      totalPaid,
      balance,
      lastPaymentAmount: lastPayment?.amountPaid ?? 0,
      lastPaymentDate: lastPayment?.updatedAt,
      outstandingDue: outstandingDue
        ? { amount: outstandingDue.balance, dueDate: outstandingDue.fee?.dueDate }
        : null,
      transactions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRecentTransactions = async (req, res) => {
  try {
    const transactions = await Payment.find({ school: req.school._id })
      .populate('student', 'firstName lastName class')
      .populate('fee', 'title totalAmount')
      .sort({ updatedAt: -1 })
      .limit(50);
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createFeeSchedule, getFeeSchedules, getFeeSchedule, updateFeeSchedule, deleteFeeSchedule,
  getFeeStatus, recordPayment,
  initializePaystackPayment, verifyPaystackPayment, paystackWebhook,
  initializeFlutterwavePayment, verifyFlutterwavePayment, flutterwaveWebhook,
  getStudentFeeStatement, getFeeDefaulters, getRecentTransactions
};
