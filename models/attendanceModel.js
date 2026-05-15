const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  date: { type: Date, required: true },
  term: { type: String, required: true },
  session: { type: String, required: true },
  takenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  records: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['present', 'absent', 'late', 'excused'], default: 'present' },
    notifiedParent: { type: Boolean, default: false }
  }]
}, { timestamps: true });

attendanceSchema.index({ school: 1, class: 1, date: 1 }, { unique: true });
attendanceSchema.index({ school: 1, createdAt: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
