const cron = require("node-cron");
const Activities = require("../models/Activities");
const { sendOverdueFeeReminders: runFeeReminders } = require("../jobs/feeReminderJob");
const { sendLibraryOverdueAlerts: runLibraryAlerts } = require("../jobs/libraryOverdueJob");

const cleanupOldActivities = () => {
  // Daily at 2am — purge activity logs older than 90 days (NDPR compliance)
  cron.schedule("0 2 * * *", async () => {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const result = await Activities.deleteMany({ createdAt: { $lt: ninetyDaysAgo } });
      console.log(`[${new Date().toISOString()}] Cleanup: Deleted ${result.deletedCount} old activities`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Cleanup error:`, error.message);
    }
  });
};

const sendOverdueFeeReminders = () => {
  // Daily at 8am — SMS parents of students with overdue fees
  cron.schedule("0 8 * * *", async () => {
    console.log(`[${new Date().toISOString()}] Starting overdue fee reminders job`);
    await runFeeReminders();
  });
};

const sendLibraryOverdueAlerts = () => {
  // Daily at 9am — SMS borrowers with overdue library books
  cron.schedule("0 9 * * *", async () => {
    console.log(`[${new Date().toISOString()}] Starting library overdue alerts job`);
    await runLibraryAlerts();
  });
};

const sendAttendanceDailySummary = () => {
  // Daily at 3pm — placeholder for attendance summary reports
  cron.schedule("0 15 * * *", async () => {
    console.log(`[${new Date().toISOString()}] Attendance daily summary job running`);
  });
};

const manualCleanupOldActivities = async () => {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const result = await Activities.deleteMany({ createdAt: { $lt: ninetyDaysAgo } });
    return { success: true, deletedCount: result.deletedCount };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = {
  cleanupOldActivities,
  sendOverdueFeeReminders,
  sendLibraryOverdueAlerts,
  sendAttendanceDailySummary,
  manualCleanupOldActivities,
};
