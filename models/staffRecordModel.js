const mongoose = require('mongoose');

const staffRecordSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  staffId: { type: String, required: true },
  qualification: [{ type: String }],
  certifications: [{ type: String }],
  employedDate: { type: Date },
  performanceLogs: [{
    date: { type: Date, default: Date.now },
    evaluator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: { type: Number },
    comments: { type: String }
  }]
}, { timestamps: true });

module.exports = mongoose.model('StaffRecord', staffRecordSchema);
