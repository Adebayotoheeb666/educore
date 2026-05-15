const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true },
  code: { type: String },
  classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  nerdcCode: { type: String },
  category: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);
