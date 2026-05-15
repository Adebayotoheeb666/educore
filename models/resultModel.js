const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  term: { type: String, required: true },
  session: { type: String, required: true },
  subjects: [{
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    caScore: { type: Number, default: 0 },
    examScore: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    grade: { type: String }
  }],
  overallPercentage: { type: Number },
  positionInClass: { type: Number },
  principalComment: { type: String },
  reportCardUrl: { type: String },
  status: { type: String, enum: ['draft', 'approved', 'released'], default: 'draft' }
}, { timestamps: true });

resultSchema.index({ school: 1, student: 1, term: 1, session: 1 }, { unique: true });
resultSchema.index({ school: 1, class: 1, term: 1 });
resultSchema.index({ school: 1, createdAt: -1 });

module.exports = mongoose.model('Result', resultSchema);
