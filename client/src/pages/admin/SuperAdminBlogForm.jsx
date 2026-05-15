import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  getAdminBlogPost,
  createAdminBlogPost,
  updateAdminBlogPost,
} from '../../services/adminService';
import './SuperAdmin.css';

const CATEGORIES = [
  'Company News',
  'Educational Tips',
  'AI in Classroom',
  'Case Studies',
  'AI Strategy',
];

const emptyForm = {
  title: '',
  subtitle: '',
  content: '',
  category: 'Company News',
  readTime: '5 min read',
  tags: '',
  coverImageUrl: '',
  published: true,
  featured: false,
};

const SuperAdminBlogForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [coverFile, setCoverFile] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    getAdminBlogPost(id)
      .then((post) => {
        setForm({
          title: post.title || '',
          subtitle: post.subtitle || '',
          content: post.content || '',
          category: post.category || 'Company News',
          readTime: post.readTime || '5 min read',
          tags: (post.tags || []).join(', '),
          coverImageUrl: post.coverImage || '',
          published: post.published !== false,
          featured: Boolean(post.featured),
        });
      })
      .catch(() => {
        toast.error('Failed to load post');
        navigate('/admin/blog');
      })
      .finally(() => setLoading(false));
  }, [id, isEdit, navigate]);

  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const buildFormData = () => {
    const fd = new FormData();
    fd.append('title', form.title.trim());
    fd.append('subtitle', form.subtitle.trim());
    fd.append('content', form.content.trim());
    fd.append('category', form.category);
    fd.append('readTime', form.readTime.trim() || '5 min read');
    fd.append('published', form.published ? 'true' : 'false');
    fd.append('featured', form.featured ? 'true' : 'false');
    const tagList = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    fd.append('tags', JSON.stringify(tagList));
    if (coverFile) {
      fd.append('coverImage', coverFile);
    } else if (form.coverImageUrl.trim()) {
      fd.append('coverImage', form.coverImageUrl.trim());
    }
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.subtitle.trim() || !form.content.trim()) {
      toast.error('Title, subtitle, and content are required');
      return;
    }
    setSubmitting(true);
    try {
      const fd = buildFormData();
      if (isEdit) {
        await updateAdminBlogPost(id, fd);
        toast.success('Post updated');
      } else {
        await createAdminBlogPost(fd);
        toast.success('Post created');
      }
      navigate('/admin/blog');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save post');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  return (
    <div className="super-admin-page">
      <div className="sa-welcome-row">
        <div>
          <h2>{isEdit ? 'Edit blog post' : 'New blog post'}</h2>
          <p>Content appears on the public Knowledge Hub when published.</p>
        </div>
        <Link to="/admin/blog" className="sa-btn-outline">← Back to list</Link>
      </div>

      <form onSubmit={handleSubmit} className="sa-panel sa-blog-form">
        <div className="sa-form-grid">
          <label className="sa-form-field sa-form-field-full">
            <span>Title *</span>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              required
            />
          </label>
          <label className="sa-form-field sa-form-field-full">
            <span>Subtitle *</span>
            <input
              type="text"
              value={form.subtitle}
              onChange={(e) => setField('subtitle', e.target.value)}
              required
            />
          </label>
          <label className="sa-form-field">
            <span>Category</span>
            <select value={form.category} onChange={(e) => setField('category', e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="sa-form-field">
            <span>Read time</span>
            <input
              type="text"
              value={form.readTime}
              onChange={(e) => setField('readTime', e.target.value)}
              placeholder="5 min read"
            />
          </label>
          <label className="sa-form-field sa-form-field-full">
            <span>Tags (comma-separated)</span>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setField('tags', e.target.value)}
              placeholder="AI, Nigeria, Schools"
            />
          </label>
          <label className="sa-form-field">
            <span>Cover image file</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
            />
          </label>
          <label className="sa-form-field">
            <span>Or cover image URL</span>
            <input
              type="url"
              value={form.coverImageUrl}
              onChange={(e) => setField('coverImageUrl', e.target.value)}
              placeholder="https://…"
            />
          </label>
          <label className="sa-form-field sa-form-field-full">
            <span>Content *</span>
            <textarea
              value={form.content}
              onChange={(e) => setField('content', e.target.value)}
              rows={14}
              required
              placeholder="Use blank lines between paragraphs. Start a line with > for quotes."
            />
          </label>
        </div>

        <div className="sa-form-checks">
          <label className="sa-check">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setField('published', e.target.checked)}
            />
            Published (visible on public blog)
          </label>
          <label className="sa-check">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setField('featured', e.target.checked)}
            />
            Featured post
          </label>
        </div>

        <div className="sa-form-actions">
          <Link to="/admin/blog" className="sa-btn-outline">Cancel</Link>
          <button type="submit" className="sa-btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : isEdit ? 'Update post' : 'Create post'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SuperAdminBlogForm;
