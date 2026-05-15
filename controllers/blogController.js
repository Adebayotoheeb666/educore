const BlogPost = require('../models/blogModel');
const User = require('../models/userModel');

const BLOG_ADMIN_ROLES = ['super_admin', 'school_owner'];

const parseTags = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(raw).split(',').map((t) => t.trim()).filter(Boolean);
  }
};

const formatAuthor = (author) => {
  if (!author) return { name: 'EduCore Team', role: 'EduCore AI' };
  return {
    name: author.name || `${author.firstName || ''} ${author.lastName || ''}`.trim() || 'EduCore Team',
    role: author.role ? author.role.replace(/_/g, ' ') : 'Contributor',
    avatar: author.avatar || '',
  };
};

const getPosts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 9));
    const search = (req.query.search || '').trim();
    const category = (req.query.category || '').trim();

    const filter = { published: true };
    if (category && category !== 'All Posts') {
      filter.category = category;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subtitle: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const totalPosts = await BlogPost.countDocuments(filter);
    const blogPosts = await BlogPost.find(filter)
      .populate('author', 'name firstName lastName avatar role')
      .sort({ featured: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      blogPosts: blogPosts.map((p) => ({
        ...p.toObject(),
        author: formatAuthor(p.author),
      })),
      totalPosts,
      totalPages: Math.ceil(totalPosts / limit) || 1,
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPost = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id).populate(
      'author',
      'name firstName lastName avatar role'
    );
    if (!post || (!post.published && !req.user)) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    post.views += 1;
    await post.save();

    const payload = post.toObject();
    payload.author = formatAuthor(post.author);

    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createPost = async (req, res) => {
  try {
    const { title, subtitle, content, readTime, published, category, featured } = req.body;
    if (!title || !subtitle || !content) {
      return res.status(400).json({ message: 'title, subtitle, and content are required' });
    }

    let coverImage = req.body.coverImage || '';
    if (req.file) {
      coverImage = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }

    if (featured === true || featured === 'true') {
      await BlogPost.updateMany({ featured: true }, { $set: { featured: false } });
    }

    const post = await BlogPost.create({
      title,
      subtitle,
      content,
      category: category || 'Company News',
      coverImage,
      readTime: readTime || '5 min read',
      published: published === true || published === 'true' || published === undefined,
      featured: featured === true || featured === 'true',
      tags: parseTags(req.body.tags),
      author: req.user._id,
    });

    const populated = await BlogPost.findById(post._id).populate(
      'author',
      'name firstName lastName avatar role'
    );
    const payload = populated.toObject();
    payload.author = formatAuthor(populated.author);
    res.status(201).json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePost = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Blog post not found' });

    const isAdmin = BLOG_ADMIN_ROLES.includes(req.user.role);
    if (!isAdmin && post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }

    const { title, subtitle, content, readTime, published, category, featured } = req.body;
    if (title) post.title = title;
    if (subtitle) post.subtitle = subtitle;
    if (content) post.content = content;
    if (readTime) post.readTime = readTime;
    if (category) post.category = category;
    if (published !== undefined) {
      post.published = published === true || published === 'true';
    }
    if (req.body.tags !== undefined) post.tags = parseTags(req.body.tags);

    if (featured !== undefined) {
      const makeFeatured = featured === true || featured === 'true';
      if (makeFeatured) {
        await BlogPost.updateMany({ _id: { $ne: post._id }, featured: true }, { $set: { featured: false } });
      }
      post.featured = makeFeatured;
    }

    if (req.file) {
      post.coverImage = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    } else if (req.body.coverImage) {
      post.coverImage = req.body.coverImage;
    }

    await post.save();
    const populated = await BlogPost.findById(post._id).populate(
      'author',
      'name firstName lastName avatar role'
    );
    const payload = populated.toObject();
    payload.author = formatAuthor(populated.author);
    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Blog post not found' });

    const isAdmin = BLOG_ADMIN_ROLES.includes(req.user.role);
    if (!isAdmin && post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await post.deleteOne();
    res.status(200).json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const canManageBlog = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authorized' });
  if (!BLOG_ADMIN_ROLES.includes(req.user.role) && req.user.role !== 'admin_staff') {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

module.exports = {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  canManageBlog,
};
