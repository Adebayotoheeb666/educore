import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from '../../../components/web/Navbar';
import Footer from '../../../components/web/Footer';
import '../Home/Homepage.css'; // Reuse homepage styles

const ForSchools = () => {
  const { isAuthenticated } = useSelector(s => s.auth);

  return (
    <div className="homepage-wrapper">
      <Navbar />

      {/* Hero */}
      <header className="hp-hero animate__animated animate__fadeInDown" style={{ background: 'linear-gradient(135deg, #f3f0ff 0%, #fff 100%)', padding: '12rem 0 6rem' }}>
        <div className="hp-container text-center animate__animated animate__fadeInLeft animate__delay-1s">
          <span className="hp-badge">BUILT FOR SCALE</span>
          <h1 style={{ fontSize: '4rem', fontWeight: 900, marginBottom: '2rem' }}>
            The Digital Backbone for<br />Modern Nigerian Schools
          </h1>
          <p style={{ fontSize: '1.7rem', color: '#4b5563', maxWidth: '800px', margin: '0 auto 3rem' }}>
            From single-campus primary schools to large multi-state secondary school networks, 
            EduCore AI provides the tools to manage every academic and administrative detail.
          </p>
          <div className="hp-hero__btns" style={{ justifyContent: 'center' }}>
            <Link to="/register" className="hp-btn hp-btn--primary">Register Your School</Link>
            <Link to="/contact-us" className="hp-btn hp-btn--ghost">Request a Demo</Link>
          </div>
        </div>
      </header>

      {/* Operational Efficiency */}
      <section style={{ padding: '8rem 0', background: '#fff' }}>
        <div className="hp-container">
          <div className="row align-items-center">
            <div className="col-md-6">
              <span className="hp-section-tag">OPERATIONAL EFFICIENCY</span>
              <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '2rem' }}>Transform Your Workflow.</h2>
              <p style={{ fontSize: '1.6rem', color: '#4b5563', lineHeight: '1.7' }}>
                EduCore AI reduces the administrative burden on your staff, allowing them to focus on teaching and student development.
              </p>
              <ul style={{ listStyle: 'none', marginTop: '2rem', padding: 0 }}>
                <li style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>⏱️ <strong>Reduce Computation Time</strong> — Results computed in minutes, not days.</li>
                <li style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>📄 <strong>Automated Report Cards</strong> — Eliminate manual entry with school-branded generation.</li>
                <li style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>🎯 <strong>Cut Prep Time by 70%</strong> — AI-generated exams and lesson plans.</li>
              </ul>
            </div>
            <div className="col-md-6">
              <div style={{ background: '#f3f0ff', border: '1px solid #c8c1e8', padding: '4rem', borderRadius: '24px' }}>
                <h4 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '2rem' }}>Impact Metrics</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1.4rem' }}>Result Computation</span>
                      <span style={{ fontSize: '1.4rem', fontWeight: 700 }}>95% Faster</span>
                    </div>
                    <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px' }}>
                      <div style={{ height: '100%', width: '95%', background: '#6A5ACD', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1.4rem' }}>Exam Preparation</span>
                      <span style={{ fontSize: '1.4rem', fontWeight: 700 }}>70% Faster</span>
                    </div>
                    <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px' }}>
                      <div style={{ height: '100%', width: '70%', background: '#6A5ACD', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Financial Control */}
      <section style={{ padding: '8rem 0', background: '#f8fafc' }}>
        <div className="hp-container">
          <div className="row align-items-center flex-row-reverse">
            <div className="col-md-6">
              <span className="hp-section-tag">FINANCIAL CONTROL</span>
              <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '2rem' }}>Stop Revenue Leakage.</h2>
              <p style={{ fontSize: '1.6rem', color: '#4b5563', lineHeight: '1.7' }}>
                Take complete control of your school's finances with real-time visibility into collections and outstanding debts.
              </p>
              <ul style={{ listStyle: 'none', marginTop: '2rem', padding: 0 }}>
                <li style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>💳 <strong>Installment Tracking</strong> — Manage partial payments with ease.</li>
                <li style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>🔔 <strong>Fee Defaulter Alerts</strong> — Automatic reminders for outstanding balances.</li>
                <li style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>📊 <strong>Revenue Reports</strong> — Daily collection summaries and term revenue insights.</li>
              </ul>
            </div>
            <div className="col-md-6">
              <div style={{ background: '#fff', padding: '3rem', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                <div style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h5 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>Fee Collection Summary</h5>
                  <span style={{ fontSize: '1.2rem', color: '#6A5ACD', background: '#f3f0ff', padding: '0.4rem 1rem', borderRadius: '50px' }}>Term 2</span>
                </div>
                <div style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '1rem' }}>₦4,250,000</div>
                <div style={{ fontSize: '1.3rem', color: '#64748b' }}>Total collected this term</div>
                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1, height: '4px', background: '#6A5ACD', borderRadius: '2px' }}></div>
                  <div style={{ flex: 0.4, height: '4px', background: '#e5e7eb', borderRadius: '2px' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Campus Section */}
      <section style={{ padding: '8rem 0', background: '#fff' }}>
        <div className="hp-container">
          <div className="row align-items-center">
            <div className="col-md-6">
              <span className="hp-section-tag">MULTI-CAMPUS MANAGEMENT</span>
              <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '2rem' }}>One Dashboard. Every Campus.</h2>
              <p style={{ fontSize: '1.6rem', color: '#4b5563', lineHeight: '1.7' }}>
                Manage multiple school branches from a single central account. Monitor attendance, 
                fee collection, and academic performance across all locations in real-time.
              </p>
            </div>
            <div className="col-md-6 text-center">
              <div style={{ background: '#2d2460', padding: '3rem', borderRadius: '24px', color: '#fff' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1.5rem' }}>Centralized Staff Management</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1.5rem' }}>Unified Financial Reporting</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>Cross-Campus Benchmarking</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Tiers */}
      <section style={{ padding: '8rem 0', background: '#f9fafb' }}>
        <div className="hp-container">
          <div className="hp-section-head">
            <h2>Flexible Plans for Every Size</h2>
            <p>Choose the tier that fits your school's current needs and scale as you grow.</p>
          </div>
          <div className="row g-4">
            {[
              { name: 'Basic', price: 'Free', features: ['Up to 50 Students', 'Digital Attendance', 'Basic Result Entry', 'Parent Notifications'] },
              { name: 'Standard', price: 'Contact Us', features: ['Unlimited Students', 'AI Lesson Plans', 'AI Exam Generator', 'Fee Installments', 'EMIS Reports'] },
              { name: 'Professional', price: 'Contact Us', features: ['Multi-Campus Support', 'Advanced Analytics', 'Library Management', 'Priority Support', 'Custom Domain'] },
            ].map(tier => (
              <div key={tier.name} className="col-md-4">
                <div className="card h-100 p-5 border-0 shadow-sm" style={{ borderRadius: '20px' }}>
                  <h3 style={{ fontSize: '2rem', fontWeight: 800 }}>{tier.name}</h3>
                  <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#6A5ACD', margin: '1rem 0 2rem' }}>{tier.price}</div>
                  <ul style={{ listStyle: 'none', padding: 0, marginBottom: '3rem' }}>
                    {tier.features.map(f => (
                      <li key={f} style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>✓ {f}</li>
                    ))}
                  </ul>
                  <Link to="/register" className={`hp-btn ${tier.name === 'Standard' ? 'hp-btn--primary' : 'hp-btn--ghost'}`} style={{ textAlign: 'center', display: 'block' }}>
                    Get Started
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Government Compliance */}
      <section style={{ padding: '8rem 0', background: '#fff' }}>
        <div className="hp-container text-center">
          <span className="hp-section-tag">COMPLIANCE</span>
          <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '2rem' }}>Government Ready (EMIS/NEMIS)</h2>
          <p style={{ fontSize: '1.6rem', color: '#4b5563', maxWidth: '700px', margin: '0 auto 4rem' }}>
            Export data in formats compatible with State Ministry of Education and Federal NEMIS requirements. 
            Reduce the stress of annual government data submissions.
          </p>
          <div className="hp-hero__trust" style={{ justifyContent: 'center' }}>
            <span>✅ NDPR Data Protection</span>
            <span>✅ Ministry Standards Compliant</span>
            <span>✅ UBEC/SUBEB Format Ready</span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ForSchools;
