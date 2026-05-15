import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../../components/web/Navbar';
import Footer from '../../../components/web/Footer';
import './Contact.css';

const ContactPage = () => {
  return (
    <div className="contact-wrapper">
      <Navbar />

      {/* Hero */}
      <section className="contact-hero animate__animated animate__fadeInDown">
        <div className="contact-container animate__animated animate__fadeInLeft animate__delay-1s">
          <div className="help-badge">
            <span>✨</span> WE ARE HERE TO HELP
          </div>
          <h1>Get in Touch</h1>
          <p>
            Have questions about integrating EduCore AI into your school? Our team of
            educational technology experts is ready to assist you.
          </p>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="contact-main">
        <div className="contact-container">
          <div className="contact-grid">
            
            {/* Left Column: Office Info */}
            <aside className="office-card">
              <h2>Our Offices</h2>
              
              <div className="contact-method">
                <div className="contact-icon">📍</div>
                <div className="contact-details">
                  <h4>Lagos Headquarters</h4>
                  <p>42 Tech Plaza, Victoria Island,<br />Lagos State, Nigeria</p>
                </div>
              </div>

              <div className="contact-method">
                <div className="contact-icon">🏢</div>
                <div className="contact-details">
                  <h4>Abuja Regional Office</h4>
                  <p>Suite 105, Unity House, Garki Area 11,<br />FCT Abuja, Nigeria</p>
                </div>
              </div>

              <div className="contact-method">
                <div className="contact-icon">📧</div>
                <div className="contact-details">
                  <h4>Email Us</h4>
                  <p>support@educore.ai<br />partnerships@educore.ai</p>
                </div>
              </div>

              <div className="contact-method">
                <div className="contact-icon">📞</div>
                <div className="contact-details">
                  <h4>Call Support</h4>
                  <p>+234 (0) 800 EDU CORE<br />+234 1 234 5678</p>
                </div>
              </div>

              <div className="map-placeholder">
                <img src="/assets/analytics-chart.png" alt="Map Location" />
              </div>
            </aside>

            {/* Right Column: Contact Form */}
            <main className="form-card">
              <h2>Send a Message</h2>
              <p>Fill out the form below and an AI implementation specialist will contact you within 24 hours.</p>
              
              <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" placeholder="e.g. Adebayo Smith" />
                </div>
                <div className="form-group">
                  <label>School Name</label>
                  <input type="text" placeholder="e.g. Bright Minds Academy" />
                </div>
                <div className="form-group full">
                  <label>Email Address</label>
                  <input type="email" placeholder="name@school.edu.ng" />
                </div>
                <div className="form-group full">
                  <label>Subject</label>
                  <select>
                    <option>Select a topic</option>
                    <option>School Onboarding</option>
                    <option>Demo Request</option>
                    <option>Pricing Inquiry</option>
                    <option>Technical Support</option>
                  </select>
                </div>
                <div className="form-group full">
                  <label>Message</label>
                  <textarea rows="5" placeholder="Tell us about your school's needs..."></textarea>
                </div>
                
                <button type="submit" className="btn-send">
                  Send Message <span>➤</span>
                </button>
              </form>

              <div className="ndpr-note">
                <span>🛡️</span>
                <p>Your data is encrypted and managed according to Nigerian Data Protection Regulations (NDPR).</p>
              </div>
            </main>

          </div>
        </div>
      </section>

      {/* Quick Answers Section */}
      <section className="quick-answers">
        <div className="contact-container">
          <h2>Quick Answers?</h2>
          <p>Visit our support center for instant guides on setup, attendance tracking, and AI grading features.</p>
          <div className="qa-buttons">
            <Link to="/support" className="btn-qa-primary">Go to Support Center</Link>
            <Link to="/blog" className="btn-qa-secondary">Read Knowledge Base</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactPage;
