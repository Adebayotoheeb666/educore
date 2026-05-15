import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import Navbar from '../../../components/web/Navbar';
import Footer from '../../../components/web/Footer';
import blogService from '../../../services/blogService';
import './BlogPost.css';

const BLOG_ADMIN_ROLES = ['super_admin', 'school_owner', 'admin_staff'];

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-NG', { month: 'long', day: 'numeric', year: 'numeric' })
    : '';

const renderContent = (content) => {
  if (!content) return null;
  const blocks = content.split(/\n\n+/).filter(Boolean);
  return blocks.map((block, i) => {
    const trimmed = block.trim();
    if (trimmed.startsWith('>')) {
      return (
        <blockquote key={i} className="bp-quote">
          {trimmed.replace(/^>\s?/, '')}
        </blockquote>
      );
    }
    if (/^\d+\.\s/.test(trimmed)) {
      const items = trimmed.split('\n').filter((l) => l.trim());
      return (
        <ol key={i} style={{ marginBottom: '1.5rem', paddingLeft: '1.5rem', lineHeight: 1.8 }}>
          {items.map((item, j) => (
            <li key={j}>{item.replace(/^\d+\.\s/, '')}</li>
          ))}
        </ol>
      );
    }
    return <p key={i}>{trimmed}</p>;
  });
};

const BlogPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canManage = user && BLOG_ADMIN_ROLES.includes(user.role);

  useEffect(() => {
    setLoading(true);
    blogService
      .getPost(id)
      .then((data) => {
        setPost(data);
        return blogService.getPosts({
          category: data.category,
          limit: 4,
          page: 1,
        });
      })
      .then((list) => {
        setRelated((list.blogPosts || []).filter((p) => p._id !== id).slice(0, 3));
      })
      .catch(() => {
        setPost(null);
        toast.error('Failed to load blog post');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      toast.success('Thanks for subscribing!');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await blogService.deletePost(id);
      toast.success('Post deleted');
      navigate('/blog');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete post');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="bp-root">
        <Navbar />
        <div style={{ padding: '6rem', textAlign: 'center' }}>
          <div className="spinner-border text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="bp-root">
        <Navbar />
        <div style={{ padding: '6rem', textAlign: 'center' }}>
          <h2>Post not found</h2>
          <Link to="/blog" className="bp-related__view-all">Back to Knowledge Hub</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const authorInitials = (post.author?.name || 'ET')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bp-root">
      <Navbar />

      <div className="bp-hero">
        <img
          src={post.coverImage || '/assets/hero.png'}
          alt={post.title}
          className="bp-hero__img"
          onError={(e) => { e.target.src = '/assets/hero.png'; }}
        />
        <div className="bp-hero__overlay" />

        {canManage && (
          <div className="bp-hero__actions">
            {user.role === 'super_admin' && (
              <Link
                to={`/admin/blog/${id}/edit`}
                className="bp-action-btn"
                style={{ textDecoration: 'none', marginRight: '0.5rem' }}
              >
                Edit
              </Link>
            )}
            <button
              type="button"
              className="bp-action-btn bp-action-btn--delete"
              onClick={() => setShowDeleteModal(true)}
            >
              <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              Delete
            </button>
          </div>
        )}

        <div className="bp-hero__meta">
          <span className="bp-category">{post.category || 'Article'}</span>
          <span className="bp-meta-text">
            {formatDate(post.createdAt)} · {post.readTime || '5 min read'}
          </span>
          <h1 className="bp-hero__title">{post.title}</h1>
          {post.subtitle && <p style={{ fontSize: '1.2rem', opacity: 0.9, marginTop: '0.5rem' }}>{post.subtitle}</p>}
          <div className="bp-author">
            <div className="bp-author__avatar">
              {post.author?.avatar ? (
                <img src={post.author.avatar} alt={post.author.name} onError={(e) => { e.target.style.display = 'none'; }} />
              ) : null}
              <span className="bp-author__initials">{authorInitials}</span>
            </div>
            <div>
              <p className="bp-author__name">{post.author?.name || 'EduCore Team'}</p>
              <p className="bp-author__role">{post.author?.role || 'EduCore AI'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bp-body">
        <div className="bp-container bp-layout">
          <article className="bp-article">
            {renderContent(post.content)}
            {(post.tags || []).length > 0 && (
              <div className="bp-tags">
                {post.tags.map((tag) => (
                  <span key={tag} className="bp-tag">{tag.startsWith('#') ? tag : `#${tag}`}</span>
                ))}
              </div>
            )}
          </article>

          <aside className="bp-sidebar">
            <div className="bp-newsletter">
              <div className="bp-newsletter__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3>Weekly Insights</h3>
              <p>Get the latest school management tips and product updates in your inbox.</p>
              {subscribed ? (
                <div className="bp-newsletter__success">
                  <span>✅</span> You&apos;re subscribed! Check your inbox.
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="bp-newsletter__form">
                  <input
                    type="email"
                    placeholder="principal@school.edu.ng"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bp-newsletter__input"
                  />
                  <button type="submit" className="bp-newsletter__btn">
                    Subscribe Now →
                  </button>
                </form>
              )}
            </div>

            <div className="bp-related">
              <h4 className="bp-related__title">RELATED POSTS</h4>
              <div className="bp-related__list">
                {related.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No related posts yet.</p>
                ) : (
                  related.map((p) => (
                    <Link key={p._id} to={`/blog/${p._id}`} className="bp-related__item">
                      <div className="bp-related__thumb">
                        <img
                          src={p.coverImage || '/assets/hero.png'}
                          alt={p.title}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                      <div className="bp-related__info">
                        <span className="bp-related__cat">{p.category}</span>
                        <p className="bp-related__post-title">{p.title}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
              <Link to="/blog" className="bp-related__view-all">View All Posts</Link>
            </div>
          </aside>
        </div>
      </div>

      <Footer />

      {showDeleteModal && (
        <div className="bp-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="bp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bp-modal__icon">
              <svg viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="24" fill="#FEE2E2" />
                <path d="M24 16v10M24 32h.02M40 24c0 8.837-7.163 16-16 16S8 32.837 8 24 15.163 8 24 8s16 7.163 16 16z" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3>Delete Blog Post?</h3>
            <p>Are you sure you want to delete <strong>&quot;{post.title}&quot;</strong>? This cannot be undone.</p>
            <div className="bp-modal__actions">
              <button type="button" className="bp-modal__cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button type="button" className="bp-modal__confirm" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogPost;
