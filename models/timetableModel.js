const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  term: { type: String, required: true },
  slots: [{
    day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], required: true },
    period: { type: Number, required: true },
    startTime: { type: String },
    endTime: { type: String },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  aiGenerated: { type: Boolean, default: false },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' }
}, { timestamps: true });

module.exports = mongoose.model('Timetable', timetableSchema);
