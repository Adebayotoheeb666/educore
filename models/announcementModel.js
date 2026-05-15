const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  priority: { type: String, enum: ['normal', 'high', 'urgent'], default: 'normal' },
  targetAudience: { type: String, enum: ['all', 'parents', 'students', 'teachers', 'class'], default: 'all' },
  targetClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sentViaSMS: { type: Boolean, default: false },
  sentViaWhatsApp: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
