const Result = require('../models/resultModel');
const User = require('../models/userModel');
const { sendSMS } = require('../utils/sendSMS');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BATCH_DELAY_MS = 1200;

const notifyResultsReleased = async ({ schoolId, term, session, classIds = [] }) => {
  console.log('[ResultNotificationJob] Sending result release notifications...');
  let sent = 0;
  let failed = 0;

  try {
    const query = { school: schoolId, term, session, status: 'released' };
    if (classIds.length) query.class = { $in: classIds };

    const results = await Result.find(query)
      .populate('student', 'firstName lastName parentPhone')
      .populate('class', 'name arm')
      .select('student class overallPercentage positionInClass');

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const student = result.student;
      if (!student?.parentPhone) continue;

      const className = result.class ? `${result.class.name} ${result.class.arm || ''}`.trim() : 'your child\'s class';
      const message = `EduCore School: Results for ${student.firstName} ${student.lastName} (${className}) for ${term} ${session} have been released. Score: ${result.overallPercentage}%, Position: ${result.positionInClass || 'N/A'}. Log in to your parent portal to view the full report card.`;

      try {
        await sendSMS(student.parentPhone, message);
        sent++;
      } catch (err) {
        console.warn(`[ResultNotificationJob] SMS failed for ${student.parentPhone}:`, err.message);
        failed++;
      }

      if ((i + 1) % 50 === 0) await sleep(BATCH_DELAY_MS);
    }

    console.log(`[ResultNotificationJob] Done. Sent: ${sent}, Failed: ${failed}`);
    return { sent, failed };
  } catch (err) {
    console.error('[ResultNotificationJob] Job error:', err.message);
    return { sent, failed, error: err.message };
  }
};

module.exports = { notifyResultsReleased };
