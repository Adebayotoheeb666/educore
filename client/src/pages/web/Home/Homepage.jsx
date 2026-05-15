import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

const features = [
  { icon: '🤖', title: 'AI Lesson Plan Generation', desc: 'Auto-generate NERDC-aligned lesson plans, schemes of work, and teaching aids. Bloom\'s Taxonomy integration for comprehensive teaching.' },
  { icon: '📝', title: 'AI Exam & Question Generation', desc: 'Create MCQs, theory, essays, and exam papers aligned to WAEC/NECO/JAMB patterns. Build searchable question banks.' },
  { icon: '✅', title: 'AI Grading & Assessment', desc: 'Instant objective grading, rubric-based essay scoring, and automated result computation with report card generation.' },
  { icon: '👨‍🎓', title: 'Student Management', desc: 'Detailed profiles, academic history, attendance tracking with SMS notifications, and bulk import via CSV/Excel.' },
  { icon: '👩‍🏫', title: 'Teacher Management', desc: 'Profiles, workload monitoring, performance analytics, and lesson delivery tracking.' },
  { icon: '💰', title: 'Fee & Financial Management', desc: 'Track payments, installments, generate receipts, and send defaulter reminders via Paystack integration.' },
  { icon: '📊', title: 'Analytics & Reporting', desc: 'School dashboards, EMIS/NEMIS reports, subject performance analysis, and government compliance exports.' },
  { icon: '📚', title: 'Library Management', desc: 'Digital catalog, borrowing tracking, and automated overdue alerts.' },
  { icon: '📅', title: 'Timetable & Calendar', desc: 'Automated clash-free timetables and academic calendar builder with sharing to parents.' },
  { icon: '📱', title: 'Offline-First Design', desc: 'Works without internet, auto-syncs when connected, SMS fallbacks for notifications.' },
];

const stats = [
  { value: 'AI', label: 'Powered Features' },
  { value: 'NERDC', label: 'Curriculum Aligned' },
  { value: 'Offline', label: 'First Design' },
  { value: 'WAEC/NECO', label: 'Exam Prep' },
];

