const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  topic: { type: String },
  type: { type: String, enum: ['mcq', 'theory', 'essay', 'true_false', 'fill_blank'], required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
  examPattern: { type: String, enum: ['waec', 'neco', 'jamb', 'internal', 'ca'] },
  question: { type: String, required: true },
  options: [{ type: String }],
  answer: { type: mongoose.Schema.Types.Mixed }, // String or Number index
  rubric: [{ type: String }],
  marks: { type: Number, default: 1 },
  aiGenerated: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
