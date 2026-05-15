const BookBorrow = require('../models/bookBorrowModel');
const { sendSMS } = require('../utils/sendSMS');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const sendLibraryOverdueAlerts = async () => {
  console.log('[LibraryOverdueJob] Checking overdue library books...');
  const today = new Date();
  let sent = 0;
  let failed = 0;

  try {
    const overdueBorrows = await BookBorrow.find({
      dueDate: { $lt: today },
      status: 'borrowed',
    })
      .populate('borrowedBy', 'firstName lastName parentPhone role')
      .populate('book', 'title author');

    for (let i = 0; i < overdueBorrows.length; i++) {
      const borrow = overdueBorrows[i];
      const user = borrow.borrowedBy;
      if (!user) continue;

      const daysOverdue = Math.floor((today - borrow.dueDate) / (1000 * 60 * 60 * 24));
      const bookTitle = borrow.book?.title || 'a library book';
      const dueDate = new Date(borrow.dueDate).toLocaleDateString('en-NG');

      const phoneNumber = user.parentPhone || user.phone;
      if (!phoneNumber) continue;

      const message = `EduCore Library: "${bookTitle}" borrowed by ${user.firstName} ${user.lastName} was due on ${dueDate} (${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue). Please return it to the library as soon as possible to avoid penalties.`;

      try {
        await sendSMS(phoneNumber, message);
        sent++;
      } catch (err) {
        console.warn(`[LibraryOverdueJob] SMS failed for ${phoneNumber}:`, err.message);
        failed++;
      }

      if ((i + 1) % 50 === 0) await sleep(1200);
    }

    console.log(`[LibraryOverdueJob] Done. Checked: ${overdueBorrows.length}, Sent: ${sent}, Failed: ${failed}`);
  } catch (err) {
    console.error('[LibraryOverdueJob] Job error:', err.message);
  }
};

module.exports = { sendLibraryOverdueAlerts };