const Homepage = () => {
  const { isAuthenticated } = useSelector(s => s.auth);

  return (
    <div style={{ fontFamily: 'Manrope, sans-serif' }}>

      {/* Navbar */}
      <nav className="navbar navbar-expand-md navbar-light bg-white border-bottom sticky-top">
        <div className="container-lg">
          <Link className="navbar-brand fw-bold text-primary fs-4" to="/">EduCore</Link>
          <div className="ms-auto d-flex gap-2">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary btn-sm">Go to Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-primary btn-sm">Sign In</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Register School</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 50%, #ffffff 100%)', padding: '80px 0 60px' }}>
        <div className="container-lg text-center">
          <span className="badge bg-primary bg-opacity-10 text-primary fw-semibold mb-3 px-3 py-2" style={{ fontSize: '0.85rem' }}>
            Built for Nigerian Schools
          </span>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 700, color: 'var(--dark-blue)', lineHeight: 1.15, marginBottom: '1.25rem' }}>
            Complete School Management<br />Powered by AI
          </h1>
          <p className="text-muted mx-auto mb-4" style={{ maxWidth: 680, fontSize: '1.1rem', lineHeight: 1.6 }}>
            Automate school administration and teaching with AI-powered tools aligned to the Nigerian curriculum. 
            Works offline, notifies parents via SMS, and exports to EMIS/NEMIS. Built for Nigerian primary and secondary schools.
          </p>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg px-5">Go to Dashboard</Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg px-4">Start Free Trial</Link>
                <Link to="/login" className="btn btn-outline-primary btn-lg px-4">Sign In</Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section style={{ background: 'var(--brand-color)', padding: '32px 0' }}>
        <div className="container-lg">
          <div className="row g-0 text-center text-white">
            {stats.map(s => (
              <div key={s.label} className="col-6 col-md-3 py-2">
                <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{s.value}</div>
                <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 0', background: '#fff' }}>
        <div className="container-lg">
          <div className="text-center mb-5">
            <h2 style={{ fontWeight: 700, fontSize: '2rem', color: 'var(--dark-blue)' }}>Everything Your School Needs</h2>
            <p className="text-muted">AI-powered automation for Nigerian schools — from lesson planning to result computation.</p>
          </div>
          <div className="row g-4">
            {features.map(f => (
              <div key={f.title} className="col-md-6 col-lg-4">
                <div className="card h-100 border-0 shadow-sm p-1">
                  <div className="card-body">
                    <div style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>{f.icon}</div>
                    <h5 className="fw-bold" style={{ color: 'var(--dark-blue)' }}>{f.title}</h5>
                    <p className="text-muted small mb-0" style={{ lineHeight: 1.6 }}>{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles section */}
      <section style={{ padding: '72px 0', background: '#f0fdfa' }}>
        <div className="container-lg">
          <div className="text-center mb-5">
            <h2 style={{ fontWeight: 700, fontSize: '2rem', color: 'var(--dark-blue)' }}>Built for Every Role</h2>
            <p className="text-muted">11 user roles with tailored experiences for school owners, principals, teachers, parents, and students.</p>
          </div>
          <div className="row g-3 justify-content-center">
            {[
              ['🏫', 'Principal', 'Full school oversight, analytics, and approvals'],
              ['👩‍🏫', 'Teacher', 'Lesson plans, attendance, exams, and scoring'],
              ['💰', 'Bursar', 'Fee schedules, collections, and defaulter alerts'],
              ['👨‍👩‍👦', 'Parent', 'Results, fees, attendance, and announcements'],
              ['👨‍🎓', 'Student', 'Timetable, results, and exam access'],
              ['📚', 'Librarian', 'Book catalog, borrows, and overdue tracking'],
            ].map(([icon, role, desc]) => (
              <div key={role} className="col-6 col-md-4 col-lg-2">
                <div className="card h-100 border-0 text-center p-3" style={{ boxShadow: '0 2px 12px rgba(0,128,128,0.08)' }}>
                  <div style={{ fontSize: '2rem' }}>{icon}</div>
                  <div className="fw-bold mt-2" style={{ fontSize: '0.9rem', color: 'var(--dark-blue)' }}>{role}</div>
                  <div className="text-muted mt-1" style={{ fontSize: '0.75rem', lineHeight: 1.4 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 0', background: 'var(--brand-color)' }}>
        <div className="container-lg text-center text-white">
          <h2 style={{ fontWeight: 700, fontSize: '2rem', marginBottom: '1rem' }}>Ready to Transform Your School?</h2>
          <p style={{ opacity: 0.9, marginBottom: '2rem', fontSize: '1.05rem' }}>
            Register your school today. Free trial, no credit card required.
          </p>
          <Link to="/register" className="btn btn-light btn-lg px-5 fw-semibold" style={{ color: 'var(--brand-color)' }}>
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--dark-blue)', color: 'rgba(255,255,255,0.7)', padding: '32px 0' }}>
        <div className="container-lg d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
          <span className="fw-bold text-white fs-5">EduCore</span>
          <span style={{ fontSize: '0.85rem' }}>School Management System — Built for Nigeria</span>
          <div className="d-flex gap-3" style={{ fontSize: '0.85rem' }}>
            <Link to="/about-us" className="text-decoration-none" style={{ color: 'rgba(255,255,255,0.7)' }}>About</Link>
            <Link to="/contact-us" className="text-decoration-none" style={{ color: 'rgba(255,255,255,0.7)' }}>Contact</Link>
            <Link to={isAuthenticated ? "/dashboard" : "/login"} className="text-decoration-none" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {isAuthenticated ? "Dashboard" : "Login"}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
