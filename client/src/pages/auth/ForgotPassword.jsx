import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../../services/authService';
import { toast } from 'sonner';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');
    
    setIsLoading(true);
    try {
      await forgotPassword({ email });
      toast.success('Reset link sent to your email');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <header className="auth-header">
        <Link to="/" className="auth-logo">EduCore AI</Link>
        <Link to="/contact-us" className="auth-header-link">Support</Link>
      </header>

      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-card-icon">🔄</div>
          <h1>Forgot Password</h1>
          <p className="subtitle">Enter your email to receive a password reset link.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="name@school.edu.ng"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-auth" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Reset Link →'}
            </button>
          </form>

          <Link to="/login" className="back-to-login">
            <span>←</span> Back to Login
          </Link>

          <div className="auth-insight" style={{borderColor: '#6A5ACD', backgroundColor: '#f3f0ff'}}>
            <span className="auth-insight-icon">✨</span>
            <div className="auth-insight-text">
              <h5 style={{color: '#6A5ACD'}}>EduCore Tip</h5>
              <p style={{color: '#6A5ACD'}}>Check your institutional inbox and the spam folder if the link doesn't arrive within 2 minutes.</p>
            </div>
          </div>
        </div>
      </main>

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

export default ForgotPassword;
