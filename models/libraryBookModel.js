const mongoose = require('mongoose');

const libraryBookSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  title: { type: String, required: true },
  author: { type: String },
  isbn: { type: String },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  classLevel: [{ type: String }],
  quantity: { type: Number, default: 1 },
  available: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('LibraryBook', libraryBookSchema);
