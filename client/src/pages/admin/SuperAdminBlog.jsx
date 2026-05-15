import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  getAdminBlogPosts,
  deleteAdminBlogPost,
} from '../../services/adminService';
import './SuperAdmin.css';

const CATEGORIES = [
  'All',
  'Company News',
  'Educational Tips',
  'AI in Classroom',
  'Case Studies',
  'AI Strategy',
];

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const SuperAdminBlog = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [publishedFilter, setPublishedFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getAdminBlogPosts({
      page,
      limit: 15,
      search: search.trim() || undefined,
      category: category === 'All' ? undefined : category,
      published: publishedFilter || undefined,
    })
      .then((data) => {
        setPosts(data.blogPosts || []);
        setTotalPages(data.totalPages || 1);
        setTotalPosts(data.totalPosts || 0);
      })
      .catch(() => toast.error('Failed to load blog posts'))
      .finally(() => setLoading(false));
  }, [page, search, category, publishedFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteAdminBlogPost(deleteId);
      toast.success('Post deleted');
      setDeleteId(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete post');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="super-admin-page">
      <div className="sa-welcome-row">
        <div>
          <h2>Blog posts</h2>
          <p>{totalPosts} post{totalPosts === 1 ? '' : 's'} · create, edit, publish, and delete platform articles</p>
        </div>
        <div className="sa-header-actions">
          <Link to="/blog" target="_blank" rel="noreferrer" className="sa-btn-outline">
            View public blog
          </Link>
          <Link to="/admin/blog/new" className="sa-btn-primary">
            + New post
          </Link>
        </div>
      </div>

      <section className="sa-panel sa-blog-toolbar">
        <form onSubmit={handleSearch} className="sa-blog-filters">
          <input
            type="search"
            placeholder="Search title or subtitle…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sa-blog-input"
          />
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="sa-blog-select"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={publishedFilter}
            onChange={(e) => { setPublishedFilter(e.target.value); setPage(1); }}
            className="sa-blog-select"
          >
            <option value="">All statuses</option>
            <option value="true">Published</option>
            <option value="false">Draft</option>
          </select>
          <button type="submit" className="sa-btn-outline">Search</button>
        </form>
      </section>

      <section className="sa-panel sa-blog-table-wrap">
        {loading ? (
          <div className="d-flex justify-content-center py-5">
            <div className="spinner-border text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <p className="sa-empty">No blog posts match your filters.</p>
        ) : (
          <div className="sa-blog-table-scroll">
            <table className="sa-blog-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Views</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post._id}>
                    <td>
                      <strong>{post.title}</strong>
                      {post.featured && <span className="sa-blog-featured">Featured</span>}
                      <div className="sa-list-meta">{post.subtitle?.slice(0, 80)}{(post.subtitle?.length > 80 ? '…' : '')}</div>
                    </td>
                    <td>{post.category}</td>
                    <td>
                      <span className={`sa-blog-status ${post.published ? 'published' : 'draft'}`}>
                        {post.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td>{post.views ?? 0}</td>
                    <td>{formatDate(post.createdAt)}</td>
                    <td className="sa-blog-actions">
                      <Link to={`/blog/${post._id}`} target="_blank" rel="noreferrer" className="sa-blog-action-link">
                        View
                      </Link>
                      <button
                        type="button"
                        className="sa-blog-action-link"
                        onClick={() => navigate(`/admin/blog/${post._id}/edit`)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="sa-blog-action-link danger"
                        onClick={() => setDeleteId(post._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="sa-blog-pagination">
            <button type="button" className="sa-btn-outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <span className="sa-list-meta">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="sa-btn-outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </section>

      {deleteId && (
        <div className="sa-modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete this post?</h3>
            <p>This action cannot be undone.</p>
            <div className="sa-modal-actions">
              <button type="button" className="sa-btn-outline" onClick={() => setDeleteId(null)}>Cancel</button>
              <button type="button" className="sa-btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminBlog;
