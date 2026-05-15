import React from 'react';

const BursarDashboard = ({ user }) => {
  const displayName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Bursar';
  return (
    <div className="container-fluid" style={{ padding: '4rem' }}>
      <h1 style={{ fontSize: '3.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem' }}>Finance — {displayName}</h1>
      <div style={{ background: 'white', padding: '5rem', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
         <div style={{ fontSize: '1.8rem', color: '#64748b' }}>
           <span style={{ fontSize: '3rem' }}>💰</span>
           <h2 style={{ marginTop: '2rem', color: '#0f172a' }}>Bursar Dashboard Redesign in Progress</h2>
           <p>Financial reporting, fee collection modules, and expenditure trackers are being updated to the premium EduCore AI interface.</p>
         </div>
      </div>
    </div>
  );
};

export default BursarDashboard;
