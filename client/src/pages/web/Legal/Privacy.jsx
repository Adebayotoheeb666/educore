import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../../components/web/Navbar';
import Footer from '../../../components/web/Footer';
import './Legal.css';

const PrivacyPage = () => {
  return (
    <div className="legal-wrapper">
      <Navbar />

      <div className="legal-container">
        {/* Sidebar */}
        <aside className="legal-sidebar">
          <nav className="legal-nav">
            <h5 className="legal-nav-header">LEGAL DIRECTORY</h5>
            <Link to="#" className="legal-nav-item active">
              <span>📜</span> 1. Agreement
            </Link>
            <Link to="#" className="legal-nav-item">
              <span>📁</span> 2. Data Collection
            </Link>
            <Link to="#" className="legal-nav-item">
              <span>🛡️</span> 3. AI Security
            </Link>
            <Link to="#" className="legal-nav-item">
              <span>✅</span> 4. Compliance
            </Link>
            <Link to="#" className="legal-nav-item">
              <span>🛑</span> 5. Termination
            </Link>
          </nav>

          <div className="help-card">
            <div className="help-card-icon">💡</div>
            <h3>Need Help?</h3>
            <p>Our AI assistant can help clarify our legal terms in plain English.</p>
            <button className="btn-start-chat">Start Chat</button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="legal-content">
          <div className="last-updated">Last Updated: October 24, 2024</div>
          <h1>Legal Center & Governance</h1>
          <p className="legal-intro">
            EduCore AI is committed to transparency and the ethical use of artificial intelligence in the Nigerian education sector. This document outlines our Privacy Policy and Terms of Service.
          </p>

          {/* Section 1 */}
          <section className="legal-section">
            <div className="section-title">
              <div className="section-num">1</div>
              <h2>Agreement to Terms</h2>
            </div>
            <p>
              By accessing or using the EduCore AI platform ("the Service"), you agree to be bound by these Terms. If you are using the Service on behalf of a school, university, or educational institution, you represent that you have the legal authority to bind that entity to these terms.
            </p>
            <p>
              EduCore AI provides AI-driven administrative tools, automated grading, and student performance insights. Use of these tools requires adherence to our ethical AI usage guidelines which prohibit any discriminatory or harmful application of our algorithms.
            </p>
          </section>

          {/* Section 2 */}
          <section className="legal-section">
            <div className="section-title">
              <div className="section-num">2</div>
              <h2>Data Collection & Usage</h2>
            </div>
            <div className="collection-grid">
              <div className="collection-card">
                <h4>Student Information</h4>
                <p>We collect names, enrollment numbers, and academic performance data solely for the purpose of generating insights and automating reports as requested by the institution.</p>
              </div>
              <div className="collection-card">
                <h4>Technical Metadata</h4>
                <p>Browser types, IP addresses, and interaction logs are analyzed to optimize the platform performance and ensure security across different Nigerian network providers.</p>
              </div>
            </div>
            <div className="pro-tip">
              <span>💡</span>
              <p><strong>Pro-Tip for Admins:</strong> Data provided to EduCore AI is encrypted at rest and in transit. We do not sell educational data to third-party advertisers.</p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="legal-section">
            <div className="section-title">
              <div className="section-num">3</div>
              <h2>AI Security & Ethical Governance</h2>
            </div>
            <div className="security-grid">
              <div className="protection-card">
                <img src="/assets/analytics-chart.png" alt="Server room" />
                <div className="protection-card-overlay"></div>
                <h3>State-of-the-art Protection</h3>
                <p>Our models are trained on air-gapped systems to ensure institutional intellectual property remains isolated from public AI datasets.</p>
              </div>
              <div className="uptime-card">
                <h3>99.9%</h3>
                <h4>Uptime Guarantee</h4>
                <p>Continuous monitoring for biases and algorithmic drift.</p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="legal-section">
            <div className="section-title">
              <div className="section-num">4</div>
              <h2>Compliance & Local Regulation</h2>
            </div>
            <p>
              EduCore AI operates in accordance with the <strong>Nigeria Data Protection Regulation (NDPR)</strong>. We ensure that all data processing activities respecting the rights of Nigerian students and educators.
            </p>
            <div className="compliance-grid">
              <div className="compliance-card">
                <span>🛡️ NDPR Compliant</span>
              </div>
              <div className="compliance-card">
                <span>🔒 AES-256 Encryption</span>
              </div>
              <div className="compliance-card">
                <span>📝 Audit Trails</span>
              </div>
              <div className="compliance-card">
                <span>🏛️ NITDA Guidelines</span>
              </div>
            </div>
          </section>

          {/* Questions */}
          <div className="legal-footer-actions">
            <div>
              <h3>Questions about these terms?</h3>
              <p>Our legal team is available for consultation with partner institutions.</p>
            </div>
            <div className="legal-btns">
              <button className="btn-download">Download PDF</button>
              <button className="btn-contact-legal">Contact Legal</button>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default PrivacyPage;
