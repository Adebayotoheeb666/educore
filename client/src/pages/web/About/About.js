import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../../components/web/Navbar';
import Footer from '../../../components/web/Footer';
import './About.css';

const AboutPage = () => {
  return (
    <div className="about-wrapper">
      <Navbar />

      {/* Hero Section */}
      <section className="about-hero animate__animated animate__fadeInDown">
        <img src="/assets/teacher-main.png" alt="Classroom" className="about-hero-bg" />
        <div className="about-hero-overlay"></div>
        <div className="about-container animate__animated animate__fadeInLeft animate__delay-1s">
          <div className="mission-badge">OUR MISSION</div>
          <h1>Revolutionizing Nigerian Education Through Intelligence.</h1>
          <p>
            At EduCore AI, we bridge the gap between traditional learning and the
            digital future, providing administrators with the tools to empower the next
            generation of Nigerian leaders.
          </p>
          <div className="hero-btns">
            <Link to="/contact-us" className="btn-about-primary">Our Impact</Link>
            <Link to="/blog" className="btn-about-outline">Watch Story</Link>
          </div>
        </div>
      </section>

      {/* Excellence Section */}
      <section className="excellence-section">
        <div className="about-container">
          <div className="excellence-grid">
            <div className="excellence-image">
              <img src="/assets/teacher-group.png" alt="Team collaborating" className="main-img" />
              <div className="journey-box">
                <h4>2022</h4>
                <p>The year our journey to redefine school management began.</p>
              </div>
            </div>
            <div className="excellence-content">
              <h2>A Commitment to Excellence</h2>
              <p>
                EduCore AI was born in the heart of Lagos with a singular vision: to solve the complex administrative challenges facing Nigerian schools. We recognized that for education to thrive, teachers need time to teach, and administrators need data to lead.
              </p>
              <p>
                By leveraging artificial intelligence tailored specifically for our unique educational landscape, we've created a system that handles the heavy lifting—from automated attendance to predictive academic insights.
              </p>
              
              <div className="excellence-features">
                <div className="excellence-feat">
                  <div className="feat-icon">📍</div>
                  <div className="feat-text">
                    <h4>Locally Rooted</h4>
                    <p>Designed for the specific needs of Nigerian public and private institutions.</p>
                  </div>
                </div>
                <div className="excellence-feat">
                  <div className="feat-icon">📈</div>
                  <div className="feat-text">
                    <h4>Scalable Innovation</h4>
                    <p>Built to grow with your school, from 100 students to 10,000.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* By the Numbers Section */}
      <section className="about-stats">
        <div className="about-container">
          <div className="stats-header">
            <h2>By the Numbers</h2>
            <p>Our growth is a testament to the trust schools place in our AI-driven ecosystem.</p>
          </div>
          <div className="about-stats-grid">
            <div className="stat-card">
              <div className="stat-card-icon">📅</div>
              <h3>2022</h3>
              <p>Year Founded</p>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon">🎧</div>
              <h3>24/7</h3>
              <p>Dedicated Support</p>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon">👥</div>
              <h3>50+</h3>
              <p>Team of Educators</p>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon">🎓</div>
              <h3>250+</h3>
              <p>Schools Empowered</p>
            </div>
          </div>
        </div>
      </section>

      {/* Empowering Teachers Section */}
      <section className="empower-section">
        <div className="about-container">
          <div className="empower-grid">
            <div className="empower-main-card">
              <div className="brain-icon">🧠</div>
              <div className="empower-badge">✨ AI EXCELLENCE</div>
              <h2>Empowering Teachers, Not Replacing Them.</h2>
              <p>
                Our AI modules are designed to assist educators by automating grading, identifying struggling students early, and creating personalized learning paths.
              </p>
            </div>
            <div className="empower-side">
              <div className="side-card side-card-blue">
                <h4>Academic Gold</h4>
                <p>Our proprietary algorithm for predicting student success rates with 98% accuracy.</p>
                <div className="avatars">
                  <div className="avatar"></div>
                  <div className="avatar"></div>
                  <div className="avatar"></div>
                </div>
              </div>
              <div className="side-card side-card-green">
                <h4>Global Standards</h4>
                <p>Meeting international data privacy and educational compliance standards.</p>
                <Link to="/privacy" className="learn-more">Learn More</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
