import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../../components/web/Navbar';
import Footer from '../../../components/web/Footer';
import './BlogPost.css';

/* ─── Static demo data (replace with API call when ready) ─── */
const POST = {
  category: 'AI Strategy',
  date: 'May 24, 2024',
  readTime: '8 min read',
  title: 'The Future of School Management: 5 AI Tips to Transform Efficiency',
  author: {
    name: 'Dr. Amaka Okafor',
    role: 'Lead Strategist at EduCore AI',
    avatar: '/assets/author-amaka.png',
  },
  coverImage: '/assets/hero.png',
  tags: ['#EdTech', '#AI', '#SchoolManagement', '#NigeriaEducation'],
};

const RELATED = [
  { id: 1, category: 'Pedagogy', title: 'Reimagining the Classroom…', image: '/assets/hero.png' },
  { id: 2, category: 'Security', title: 'Protecting Student Data in…', image: '/assets/analytics-chart.png' },
  { id: 3, category: 'Leadership', title: 'Leading Your Staff Through…', image: '/assets/teacher-group.png' },
];

/* ─── Component ─────────────────────────────────────────── */
const BlogPost = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) { setSubscribed(true); setEmail(''); }
  };

  return (
    <div className="bp-root">
      <Navbar />

      {/* ── HERO ── */}
      <div className="bp-hero">
        <img
          src={POST.coverImage}
          alt={POST.title}
          className="bp-hero__img"
          onError={e => { e.target.style.display = 'none'; }}
        />
        <div className="bp-hero__overlay" />

        {/* Admin actions */}
        <div className="bp-hero__actions">
          <button className="bp-action-btn bp-action-btn--edit" onClick={() => navigate('/blog?edit=1')}>
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"/><path fillRule="evenodd" d="M2 16a1 1 0 011-1h2v1H3v1H2v-1zm0-2v-1h1v1H2zm17-9.586L16.414 2.828 15 4.243 17.172 6.414 19 4.586z" clipRule="evenodd"/></svg>
            Edit Post
          </button>
          <button className="bp-action-btn bp-action-btn--delete" onClick={() => setShowDeleteModal(true)}>
            <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
            Delete
          </button>
        </div>

        {/* Post meta over hero */}
        <div className="bp-hero__meta">
          <span className="bp-category">{POST.category}</span>
          <span className="bp-meta-text">{POST.date} · {POST.readTime}</span>
          <h1 className="bp-hero__title">{POST.title}</h1>
          <div className="bp-author">
            <div className="bp-author__avatar">
              <img src={POST.author.avatar} alt={POST.author.name} onError={e => { e.target.src = ''; e.target.style.background = '#6A5ACD'; }} />
              <span className="bp-author__initials">AO</span>
            </div>
            <div>
              <p className="bp-author__name">{POST.author.name}</p>
              <p className="bp-author__role">{POST.author.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="bp-body">
        <div className="bp-container bp-layout">

          {/* ── Article ── */}
          <article className="bp-article">

            {/* Intro */}
            <p className="bp-intro">
              <span className="bp-dropcap">I</span>n the rapidly evolving landscape of Nigerian education, the
              integration of Artificial Intelligence is no longer a luxury — it is a necessity. As
              administrators struggle with growing student populations and complex logistics, AI offers
              a streamlined path toward operational excellence.
            </p>

            {/* Section 1 */}
            <h2 className="bp-h2">1. Automated Attendance Tracking</h2>
            <p>
              Gone are the days of manual register call-outs. AI-powered biometric or facial recognition
              systems can sync directly with the EduCore AI dashboard, providing real-time data to
              parents and staff. This reduces administrative overhead by nearly 40% in the first term alone.
            </p>

            {/* AI Insight callout */}
            <div className="bp-insight">
              <div className="bp-insight__header">
                <span className="bp-insight__icon">
                  <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
                </span>
                <span className="bp-insight__label">AI INSIGHT</span>
              </div>
              <p>
                "Implementing automated attendance has shown a 15% increase in student punctuality across
                pilot schools in Lagos."
              </p>
            </div>

            {/* Section 2 */}
            <h2 className="bp-h2">2. Personalized Learning Paths</h2>
            <p>
              Every student learns at a different pace. Our AI modules analyze historical exam performance
              to suggest custom remedial sessions. This ensures that no student is left behind, especially
              in core subjects like Mathematics and English.
            </p>

            {/* Section 3 */}
            <h2 className="bp-h2">3. Predictive Fee Management</h2>
            <p>
              Financial stability is the backbone of any institution. AI algorithms can predict payment
              trends based on historical data, allowing bursars to send gentle, automated reminders to
              guardians before deficits become critical issues.
            </p>

            {/* Blockquote */}
            <blockquote className="bp-quote">
              "The goal of EduCore AI is not to replace the human touch in education, but to remove the
              robotic tasks from humans, allowing teachers to focus on what matters most: the students."
            </blockquote>

            {/* Conclusion */}
            <h2 className="bp-h2">Conclusion</h2>
            <p>
              As we look toward the 2024 academic year, the institutions that embrace digital
              transformation will be the ones that thrive. EduCore AI remains committed to providing
              the tools necessary for this evolution.
            </p>

            {/* Tags */}
            <div className="bp-tags">
              {POST.tags.map(tag => (
                <span key={tag} className="bp-tag">{tag}</span>
              ))}
            </div>
          </article>

          {/* ── Sidebar ── */}
          <aside className="bp-sidebar">

            {/* Newsletter card */}
            <div className="bp-newsletter">
              <div className="bp-newsletter__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <h3>Weekly Insights</h3>
              <p>Get the latest school management tips and AI updates directly in your inbox.</p>

              {subscribed ? (
                <div className="bp-newsletter__success">
                  <span>✅</span> You're subscribed! Check your inbox.
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="bp-newsletter__form">
                  <input
                    type="email"
                    placeholder="principal@school.edu.ng"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="bp-newsletter__input"
                  />
                  <button type="submit" className="bp-newsletter__btn">
                    Subscribe Now →
                  </button>
                </form>
              )}
            </div>

            {/* Related posts */}
            <div className="bp-related">
              <h4 className="bp-related__title">RELATED POSTS</h4>
              <div className="bp-related__list">
                {RELATED.map(p => (
                  <Link key={p.id} to={`/blog/${p.id}`} className="bp-related__item">
                    <div className="bp-related__thumb">
                      <img src={p.image} alt={p.title} onError={e => { e.target.style.display = 'none'; }} />
                    </div>
                    <div className="bp-related__info">
                      <span className="bp-related__cat">{p.category}</span>
                      <p className="bp-related__post-title">{p.title}</p>
                    </div>
                  </Link>
                ))}
              </div>
              <Link to="/blog" className="bp-related__view-all">View All Posts</Link>
            </div>
          </aside>
        </div>
      </div>

      <Footer />

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && (
        <div className="bp-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="bp-modal" onClick={e => e.stopPropagation()}>
            <div className="bp-modal__icon">
              <svg viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="24" fill="#FEE2E2"/>
                <path d="M24 16v10M24 32h.02M40 24c0 8.837-7.163 16-16 16S8 32.837 8 24 15.163 8 24 8s16 7.163 16 16z" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Delete Blog Post?</h3>
            <p>Are you sure you want to delete <strong>"{POST.title}"</strong>? This action cannot be undone.</p>
            <div className="bp-modal__actions">
              <button className="bp-modal__cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="bp-modal__confirm" onClick={() => { setShowDeleteModal(false); navigate('/blog'); }}>Delete Post</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogPost;
