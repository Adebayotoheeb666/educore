import { useState } from 'react';
import { toast } from 'sonner';
import { useSelector, useDispatch } from 'react-redux';
import { setUser } from '../../redux/features/auth/authSlice';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Profile.css';

const Profile = () => {
  const { user } = useSelector(s => s.auth);
  const [tab, setTab] = useState('profile');
  const dispatch = useDispatch();
  const [form, setForm] = useState({ 
    firstName: user?.firstName || '', 
    lastName: user?.lastName || '', 
    phone: user?.phone || '' 
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('firstName', form.firstName);
      formData.append('lastName', form.lastName);
      formData.append('phone', form.phone);
      if (image) formData.append('image', image);
      if (form.avatar) formData.append('avatar', form.avatar);

      const { data } = await axios.patch('/api/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      dispatch(setUser(data));
      toast.success('Profile updated successfully');
    } catch (error) { 
      toast.error(error.response?.data?.message || 'Update failed');
    }
    finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Passwords do not match');
    setSaving(true);
    try {
      await axios.patch('/api/auth/change-password', pwForm);
      toast.success('Password updated successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) { 
      toast.error(error.response?.data?.message || 'Password update failed');
    }
    finally { setSaving(false); }
  };

  return (
    <div className="profile-container-premium">
      <header className="profile-banner-card">
        <div className="banner-content-left">
          <div className="large-avatar-box">
             {user?.avatar ? <img src={user.avatar} alt="P" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : `${form.firstName[0] || ''}${form.lastName[0] || ''}`}
          </div>
          <div className="profile-name-area">
             <h2>{form.firstName} {form.lastName} <span className="role-pill">{user?.role?.replace('_', ' ').toUpperCase()}</span></h2>
             <p>✉ {user?.email || 'N/A'}</p>
          </div>
        </div>
        <div className="banner-content-right">
           <button className="btn-save-profile" onClick={tab === 'profile' ? handleUpdateProfile : handleChangePassword} disabled={saving}>
             💾 {saving ? 'Saving...' : 'Save Changes'}
           </button>
        </div>
      </header>

      <main className="profile-main-layout">
        <aside className="profile-sidebar-nav">
          <button className={`profile-nav-item ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>
             <span>👤</span> Profile Settings
             <small style={{ display: 'block', fontSize: '0.7rem', opacity: 0.8, fontWeight: 500 }}>Personal Information</small>
          </button>
          <button className={`profile-nav-item ${tab === 'password' ? 'active' : ''}`} onClick={() => setTab('password')}>
             <span>🛡</span> Security
             <small style={{ display: 'block', fontSize: '0.7rem', opacity: 0.8, fontWeight: 500 }}>Password & Access</small>
          </button>
          <button className="profile-nav-item">
             <span>🔔</span> Notifications
             <small style={{ display: 'block', fontSize: '0.7rem', opacity: 0.8, fontWeight: 500 }}>Alerts & Preferences</small>
          </button>
        </aside>

        <section className="profile-content-area">
          {tab === 'profile' ? (
            <div className="profile-section-card">
              <div className="section-title-premium">
                 <span className="icon-wrap">👤</span> Personal Information
              </div>
              <form className="profile-form-grid" onSubmit={handleUpdateProfile}>
                 <div className="profile-input-group">
                   <label>First Name</label>
                   <input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
                 </div>
                 <div className="profile-input-group">
                   <label>Last Name</label>
                   <input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
                 </div>
                 <div className="profile-input-group" style={{ gridColumn: 'span 2' }}>
                   <label>Email Address (Read Only)</label>
                   <div className="input-with-icon">
                     <span className="input-icon-fixed">🔒</span>
                     <input value={user?.email || ''} disabled />
                   </div>
                 </div>
                 <div className="profile-input-group" style={{ gridColumn: 'span 2' }}>
                   <label>Phone Number</label>
                   <div className="input-with-icon">
                     <span className="input-icon-fixed">+234</span>
                     <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                   </div>
                 </div>
                  <div className="profile-input-group" style={{ gridColumn: 'span 2' }}>
                    <label>Avatar URL (Alternative)</label>
                    <input 
                      placeholder="https://example.com/avatar.png" 
                      value={form.avatar || user?.avatar || ''} 
                      onChange={e => setForm({...form, avatar: e.target.value})} 
                    />
                  </div>
                  <div className="profile-input-group" style={{ gridColumn: 'span 2' }}>
                    <label>Upload Avatar Image</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => setImage(e.target.files[0])} 
                      className="form-control"
                      style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.8rem' }}
                    />
                  </div>
               </form>
            </div>
          ) : (
            <div className="profile-section-card">
              <div className="section-title-premium">
                 <span className="icon-wrap">🛡</span> Security Settings
              </div>
              <form className="profile-form-grid" onSubmit={handleChangePassword}>
                 <div className="profile-input-group" style={{ gridColumn: 'span 2' }}>
                   <label>Current Password</label>
                   <input type="password" placeholder="••••••••••••" value={pwForm.currentPassword} onChange={e => setPwForm({...pwForm, currentPassword: e.target.value})} />
                 </div>
                 <div className="profile-input-group">
                   <label>New Password</label>
                   <input type="password" placeholder="Min. 8 characters" value={pwForm.newPassword} onChange={e => setPwForm({...pwForm, newPassword: e.target.value})} />
                 </div>
                 <div className="profile-input-group">
                   <label>Confirm New Password</label>
                   <input type="password" placeholder="Must match new password" value={pwForm.confirmPassword} onChange={e => setPwForm({...pwForm, confirmPassword: e.target.value})} />
                 </div>
              </form>
              <div className="ai-profile-alert">
                 <span style={{ fontSize: '1.2rem' }}>ℹ️</span>
                 <p>EduSmart AI recommends choosing a password that combines uppercase letters, numbers, and special characters for maximum administrative security.</p>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="ann-footer-main" style={{ background: '#f8fafc', margin: '5rem -4rem -3rem', padding: '2.5rem 8rem' }}>
        <div className="footer-left-content">
          © {new Date().getFullYear()} EduSmart Systems Nigeria. All rights reserved.
        </div>
        <div className="footer-links">
          <Link to="/support">Support Desk</Link>
          <Link to="/manual">User Manual</Link>
          <Link to="/privacy">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
};

export default Profile;
