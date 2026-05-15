const Payment = require('../models/paymentModel');
const FeeSchedule = require('../models/feeModel');
const User = require('../models/userModel');
const { sendSMS, sendBulkSMS } = require('../utils/sendSMS');

const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 1200; // ~50 msg/min rate limit

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const sendOverdueFeeReminders = async () => {
  console.log('[FeeReminderJob] Starting overdue fee reminder run...');
  const today = new Date();
  let sent = 0;
  let failed = 0;

  try {
    const overdueFees = await FeeSchedule.find({ dueDate: { $lt: today } }).select('_id school title totalAmount dueDate');
    if (!overdueFees.length) {
      console.log('[FeeReminderJob] No overdue fees found.');
      return;
    }

    const feeIds = overdueFees.map(f => f._id);

    const unpaidPayments = await Payment.find({
      fee: { $in: feeIds },
      status: { $in: ['unpaid', 'partial'] },
    })
      .populate('student', 'firstName lastName parentPhone')
      .populate('fee', 'title totalAmount dueDate school');

    for (let i = 0; i < unpaidPayments.length; i += BATCH_SIZE) {
      const batch = unpaidPayments.slice(i, i + BATCH_SIZE);
      const messages = batch
        .filter(p => p.student?.parentPhone)
        .map(p => ({
          phone: p.student.parentPhone,
          message: `EduCore School: Fee reminder for ${p.student.firstName} ${p.student.lastName}. "${p.fee?.title}" of ₦${p.fee?.totalAmount?.toLocaleString()} was due on ${new Date(p.fee?.dueDate).toLocaleDateString('en-NG')}. Balance: ₦${p.balance?.toLocaleString() || p.amountDue?.toLocaleString()}. Please pay promptly.`
        }));

      for (const msg of messages) {
        try {
          await sendSMS(msg.phone, msg.message);
          sent++;
        } catch (err) {
          console.warn(`[FeeReminderJob] SMS failed for ${msg.phone}:`, err.message);
          failed++;
        }
      }

      if (i + BATCH_SIZE < unpaidPayments.length) {
        await sleep(BATCH_DELAY_MS);
      }
    }

    console.log(`[FeeReminderJob] Done. Sent: ${sent}, Failed: ${failed}`);
  } catch (err) {
    console.error('[FeeReminderJob] Job error:', err.message);
  }
};

module.exports = { sendOverdueFeeReminders };
