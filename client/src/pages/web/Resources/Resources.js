import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../../components/web/Navbar';
import Footer from '../../../components/web/Footer';
import '../Home/Homepage.css';

const Resources = () => {
  return (
    <div className="homepage-wrapper">
      <Navbar />

      {/* Hero */}
      <header className="hp-hero animate__animated animate__fadeInDown" style={{ background: '#2d2460', padding: '10rem 0 6rem', color: '#fff' }}>
        <div className="hp-container text-center animate__animated animate__fadeInLeft animate__delay-1s">
          <span className="hp-badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}>KNOWLEDGE HUB</span>
          <h1 style={{ fontSize: '4rem', fontWeight: 900, marginBottom: '2rem', color: '#fff' }}>
            Educational Resources &<br />AI Insights
          </h1>
          <p style={{ fontSize: '1.7rem', color: 'rgba(255,255,255,0.7)', maxWidth: '800px', margin: '0 auto' }}>
            Guides, templates, and insights to help you navigate the future of education in Nigeria.
          </p>
        </div>
      </header>

      {/* Resource Sections */}
      <section style={{ padding: '8rem 0', background: '#fff' }}>
        <div className="hp-container">
          <div className="row g-5">
            {/* AI & Teaching */}
            <div className="col-md-6">
              <div className="p-5" style={{ background: '#f0fdfa', borderRadius: '24px' }}>
                <h3 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '1.5rem' }}>AI & Teaching</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {[
                    'How to use AI for Lesson Planning (NERDC Guide)',
                    'Bloom\'s Taxonomy in the Digital Age',
                    'Effective AI-driven Student Assessments',
                    'Teacher Capacity Building with AI Tools'
                  ].map(item => (
                    <li key={item} style={{ fontSize: '1.5rem', marginBottom: '1.2rem' }}>
                      <Link to="#" style={{ color: '#6A5ACD', textDecoration: 'none' }}>📄 {item}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* School Management */}
            <div className="col-md-6">
              <div className="p-5" style={{ background: '#fefce8', borderRadius: '24px' }}>
                <h3 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '1.5rem' }}>School Management</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {[
                    'Digital Transformation Guide for Nigerian Schools',
                    'Best Practices for Fee Collection & Reconciliation',
                    'Understanding NDPR Compliance for Schools',
                    'Improving Parent Engagement via WhatsApp'
                  ].map(item => (
                    <li key={item} style={{ fontSize: '1.5rem', marginBottom: '1.2rem' }}>
                      <Link to="#" style={{ color: '#854d0e', textDecoration: 'none' }}>📘 {item}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum & Exam Support */}
      <section style={{ padding: '8rem 0', background: '#f9fafb' }}>
        <div className="hp-container">
          <div className="hp-section-head">
            <h2>Curriculum & Exam Support</h2>
            <p>Comprehensive alignment with Nigerian and international educational standards.</p>
          </div>
          
          <div style={{ background: '#fff', borderRadius: '24px', padding: '4rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <div className="table-responsive">
              <table className="table table-borderless" style={{ fontSize: '1.5rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                    <th style={{ padding: '1.5rem' }}>Standard</th>
                    <th style={{ padding: '1.5rem' }}>Coverage</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { s: 'NERDC (Nigerian national curriculum)', c: '✅ Full alignment for all subjects' },
                    { s: 'WAEC (WASSCE)', c: '✅ Pattern questions & result formatting' },
                    { s: 'NECO', c: '✅ Pattern questions & result formatting' },
                    { s: 'BECE / Junior WAEC', c: '✅ Complete support' },
                    { s: 'JAMB / UTME', c: '✅ Practice question generation' },
                    { s: 'Cambridge IGCSE', c: '✅ Partial support' }
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '1.5rem', fontWeight: 600 }}>{row.s}</td>
                      <td style={{ padding: '1.5rem', color: '#6A5ACD' }}>{row.c}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section style={{ padding: '8rem 0', background: '#fff' }}>
        <div className="hp-container">
          <div className="hp-section-head">
            <h2>Modern Technology Stack</h2>
            <p>Built with world-class technologies to ensure reliability, security, and performance.</p>
          </div>
          <div className="row g-4 text-center">
            {[
              { title: 'Frontend', tech: 'React, Redux Toolkit, Ant Design', icon: '💻' },
              { title: 'Backend', tech: 'Node.js, Express, MongoDB', icon: '⚙️' },
              { title: 'AI & NLP', tech: 'OpenAI GPT-4, Claude 3, Custom NLP', icon: '🧠' },
              { title: 'Offline Support', tech: 'IndexedDB, Service Workers', icon: '🔌' }
            ].map(item => (
              <div key={item.title} className="col-md-3">
                <div className="p-4" style={{ background: '#f8fafc', borderRadius: '20px' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{item.icon}</div>
                  <h5 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{item.title}</h5>
                  <p style={{ fontSize: '1.3rem', color: '#64748b' }}>{item.tech}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported School Types */}
      <section style={{ padding: '8rem 0', background: '#2d2460', color: '#fff' }}>
        <div className="hp-container">
          <div className="hp-section-head">
            <h2 style={{ color: '#fff' }}>Supported School Types</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>Tailored solutions for every level of the Nigerian education system.</p>
          </div>
          <div className="row g-4">
            {[
              'Nursery & Primary (K–6)',
              'Junior Secondary (JSS1–3)',
              'Senior Secondary (SS1–3)',
              'Group of Schools (Multi-campus)',
              'Public / Government Schools',
              'Private / Proprietory Schools'
            ].map(type => (
              <div key={type} className="col-md-4">
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '2rem', borderRadius: '16px', fontSize: '1.5rem', fontWeight: 600 }}>
                  ✅ {type}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="hp-cta">
        <div className="hp-container hp-cta__inner">
          <h2>Stay Informed</h2>
          <p>Subscribe to our newsletter for the latest in Nigerian EdTech.</p>
          <div className="d-flex justify-content-center gap-2" style={{ maxWidth: '500px', margin: '0 auto' }}>
            <input type="email" placeholder="Enter your email" className="form-control" style={{ padding: '1rem', fontSize: '1.4rem' }} />
            <button className="hp-btn hp-btn--primary">Subscribe</button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Resources;
