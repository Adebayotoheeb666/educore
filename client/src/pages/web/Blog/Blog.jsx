import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import Navbar from '../../../components/web/Navbar';
import Footer from '../../../components/web/Footer';
import blogService from '../../../services/blogService';
import './Blog.css';

const CATEGORIES = [
  'All Posts',
  'Company News',
  'Educational Tips',
  'AI in Classroom',
  'Case Studies',
];

const BLOG_ADMIN_ROLES = ['super_admin', 'school_owner', 'admin_staff'];

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

const Blog = () => {
  const { user } = useSelector((s) => s.auth);
  const [activeCategory, setActiveCategory] = useState('All Posts');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);

  const canManage = user && BLOG_ADMIN_ROLES.includes(user.role);

  const loadPosts = useCallback(() => {
    setLoading(true);
    blogService
      .getPosts({
        page,
        limit: 9,
        category: activeCategory === 'All Posts' ? '' : activeCategory,
      })
      .then((data) => {
        setPosts(data.blogPosts || []);
        setTotalPages(data.totalPages || 1);
        setTotalPosts(data.totalPosts || 0);
      })
      .catch(() => toast.error('Failed to load blog posts'))
      .finally(() => setLoading(false));
  }, [page, activeCategory]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const featuredPost = useMemo(
    () => posts.find((p) => p.featured) || posts[0],
    [posts]
  );

  const gridPosts = useMemo(
    () => posts.filter((p) => p._id !== featuredPost?._id),
    [posts, featuredPost]
  );

  const pageStart = totalPosts === 0 ? 0 : (page - 1) * 9 + 1;
  const pageEnd = Math.min(page * 9, totalPosts);

  return (
    <div className="blog-wrapper">
      <Navbar />

      <div className="blog-container">
        <header className="blog-header">
          <div className="blog-header-content">
            <h1>Knowledge Hub</h1>
            <p>Updates, insights, and resources from the EduCore AI team.</p>
          </div>
          {canManage && (
            <Link to="/dashboard" className="btn-create-post">
              <span>+</span> Manage from Dashboard
            </Link>
          )}
        </header>

        <nav className="blog-categories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => {
                setActiveCategory(cat);
                setPage(1);
              }}
            >
              {cat}
            </button>
          ))}
        </nav>

        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
            <div className="spinner-border text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
            <p>No posts yet. Run <code>node scripts/seedBlogPosts.js</code> on the server to add sample articles.</p>
          </div>
        ) : (
          <>
            {featuredPost && (
              <section className="featured-post">
                <div className="featured-post-card">
                  <div className="featured-post-image">
                    <img
                      src={featuredPost.coverImage || '/assets/teacher-main.png'}
                      alt={featuredPost.title}
                      onError={(e) => { e.target.src = '/assets/hero.png'; }}
                    />
                  </div>
                  <div className="featured-post-content">
                    <div className="badge-container">
                      <span className="badge badge-featured">FEATURED</span>
                      {featuredPost.category && (
                        <span className="badge badge-ai">{featuredPost.category.toUpperCase()}</span>
                      )}
                    </div>
                    <h2>{featuredPost.title}</h2>
                    <p>{featuredPost.subtitle || featuredPost.content?.slice(0, 200)}</p>
                    <div className="post-footer">
                      <div className="author-info">
                        <span>{featuredPost.author?.name || 'EduCore Team'}</span>
                        <span className="read-time">• {featuredPost.readTime || '5 min read'}</span>
                      </div>
                      <Link to={`/blog/${featuredPost._id}`} className="read-more">
                        Read More <span>→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className="blog-grid">
              {gridPosts.map((post) => (
                <div key={post._id} className="post-card">
                  <div className="post-card-image">
                    <img
                      src={post.coverImage || '/assets/hero.png'}
                      alt={post.title}
                      onError={(e) => { e.target.src = '/assets/hero.png'; }}
                    />
                    <span className="post-card-category">{(post.category || 'NEWS').toUpperCase()}</span>
                  </div>
                  <div className="post-card-content">
                    <h3>{post.title}</h3>
                    <p>{post.subtitle || post.content?.slice(0, 120)}</p>
                    <div className="post-card-footer">
                      <span className="post-date">{formatDate(post.createdAt)}</span>
                      <Link to={`/blog/${post._id}`} className="read-more">
                        Read More
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </section>

            {totalPages > 1 && (
              <footer className="pagination">
                <div className="pagination-info">
                  Showing {pageStart} to {pageEnd} of {totalPosts} posts
                </div>
                <div className="pagination-controls">
                  <button
                    type="button"
                    className="page-btn arrow"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                    .map((n, idx, arr) => {
                      const prev = arr[idx - 1];
                      const showEllipsis = prev && n - prev > 1;
                      return (
                        <React.Fragment key={n}>
                          {showEllipsis && <span className="pagination-info">...</span>}
                          <button
                            type="button"
                            className={`page-btn ${page === n ? 'active' : ''}`}
                            onClick={() => setPage(n)}
                          >
                            {n}
                          </button>
                        </React.Fragment>
                      );
                    })}
                  <button
                    type="button"
                    className="page-btn arrow"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    ›
                  </button>
                </div>
              </footer>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Blog;
