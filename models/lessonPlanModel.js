const mongoose = require('mongoose');

const lessonPlanSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  topic: { type: String, required: true },
  nerdcReference: { type: String },
  bloomsTaxonomyLevel: [{ type: String }],
  objectives: [{ type: String }],
  content: {
    intro: String,
    development: String,
    conclusion: String
  },
  teachingAids: [{ type: String }],
  aiGenerated: { type: Boolean, default: false },
  status: { type: String, enum: ['draft', 'submitted', 'approved'], default: 'draft' }
}, { timestamps: true });

lessonPlanSchema.index({ school: 1, teacher: 1 });
lessonPlanSchema.index({ school: 1, createdAt: -1 });

module.exports = mongoose.model('LessonPlan', lessonPlanSchema);
