const mongoose = require('mongoose');

const bookBorrowSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'LibraryBook', required: true },
  borrowedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  borrowedAt: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  returnedAt: { type: Date },
  status: { type: String, enum: ['borrowed', 'returned', 'overdue', 'lost'], default: 'borrowed' }
}, { timestamps: true });

bookBorrowSchema.index({ school: 1, status: 1 });
bookBorrowSchema.index({ school: 1, borrowedBy: 1 });

module.exports = mongoose.model('BookBorrow', bookBorrowSchema);
