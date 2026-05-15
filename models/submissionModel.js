const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: [{
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    mcqAnswer: { type: Number }, // option index
    textAnswer: { type: String },
    aiScore: { type: Number },
    aiFeedback: { type: String },
    teacherScore: { type: Number },
    finalScore: { type: Number }
  }],
  totalScore: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  grade: { type: String },
  status: { type: String, enum: ['submitted', 'graded', 'published'], default: 'submitted' }
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);
