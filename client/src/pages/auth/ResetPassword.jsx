import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { resetPassword } from '../../services/authService';
import { toast } from 'sonner';
import './Auth.css';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Requirement checks
  const hasMinLength = formData.password.length >= 8;
  const hasNumber = /[0-9]/.test(formData.password);
  const matches = formData.password && formData.password === formData.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasMinLength || !hasNumber || !matches) {
      return toast.error('Please fulfill all requirements');
    }
    
    setIsLoading(true);
    try {
      await resetPassword(token, { password: formData.password });
      setShowToast(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Reset failed');
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
          <h1>Reset Password</h1>
          <p className="subtitle">Choose a strong, secure password to protect your EduCore account.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-group">
              <label>New Password</label>
              <div className="pass-input-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
                <button type="button" className="pass-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="auth-group">
              <label>Confirm Password</label>
              <div className="pass-input-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="req-list">
              <h6>Requirements</h6>
              <div className={`req-item ${hasMinLength ? 'valid' : ''}`}>
                <span>{hasMinLength ? '✅' : '○'}</span> Minimum 8 characters
              </div>
              <div className={`req-item ${hasNumber ? 'valid' : ''}`}>
                <span>{hasNumber ? '✅' : '○'}</span> At least one numeric character
              </div>
              <div className={`req-item ${matches ? 'valid' : ''}`}>
                <span>{matches ? '✅' : '○'}</span> Passwords must match
              </div>
            </div>

            <button type="submit" className="btn-auth" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>

          <Link to="/login" className="back-to-login">
            <span>←</span> Back to Login
          </Link>

          <div className="auth-insight">
            <span className="auth-insight-icon">🛡️</span>
            <div className="auth-insight-text">
              <h5 style={{color: '#b8860b'}}>SECURITY TIP</h5>
              <p style={{color: '#1e40af'}}>Avoid using common educational terms like "school" or "student" in your password to ensure maximum security.</p>
            </div>
          </div>
        </div>
      </main>

      {showToast && (
        <div className="auth-toast">
          <div className="toast-icon">✓</div>
          <div className="toast-content">
            <h6>Password updated</h6>
            <p>You can now sign in with your new password.</p>
          </div>
        </div>
      )}

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

export default ResetPassword;
