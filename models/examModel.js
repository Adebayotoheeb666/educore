const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  term: { type: String, required: true },
  type: { type: String, enum: ['ca', 'exam'], required: true },
  scheduledDate: { type: Date },
  duration: { type: Number }, // in minutes
  totalMarks: { type: Number, required: true },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  status: { type: String, enum: ['draft', 'published', 'completed'], default: 'draft' },
  randomizeQuestions: { type: Boolean, default: false },
  uniquePaperPerStudent: { type: Boolean, default: false }
}, { timestamps: true });

examSchema.index({ school: 1, class: 1, term: 1 });
examSchema.index({ school: 1, createdAt: -1 });

module.exports = mongoose.model('Exam', examSchema);
