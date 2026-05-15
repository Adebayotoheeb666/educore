import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import './Teachers.css';

const AddTeacher = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'Subject Teacher'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleInvite = (e) => {
    e.preventDefault();
    toast.success('Invitation sent to ' + formData.email);
    navigate('/teachers');
  };

  return (
    <div className="teachers-container">
      
      <div style={{marginBottom: '3rem'}}>
        <Link to="/teachers" style={{textDecoration: 'none', color: '#64748b', fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <span>←</span> Back to Teachers
        </Link>
      </div>

      <div className="invite-form-card">
        <h1 style={{fontSize: '3.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem', textAlign: 'center'}}>Invite New Teacher</h1>
        <p style={{fontSize: '1.5rem', color: '#64748b', textAlign: 'center', marginBottom: '4rem', lineHeight: 1.5}}>
          Onboard a new faculty member to the EduCore digital ecosystem. They will receive an invitation email to set up their portal access.
        </p>

        <form onSubmit={handleInvite}>
          <div className="form-grid" style={{gridTemplateColumns: '1fr 1fr'}}>
            <div className="form-group-premium">
              <label>First Name</label>
              <input type="text" name="firstName" placeholder="e.g. Chidi" required onChange={handleInputChange} />
            </div>
            <div className="form-group-premium">
              <label>Last Name</label>
              <input type="text" name="lastName" placeholder="e.g. Okafor" required onChange={handleInputChange} />
            </div>
          </div>

          <div className="form-group-premium" style={{marginTop: '2rem'}}>
            <label>Email Address*</label>
            <input type="email" name="email" placeholder="teacher@school.edu.ng" required onChange={handleInputChange} />
          </div>

          <div className="form-group-premium" style={{marginTop: '2rem'}}>
            <label>Phone Number</label>
            <input type="tel" name="phone" placeholder="+234 000 000 0000" onChange={handleInputChange} />
          </div>

          <div className="form-group-premium" style={{marginTop: '2rem'}}>
            <label>Institutional Role</label>
            <select name="role" value={formData.role} onChange={handleInputChange}>
              <option>Subject Teacher</option>
              <option>Department Head</option>
              <option>Senior Admin</option>
              <option>AI Facilitator</option>
            </select>
          </div>

          <div className="ai-mapping-box">
             <span>✨</span>
             <div>
               <h5>AI Smart Mapping</h5>
               <p>Assigning a role will automatically grant curriculum access and relevant administrative permissions for the current term.</p>
             </div>
          </div>

          <div className="form-actions-row" style={{justifyContent: 'center', gap: '2rem'}}>
            <button type="button" className="btn-cancel" style={{padding: '1.4rem 4rem'}} onClick={() => navigate('/teachers')}>Save as Draft</button>
            <button type="submit" className="btn-submit" style={{padding: '1.4rem 4rem', background: '#6A5ACD'}}>Invite Teacher</button>
          </div>
        </form>
      </div>

      <div className="license-warning">
         <span style={{fontSize: '1.8rem'}}>ⓘ</span>
         Inviting a teacher consumes 1 license seat from your current subscription tier.
      </div>

      <div style={{marginTop: '6rem', borderTop: '1px solid #f1f5f9', paddingTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{fontSize: '1.2rem', color: '#64748b'}}>
          <strong>EDUCORE AI</strong><br/>
          © 2024 EduCore AI. Nigeria's Wise Digital Assistant.
        </div>
        <div style={{display: 'flex', gap: '2.5rem', fontSize: '1.3rem', color: '#475569', fontWeight: 600}}>
          <Link to="#" style={{textDecoration: 'none', color: 'inherit'}}>Privacy Policy</Link>
          <Link to="#" style={{textDecoration: 'none', color: 'inherit'}}>Terms of Service</Link>
          <Link to="#" style={{textDecoration: 'none', color: 'inherit'}}>Help Desk</Link>
          <Link to="#" style={{textDecoration: 'none', color: 'inherit'}}>Contact Support</Link>
        </div>
      </div>

    </div>
  );
};

export default AddTeacher;
