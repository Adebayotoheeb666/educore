import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { acceptInvite, getInviteDetails } from '../../services/authService';
import { toast } from 'sonner';
import './Auth.css';

const AcceptInvite = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await getInviteDetails(token);
        setDetails(data);
      } catch (error) {
        toast.error('Invalid or expired invitation');
        navigate('/login');
      }
    };
    fetchDetails();
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await acceptInvite(token, formData);
      toast.success('Welcome to the school!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join');
    } finally {
      setIsLoading(false);
    }
  };

  if (!details) return <div className="auth-page-wrapper"><div className="auth-main">Loading invitation...</div></div>;

  return (
    <div className="auth-page-wrapper">
      <header className="auth-header">
        <Link to="/" className="auth-logo">EduCore AI</Link>
        <Link to="/contact-us" className="auth-header-link">Support</Link>
      </header>

      <main className="auth-main">
        <div className="auth-card" style={{maxWidth: '520px'}}>
          <div className="auth-card-icon" style={{backgroundColor: '#ede9fa', color: '#6A5ACD'}}>🎓</div>
          <h1>Welcome Aboard</h1>
          <p className="subtitle">
            You've been invited to join <strong>{details.schoolName || 'the school'}</strong> as a <strong>{details.role?.replace(/_/g, ' ') || 'Staff Member'}</strong>.
          </p>

          <div className="invite-info-box">
            <span>📧</span>
            <div>
              <div style={{fontSize: '1.1rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase'}}>Invited Email</div>
              <div className="invite-email">{details.email}</div>
            </div>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="auth-group">
                <label>First Name</label>
                <input
                  type="text"
                  placeholder="e.g. Samuel"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  required
                />
              </div>
              <div className="auth-group">
                <label>Last Name</label>
                <input
                  type="text"
                  placeholder="e.g. Adebayo"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="auth-group">
              <label>Create Password</label>
              <div className="pass-input-wrap">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>
              <p style={{fontSize: '1.1rem', color: '#64748b', marginTop: '0.5rem', fontStyle: 'italic'}}>Must be at least 8 characters with a symbol.</p>
            </div>

            <button type="submit" className="btn-auth" disabled={isLoading}>
              {isLoading ? 'Joining...' : 'Join School →'}
            </button>
          </form>

          <div className="inviter-card">
             <div className="inviter-avatar" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem'}}>👤</div>
             <div className="inviter-text">
               <strong>{details.invitedBy || 'The administrator'}</strong> invited you to collaborate on the {new Date().getFullYear()} Academic Curriculum.
             </div>
          </div>

          <div className="auth-bottom-text" style={{marginTop: '2.5rem'}}>
            Already have an account? <Link to="/login" style={{color: '#6A5ACD'}}>Log in here</Link>
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

export default AcceptInvite;
