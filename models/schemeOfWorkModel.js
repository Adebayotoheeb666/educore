const mongoose = require('mongoose');

const schemeOfWorkSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  term: { type: String, required: true },
  session: { type: String, required: true },
  weeks: [{
    weekNumber: Number,
    topic: String,
    objectives: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('SchemeOfWork', schemeOfWorkSchema);
