import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerSchool } from '../../services/authService';
import { toast } from 'sonner';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    schoolName: '',
    email: '',
    phoneNumber: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await registerSchool(formData);
      toast.success('School registered successfully! Check your email to verify.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <header className="auth-header">
        <Link to="/" className="auth-logo">EduCore AI</Link>
        <div className="auth-header-links" style={{display: 'flex', gap: '2rem'}}>
          <Link to="/about-us" className="auth-header-link">About</Link>
          <Link to="#" className="auth-header-link">Pricing</Link>
          <Link to="/contact-us" className="auth-header-link">Support</Link>
        </div>
      </header>

      <main className="auth-main">
        <div className="auth-card" style={{maxWidth: '600px'}}>
          <div className="mission-badge" style={{marginBottom: '2rem', background: '#dbeafe', color: '#1e40af'}}>
            🎓 INSTITUTIONAL REGISTRATION
          </div>
          <h1>Join the Future of Learning</h1>
          <p className="subtitle">Equip your school with AI-powered administration and growth tools.</p>

          <form className="auth-form" onSubmit={handleRegister}>
            <div className="form-row">
              <div className="auth-group">
                <label>First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="auth-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Okonkwo"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="auth-group">
              <label>School Name *</label>
              <input
                type="text"
                name="schoolName"
                placeholder="Lagos International Academy"
                value={formData.schoolName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="auth-group">
              <label>Email Address *</label>
              <input
                type="email"
                name="email"
                placeholder="admin@school.ng"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="auth-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                name="phoneNumber"
                placeholder="+234 801 234 5678"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="auth-group">
              <label>Password *</label>
              <input
                type="password"
                name="password"
                placeholder="Min. 8 characters"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="auth-insight" style={{borderColor: '#6A5ACD', backgroundColor: '#f3f0ff', marginBottom: '2.5rem'}}>
              <span className="auth-insight-icon">✨</span>
              <div className="auth-insight-text">
                <h5 style={{color: '#6A5ACD'}}>EduCore Intelligence</h5>
                <p style={{color: '#6A5ACD'}}>Verification usually takes less than 24 hours for Nigerian accredited institutions.</p>
              </div>
            </div>

            <button type="submit" className="btn-auth" disabled={isLoading}>
              {isLoading ? 'Registering...' : 'Register School →'}
            </button>
          </form>

          <div className="auth-bottom-text">
            Already have an account? <Link to="/login" style={{color: '#6A5ACD'}}>Login</Link>
          </div>
        </div>
      </main>

      <div className="compliance-row" style={{display: 'flex', gap: '3rem', justifyContent: 'center', padding: '2rem 0', opacity: 0.6}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '1.2rem', fontWeight: 700}}>🛡️ CBN COMPLIANT</div>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '1.2rem', fontWeight: 700}}>🔒 SSL SECURED</div>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '1.2rem', fontWeight: 700}}>🏛️ MINISTRY ACCREDITED</div>
      </div>

      <footer className="auth-footer">
        <p>© 2024 EduCore AI. Empowering Nigerian Education.</p>
        <div className="auth-footer-links">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/contact-us">Contact Support</Link>
        </div>
      </footer>
    </div>
  );
};

export default Register;
