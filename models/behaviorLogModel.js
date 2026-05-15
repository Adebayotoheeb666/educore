const mongoose = require('mongoose');

const behaviorLogSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['commendation', 'warning', 'suspension'], required: true },
  description: { type: String, required: true },
  parentNotified: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('BehaviorLog', behaviorLogSchema);
