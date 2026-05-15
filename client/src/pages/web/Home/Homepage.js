import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from '../../../components/web/Navbar';
import Footer from '../../../components/web/Footer';
import './Homepage.css';

const Homepage = () => {
  const { isAuthenticated } = useSelector(s => s.auth);

  return (
    <div className="homepage-wrapper">
      <Navbar />

      {/* ── 1. HERO ── */}
      <header className="hp-hero animate__animated animate__fadeInDown">
        <div className="hp-container hp-hero__inner">
          <div className="hp-hero__text animate__animated animate__fadeInLeft animate__delay-1s">
            <span className="hp-badge">✦ AI GENERATE K-12 EDUCATION PLATFORM</span>
            <h1>
              Transforming Learning<br />
              Across Nigeria with AI.
            </h1>
            <p>
              Empower your institution with a true digital solution designed for the Nigerian context. 
              NERDC curriculum alignment, offline-first design, WAEC/NECO/JAMB preparation, 
              and automated administration — all in one unified platform.
            </p>
            <div className="hp-hero__btns animate__animated animate__fadeInUp animate__delay-2s">
              {isAuthenticated ? (
                <Link to="/dashboard" className="hp-btn hp-btn--primary">Go to Dashboard →</Link>
              ) : (
                <>
                  <Link to="/register" className="hp-btn hp-btn--primary">Get Started Free →</Link>
                  <Link to="/about-us" className="hp-btn hp-btn--ghost">Learn More</Link>
                </>
              )}
            </div>
          </div>

          <div className="hp-hero__visual">
            <div className="hp-hero__img-wrap">
              <img
                src="/assets/hero.png"
                alt="EduCore AI dashboard"
                className="hp-hero__img"
                onError={e => { e.target.style.display = 'none'; }}
              />
              <div className="hp-glow hp-glow--1" />
              <div className="hp-glow hp-glow--2" />
            </div>
          </div>
        </div>
      </header>

      {/* ── 2. STATS BAR ── */}
      <section className="hp-stats">
        <div className="hp-container hp-stats__grid">
          <div className="hp-stat">
            <h3>500+</h3>
            <p>Schools Onboarded</p>
          </div>
          <div className="hp-stat-divider" />
          <div className="hp-stat">
            <h3>100k+</h3>
            <p>Students Learning</p>
          </div>
          <div className="hp-stat-divider" />
          <div className="hp-stat">
            <h3>2.5M</h3>
            <p>Lessons Generated</p>
          </div>
        </div>
      </section>

      {/* ── 3. FEATURES GRID ── */}
      <section className="hp-features">
        <div className="hp-container">
          <div className="hp-section-head">
            <h2>Everything you need to lead.</h2>
            <p>
              From individual classrooms to entire school networks, EduCore AI
              covers all your needs.
            </p>
          </div>

          <div className="hp-features__grid">
            {/* Card 1 — AI Lesson Plans */}
            <div className="hp-feat-card hp-feat-card--light">
              <div className="hp-feat-card__icon hp-feat-card__icon--green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>
              <h3>AI Lesson Plan Generation</h3>
              <p>Auto-generate complete, structured lesson plans aligned to the official NERDC Nigerian curriculum for all subjects and class levels (Primary 1–6, JSS1–3, SS1–3).</p>
              <div className="hp-feat-card__tags">
                <span>NERDC Aligned</span>
                <span>Bloom's Taxonomy</span>
              </div>
            </div>

            {/* Card 2 — AI Exam Generator */}
            <div className="hp-feat-card hp-feat-card--dark">
              <div className="hp-feat-card__icon hp-feat-card__icon--teal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
                </svg>
              </div>
              <h3>AI Exam & Test Generation</h3>
              <p>Generate exam questions modelled after WAEC, NECO, and JAMB patterns. Specify difficulty levels and auto-shuffle options to prevent malpractice.</p>
              <div className="hp-feat-card__visual">
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1.5rem', borderRadius: '12px', fontSize: '1.2rem' }}>
                  <div style={{ marginBottom: '0.8rem', opacity: 0.8 }}>Generating JSS3 Math Exam...</div>
                  <div style={{ height: '4px', background: '#14b8a6', width: '70%', borderRadius: '2px' }}></div>
                </div>
              </div>
            </div>

            {/* Card 3 — AI Grading */}
            <div className="hp-feat-card hp-feat-card--light">
              <div className="hp-feat-card__icon hp-feat-card__icon--green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
              </div>
              <h3>AI Grading & Assessment</h3>
              <p>Instant objective grading and rubric-based essay scoring. Automatically compute CA scores, term averages, and class rankings.</p>
            </div>

            {/* Card 4 — School Management */}
            <div className="hp-feat-card hp-feat-card--medium">
              <div className="hp-feat-card__icon hp-feat-card__icon--green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
              </div>
              <h3>Admin & Student Portal</h3>
              <p>Comprehensive management of student profiles, attendance, behavioral records, and automated school-branded report cards.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. TEACHERS SECTION ── */}
      <section className="hp-teachers">
        <div className="hp-container hp-teachers__inner">
          <div className="hp-teachers__left">
            <h2>Superpowers for<br />Teachers.</h2>
            <p>
              We believe teachers are the heart of education. EduCore AI
              automates the "busy work" so they can focus on what
              matters most — inspiring students.
            </p>
            <ul className="hp-check-list">
              <li>
                <span className="hp-check">✓</span>
                <div>
                  <strong>Term-Long Schemes of Work</strong>
                  <span>Automatically generate term-long schemes from a single subject and class selection.</span>
                </div>
              </li>
              <li>
                <span className="hp-check">✓</span>
                <div>
                  <strong>WAEC / NECO Pattern Questions</strong>
                  <span>Access or generate exam questions modelled after past external examination patterns.</span>
                </div>
              </li>
              <li>
                <span className="hp-check">✓</span>
                <div>
                  <strong>Offline Access</strong>
                  <span>Download and access lesson plans and student records even without internet connectivity.</span>
                </div>
              </li>
            </ul>
          </div>

          <div className="hp-teachers__right">
            <div className="hp-teachers__img-stack">
              <img
                src="/assets/teacher-main.png"
                alt="Teacher using EduCore"
                className="hp-teachers__img-main"
                onError={e => { e.target.style.display = 'none'; }}
              />
              <img
                src="/assets/teacher-group.png"
                alt="Teacher group collaboration"
                className="hp-teachers__img-secondary"
                onError={e => { e.target.style.display = 'none'; }}
              />
              <div className="hp-teachers__badge">
                <span className="hp-badge-pct">94%</span>
                <p>Teacher satisfaction rate<br />in beta pilot schools</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. PARENTS SECTION ── */}
      <section className="hp-parents">
        <div className="hp-container hp-parents__inner">
          <div className="hp-parents__left">
            <div className="hp-parents__phone-wrap">
              <img
                src="/assets/parent_portal.png"
                alt="Parent portal app"
                className="hp-parents__phone"
                onError={e => { e.target.style.display = 'none'; }}
              />
              <div className="hp-parents__phone-badge">
                <span className="hp-parents__badge-icon">📊</span>
                <p><strong>Attendance alert</strong><br />Your ward arrived at 8:14 am today</p>
              </div>
            </div>
          </div>

          <div className="hp-parents__right">
            <h2>Peace of Mind<br />for Parents.</h2>
            <p>
              Bridging the gap between school and home with WhatsApp-first 
              communication and real-time updates on what matters most.
            </p>

            <div className="hp-parents__features">
              <div className="hp-parents__feat">
                <span className="hp-parents__feat-icon">💬</span>
                <div>
                  <h4>WhatsApp & SMS Alerts</h4>
                  <p>Receive report cards, fee reminders, and attendance alerts directly via WhatsApp.</p>
                </div>
              </div>
              <div className="hp-parents__feat">
                <span className="hp-parents__feat-icon">💳</span>
                <div>
                  <h4>Flexible Fee Payments</h4>
                  <p>Pay in installments via Paystack or Flutterwave and receive instant digital receipts.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5.5 NIGERIAN DESIGN SECTION ── */}
      <section className="hp-nigeria" style={{ padding: '9rem 0', background: '#fff' }}>
        <div className="hp-container">
          <div className="hp-section-head">
            <span className="hp-badge">LOCALLY OPTIMIZED</span>
            <h2>Built for the Nigerian Context.</h2>
            <p>EduCore AI is not a generic platform — it's built from the ground up for our unique educational environment.</p>
          </div>

          <div className="hp-nigeria__grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '3rem', marginTop: '4rem' }}>
            <div className="hp-nigeria__item">
              <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🔌</div>
              <h4 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem' }}>Offline-First Design</h4>
              <p style={{ fontSize: '1.45rem', color: '#6b7280', lineHeight: 1.6 }}>Handle frequent power outages and unreliable internet without data loss. Syncs automatically when back online.</p>
            </div>
            <div className="hp-nigeria__item">
              <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>📡</div>
              <h4 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem' }}>Low-Bandwidth Mode</h4>
              <p style={{ fontSize: '1.45rem', color: '#6b7280', lineHeight: 1.6 }}>Optimized to run smoothly even on slow 3G connections common across many states.</p>
            </div>
            <div className="hp-nigeria__item">
              <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>💰</div>
              <h4 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem' }}>Installment Fee Tracking</h4>
              <p style={{ fontSize: '1.45rem', color: '#6b7280', lineHeight: 1.6 }}>Manage the reality of partial payments with automated balance tracking and reminders.</p>
            </div>
            <div className="hp-nigeria__item">
              <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🇳🇬</div>
              <h4 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem' }}>Ministry Compliance</h4>
              <p style={{ fontSize: '1.45rem', color: '#6b7280', lineHeight: 1.6 }}>Generate EMIS/NEMIS-compliant reports for State Ministries and Federal agencies in one click.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. CTA SECTION ── */}
      <section className="hp-cta">
        <div className="hp-container hp-cta__inner">
          <h2>Ready to modernize your school?</h2>
          <p>
            Join hundreds of Nigerian institutions leading the digital
            revolution in education. Start your free trial today.
          </p>
          <div className="hp-cta__btns">
            {isAuthenticated ? (
              <Link to="/dashboard" className="hp-btn hp-btn--primary">Go to Dashboard →</Link>
            ) : (
              <>
                <Link to="/register" className="hp-btn hp-btn--primary">Create School Account</Link>
                <Link to="/contact-us" className="hp-btn hp-btn--outline-light">Speak with an Expert</Link>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Homepage;
