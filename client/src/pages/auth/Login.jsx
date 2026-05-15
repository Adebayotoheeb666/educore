import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginUser } from '../../services/authService';
import { setUser } from '../../redux/features/auth/authSlice';
import { toast } from 'sonner';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      return toast.error('Please fill in all fields');
    }
    setIsLoading(true);
    try {
      const data = await loginUser({
        ...formData,
        email: formData.email.trim().toLowerCase(),
      });
      if (data) {
        dispatch(setUser(data));
        toast.success('Welcome back!');
        navigate(data.role === 'super_admin' ? '/admin' : '/dashboard');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Login failed');
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
          <h1>Welcome Back</h1>
          <p className="subtitle">Access your administrative dashboard</p>

          <form className="auth-form" onSubmit={handleLogin}>
            <div className="auth-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="e.g. admin@school.ng"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="auth-group">
              <div className="auth-label-row">
                <label>Password</label>
                <Link to="/forgot-password" title="reset password" className="auth-link">Forgot password?</Link>
              </div>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>

            <button type="submit" className="btn-auth" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-insight">
            <span className="auth-insight-icon">✨</span>
            <div className="auth-insight-text">
              <h5>AI INSIGHT</h5>
              <p>Securing your connection to the National Education Grid.</p>
            </div>
          </div>

          <div className="auth-bottom-text">
            New institution? <Link to="/register">Register your school</Link>
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

export default Login;
