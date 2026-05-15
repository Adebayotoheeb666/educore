import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../../components/web/Navbar';
import Footer from '../../../components/web/Footer';
import './Blog.css';

const Blog = () => {
  const [activeCategory, setActiveCategory] = useState('All Posts');

  const categories = [
    'All Posts',
    'Company News',
    'Educational Tips',
    'AI in Classroom',
    'Case Studies'
  ];

  const featuredPost = {
    id: 1,
    title: 'The Future of Personalized Learning in Nigerian Schools',
    description: 'Discover how EduCore AI is revolutionizing the classroom experience by tailoring education to every student’s unique pace and style. Our new AI-driven modules are setting a new standard for local education...',
    image: '/assets/teacher-main.png',
    author: 'Dr. Amaka Okafor',
    readTime: '5 min read',
    badges: ['AI INSIGHTS', 'FEATURED']
  };

  const posts = [
    {
      id: 2,
      category: 'COMPANY NEWS',
      title: 'Expanding our Reach: 50 New Schools Joined EduCore',
      description: 'Our mission to digitize Nigerian education continues as we welcome 50 more institutions into our ecosystem this quarter...',
      image: '/assets/analytics-chart.png',
      date: 'Oct 12, 2024'
    },
    {
      id: 3,
      category: 'EDUCATIONAL TIPS',
      title: '10 Tips for Effective Digital Grading and Feedback',
      description: 'Learn how to use AI-assisted tools to provide meaningful feedback to students without spending hours on manual grading...',
      image: '/assets/hero.png',
      date: 'Oct 10, 2024'
    },
    {
      id: 4,
      isSpecial: true,
      category: 'AI GENERATED INSIGHT',
      title: 'Predictive Analytics: Identifying At-Risk Students Early',
      description: 'Our latest AI update can now predict potential drop-offs with 94% accuracy, allowing for immediate teacher intervention.',
      btnText: 'Access Full Report'
    },
    {
      id: 5,
      category: 'CASE STUDIES',
      title: 'Case Study: Government College Lagos Attendance Surge',
      description: 'How automated attendance alerts improved student presence by 22% in the first term of implementation...',
      image: '/assets/teacher-group.png',
      date: 'Oct 05, 2024'
    },
    {
      id: 6,
      category: 'AI IN CLASSROOM',
      title: 'Integrating AI Without Losing the Human Touch',
      description: 'Best practices for teachers to maintain emotional connection while utilizing AI for administrative and repetitive tasks...',
      image: '/assets/parent_portal.png',
      date: 'Sept 28, 2024'
    }
  ];

  return (
    <div className="blog-wrapper">
      <Navbar />

      <div className="blog-container">
        {/* Header */}
        <header className="blog-header">
          <div className="blog-header-content">
            <h1>Knowledge Hub</h1>
            <p>Updates, insights, and resources from the EduCore AI team.</p>
          </div>
          <Link to="/blog/create" className="btn-create-post">
            <span>+</span> Create New Post
          </Link>
        </header>

        {/* Categories */}
        <nav className="blog-categories">
          {categories.map((cat) => (
            <div
              key={cat}
              className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </div>
          ))}
        </nav>

        {/* Featured Post */}
        <section className="featured-post">
          <div className="featured-post-card">
            <div className="featured-post-image">
              <img src={featuredPost.image} alt={featuredPost.title} />
            </div>
            <div className="featured-post-content">
              <div className="badge-container">
                {featuredPost.badges.map((badge) => (
                  <span key={badge} className={`badge ${badge === 'AI INSIGHTS' ? 'badge-ai' : 'badge-featured'}`}>
                    {badge}
                  </span>
                ))}
              </div>
              <h2>{featuredPost.title}</h2>
              <p>{featuredPost.description}</p>
              <div className="post-footer">
                <div className="author-info">
                  <span>{featuredPost.author}</span>
                  <span className="read-time">• {featuredPost.readTime}</span>
                </div>
                <Link to={`/blog/${featuredPost.id}`} className="read-more">
                  Read More <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Post Grid */}
        <section className="blog-grid">
          {posts.map((post) => (
            post.isSpecial ? (
              <div key={post.id} className="post-card insight-card">
                <div className="insight-header">
                  <span>{post.category}</span>
                </div>
                <h3>{post.title}</h3>
                <p>{post.description}</p>
                <Link to={`/blog/${post.id}`} className="btn-insight">
                  {post.btnText}
                </Link>
              </div>
            ) : (
              <div key={post.id} className="post-card">
                <div className="post-card-image">
                  <img src={post.image} alt={post.title} />
                  <span className="post-card-category">{post.category}</span>
                </div>
                <div className="post-card-content">
                  <h3>{post.title}</h3>
                  <p>{post.description}</p>
                  <div className="post-card-footer">
                    <span className="post-date">{post.date}</span>
                    <Link to={`/blog/${post.id}`} className="read-more">
                      Read More
                    </Link>
                  </div>
                </div>
              </div>
            )
          ))}
        </section>

        {/* Pagination */}
        <footer className="pagination">
          <div className="pagination-info">
            Showing 1 to 6 of 42 posts
          </div>
          <div className="pagination-controls">
            <button className="page-btn arrow">‹</button>
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">3</button>
            <span className="pagination-info">...</span>
            <button className="page-btn">7</button>
            <button className="page-btn arrow">›</button>
          </div>
        </footer>
      </div>
      <Footer />
    </div>
  );
};

export default Blog;
