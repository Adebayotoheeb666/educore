const mongoose = require('mongoose');

const academicCalendarSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  session: { type: String, required: true },
  terms: [{
    term: { type: String, enum: ['first', 'second', 'third'], required: true },
    name: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    events: [{
      title: { type: String, required: true },
      date: { type: Date, required: true },
      type: { type: String, enum: ['holiday', 'exam', 'activity', 'other'], default: 'other' }
    }]
  }]
}, { timestamps: true });

module.exports = mongoose.model('AcademicCalendar', academicCalendarSchema);
