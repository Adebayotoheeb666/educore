const mongoose = require('mongoose');

const syncLogSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  offlineId: { type: String, required: true, unique: true }, // unique idempotency key
  type: { type: String, required: true },
  status: { type: String, enum: ['pending', 'success', 'failed', 'conflict'], default: 'pending' },
  data: { type: mongoose.Schema.Types.Mixed },
  syncedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('SyncLog', syncLogSchema);
