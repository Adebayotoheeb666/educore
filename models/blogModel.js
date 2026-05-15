const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  subtitle: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  category: {
    type: String,
    default: 'Company News',
    enum: [
      'Company News',
      'Educational Tips',
      'AI in Classroom',
      'Case Studies',
      'AI Strategy',
    ],
  },
  coverImage: { type: String, default: '' },
  readTime: { type: String, default: '5 min read' },
  tags: [{ type: String }],
  published: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  views: { type: Number, default: 0 },
}, { timestamps: true });

blogSchema.index({ published: 1, createdAt: -1 });
blogSchema.index({ title: 'text', subtitle: 'text', content: 'text' });
blogSchema.index({ category: 1 });

module.exports = mongoose.model('BlogPost', blogSchema);
