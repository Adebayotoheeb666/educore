import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import axios from 'axios';
import { setUser } from '../../redux/features/auth/authSlice';
import { getSchoolProfile, updateSchoolProfile, updateSchoolSettings } from '../../services/authService';
import PasswordInput from '../../components/layout/PasswordInput';
import './AdminProfileSetup.css';

const AdminProfileSetup = () => {
    const { user } = useSelector(s => s.auth);
    const dispatch = useDispatch();
    const [tab, setTab] = useState('personal');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form States
    const [personalForm, setPersonalForm] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        phone: user?.phone || '',
        avatar: user?.avatar || ''
    });

    const [schoolForm, setSchoolForm] = useState({
        name: '',
        address: '',
        phone: '',
        state: '',
        type: '',
        email: ''
    });

    const [academicForm, setAcademicForm] = useState({
        academicSession: '2023/2024',
        currentTerm: 'first'
    });

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [image, setImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (user) {
            setPersonalForm({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phone: user.phone || '',
                avatar: user.avatar || ''
            });
        }
    }, [user]);

    useEffect(() => {
        if (!image) {
            setPreviewUrl(null);
            return;
        }
        const objectUrl = URL.createObjectURL(image);
        setPreviewUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [image]);

    useEffect(() => {
        const fetchSchool = async () => {
            const data = await getSchoolProfile();
            if (data) {
                setSchoolForm({
                    name: data.name || '',
                    address: data.address || '',
                    phone: data.phone || '',
                    state: data.state || '',
                    type: data.type || '',
                    email: data.email || ''
                });
                if (data.settings) {
                    setAcademicForm({
                        academicSession: data.settings.academicSession || '2023/2024',
                        currentTerm: data.settings.currentTerm || 'first'
                    });
                }
            }
            setLoading(false);
        };
        fetchSchool();
    }, []);

    const handleUpdatePersonal = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('firstName', personalForm.firstName);
            formData.append('lastName', personalForm.lastName);
            formData.append('phone', personalForm.phone);
            if (image) formData.append('image', image);
            if (personalForm.avatar && !image) formData.append('avatar', personalForm.avatar);

            const { data } = await axios.patch('/api/auth/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            dispatch(setUser(data));
            setImage(null);
            toast.success('Personal profile updated');
        } catch (error) {
            toast.error('Update failed');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateSchool = async (e) => {
        e.preventDefault();
        setSaving(true);
        await updateSchoolProfile(schoolForm);
        setSaving(false);
    };

    const handleUpdateAcademic = async (e) => {
        e.preventDefault();
        setSaving(true);
        await updateSchoolSettings(academicForm);
        setSaving(false);
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            return toast.error('Passwords do not match');
        }
        setSaving(true);
        try {
            await axios.patch('/api/auth/changepassword', passwordForm);
            toast.success('Password updated');
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error('Password update failed');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-5 text-center">Loading institutional profile...</div>;

    return (
        <div className="profile-setup-container">
            <header className="setup-header-premium">
                <h1>Institutional Profile</h1>
                <p>Configure your administrative presence and school identity.</p>
            </header>

            <div className="setup-grid-layout">
                <aside className="setup-sidebar-card">
                    <nav className="sidebar-nav-list">
                        <button className={`nav-step-item ${tab === 'personal' ? 'active' : ''}`} onClick={() => setTab('personal')}>
                            <div className="step-icon">👤</div>
                            <div className="step-label">
                                <h4>Personal Profile</h4>
                                <span>Admin details</span>
                            </div>
                        </button>
                        <button className={`nav-step-item ${tab === 'school' ? 'active' : ''}`} onClick={() => setTab('school')}>
                            <div className="step-icon">🏫</div>
                            <div className="step-label">
                                <h4>School Identity</h4>
                                <span>Institutional info</span>
                            </div>
                        </button>
                        <button className={`nav-step-item ${tab === 'academic' ? 'active' : ''}`} onClick={() => setTab('academic')}>
                            <div className="step-icon">📅</div>
                            <div className="step-label">
                                <h4>Academic Settings</h4>
                                <span>Session & Term</span>
                            </div>
                        </button>
                        <button className={`nav-step-item ${tab === 'security' ? 'active' : ''}`} onClick={() => setTab('security')}>
                            <div className="step-icon">🛡️</div>
                            <div className="step-label">
                                <h4>Security</h4>
                                <span>Password & Access</span>
                            </div>
                        </button>
                    </nav>

                    <div className="setup-ai-alert">
                        <div className="ai-alert-icon">✨</div>
                        <div className="ai-alert-text">
                            <h5>AI Suggestion</h5>
                            <p>Keeping school info updated improves AI reporting accuracy.</p>
                        </div>
                    </div>
                </aside>

                <main className="setup-content-card">
                    {tab === 'personal' && (
                        <div className="setup-section">
                            <div className="section-hero-title">
                                <h2><span>👤</span> Personal Information</h2>
                                <p>Manage your account holder details and profile image.</p>
                            </div>

                            <form onSubmit={handleUpdatePersonal}>
                                <div className="avatar-upload-premium">
                                    <div className="avatar-preview-large">
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Preview" />
                                        ) : user?.avatar ? (
                                            <img src={user.avatar} alt="P" />
                                        ) : (
                                            `${personalForm.firstName[0] || ''}${personalForm.lastName[0] || ''}`
                                        )}
                                    </div>
                                    <div className="upload-btn-wrap">
                                        <label className="btn-upload-premium">
                                            Change Photo
                                            <input type="file" hidden onChange={e => setImage(e.target.files[0])} />
                                        </label>
                                        <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>PNG, JPG or GIF. Max 2MB.</p>
                                    </div>
                                </div>

                                <div className="setup-form-grid">
                                    <div className="input-block">
                                        <label>First Name</label>
                                        <input 
                                            className="premium-input" 
                                            value={personalForm.firstName} 
                                            onChange={e => setPersonalForm({...personalForm, firstName: e.target.value})} 
                                        />
                                    </div>
                                    <div className="input-block">
                                        <label>Last Name</label>
                                        <input 
                                            className="premium-input" 
                                            value={personalForm.lastName} 
                                            onChange={e => setPersonalForm({...personalForm, lastName: e.target.value})} 
                                        />
                                    </div>
                                    <div className="input-block full-width">
                                        <label>Phone Number</label>
                                        <input 
                                            className="premium-input" 
                                            value={personalForm.phone} 
                                            onChange={e => setPersonalForm({...personalForm, phone: e.target.value})} 
                                        />
                                    </div>
                                    <div className="input-block full-width">
                                        <label>Email Address</label>
                                        <input className="premium-input" value={user?.email} disabled />
                                    </div>
                                </div>

                                <div className="setup-action-bar">
                                    <button type="submit" className="btn-save-setup" disabled={saving}>
                                        {saving ? 'Saving...' : 'Save Personal Info'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {tab === 'school' && (
                        <div className="setup-section">
                            <div className="section-hero-title">
                                <h2><span>🏫</span> School Identity</h2>
                                <p>This information appears on reports, results, and invoices.</p>
                            </div>

                            <form onSubmit={handleUpdateSchool}>
                                <div className="setup-form-grid">
                                    <div className="input-block full-width">
                                        <label>Official School Name</label>
                                        <input 
                                            className="premium-input" 
                                            value={schoolForm.name} 
                                            onChange={e => setSchoolForm({...schoolForm, name: e.target.value})} 
                                        />
                                    </div>
                                    <div className="input-block">
                                        <label>School Email</label>
                                        <input 
                                            className="premium-input" 
                                            value={schoolForm.email} 
                                            onChange={e => setSchoolForm({...schoolForm, email: e.target.value})} 
                                        />
                                    </div>
                                    <div className="input-block">
                                        <label>Contact Phone</label>
                                        <input 
                                            className="premium-input" 
                                            value={schoolForm.phone} 
                                            onChange={e => setSchoolForm({...schoolForm, phone: e.target.value})} 
                                        />
                                    </div>
                                    <div className="input-block">
                                        <label>School Type</label>
                                        <select 
                                            className="premium-input premium-select" 
                                            value={schoolForm.type} 
                                            onChange={e => setSchoolForm({...schoolForm, type: e.target.value})}
                                        >
                                            <option value="">Select Category</option>
                                            <option value="primary">Primary School</option>
                                            <option value="secondary">Secondary School</option>
                                            <option value="k12">K-12 (Primary & Secondary)</option>
                                            <option value="tertiary">Tertiary Institution</option>
                                        </select>
                                    </div>
                                    <div className="input-block">
                                        <label>State</label>
                                        <input 
                                            className="premium-input" 
                                            value={schoolForm.state} 
                                            onChange={e => setSchoolForm({...schoolForm, state: e.target.value})} 
                                        />
                                    </div>
                                    <div className="input-block full-width">
                                        <label>Physical Address</label>
                                        <textarea 
                                            className="premium-input" 
                                            style={{ height: '100px' }}
                                            value={schoolForm.address} 
                                            onChange={e => setSchoolForm({...schoolForm, address: e.target.value})} 
                                        />
                                    </div>
                                </div>

                                <div className="setup-action-bar">
                                    <button type="submit" className="btn-save-setup" disabled={saving}>
                                        {saving ? 'Saving...' : 'Save School Profile'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {tab === 'academic' && (
                        <div className="setup-section">
                            <div className="section-hero-title">
                                <h2><span>📅</span> Academic Configuration</h2>
                                <p>Set the global session and term for the entire school system.</p>
                            </div>

                            <form onSubmit={handleUpdateAcademic}>
                                <div className="setup-form-grid">
                                    <div className="input-block">
                                        <label>Academic Session</label>
                                        <input 
                                            className="premium-input" 
                                            placeholder="e.g. 2023/2024"
                                            value={academicForm.academicSession} 
                                            onChange={e => setAcademicForm({...academicForm, academicSession: e.target.value})} 
                                        />
                                    </div>
                                    <div className="input-block">
                                        <label>Current Term</label>
                                        <select 
                                            className="premium-input premium-select" 
                                            value={academicForm.currentTerm} 
                                            onChange={e => setAcademicForm({...academicForm, currentTerm: e.target.value})}
                                        >
                                            <option value="first">First Term</option>
                                            <option value="second">Second Term</option>
                                            <option value="third">Third Term</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="setup-action-bar">
                                    <button type="submit" className="btn-save-setup" disabled={saving}>
                                        {saving ? 'Saving...' : 'Update Academic Calendar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {tab === 'security' && (
                        <div className="setup-section">
                            <div className="section-hero-title">
                                <h2><span>🛡️</span> Security Settings</h2>
                                <p>Keep your administrative account secure with regular password updates.</p>
                            </div>

                            <form onSubmit={handleChangePassword}>
                                <div className="setup-form-grid">
                                    <div className="input-block full-width">
                                        <label>Current Password</label>
                                        <PasswordInput 
                                            name="currentPassword"
                                            className="premium-input" 
                                            value={passwordForm.currentPassword} 
                                            onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})} 
                                        />
                                    </div>
                                    <div className="input-block">
                                        <label>New Password</label>
                                        <PasswordInput 
                                            name="newPassword"
                                            className="premium-input" 
                                            value={passwordForm.newPassword} 
                                            onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} 
                                            minLength={8}
                                        />
                                    </div>
                                    <div className="input-block">
                                        <label>Confirm New Password</label>
                                        <PasswordInput 
                                            name="confirmPassword"
                                            className="premium-input" 
                                            value={passwordForm.confirmPassword} 
                                            onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} 
                                            minLength={8}
                                        />
                                    </div>
                                </div>

                                <div className="setup-action-bar">
                                    <button type="submit" className="btn-save-setup" disabled={saving}>
                                        {saving ? 'Saving...' : 'Update Security'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminProfileSetup;
