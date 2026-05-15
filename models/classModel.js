const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true },
  arm: { type: String },
  level: { type: String, required: true },
  classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  session: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);
