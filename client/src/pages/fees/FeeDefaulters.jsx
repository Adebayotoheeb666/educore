import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getFeeDefaulters } from '../../services/feeService';
import './Fees.css';
import '../students/Students.css';

const FeeDefaulters = () => {
  const [defaulters, setDefaulters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    getFeeDefaulters()
      .then(({ data }) => setDefaulters(data || []))
      .catch(() => toast.error('Failed to load defaulters'))
      .finally(() => setLoading(false));
  }, []);

  const totalOutstanding = defaulters.reduce((s, d) => s + (d.balance || 0), 0);
  const studentLabel = (d) => {
    const s = d.student;
    return s ? `${s.firstName || ''} ${s.lastName || ''}`.trim() : 'Student';
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleNotify = () => {
    if (selected.size === 0) {
      toast.error('Select at least one defaulter');
      return;
    }
    toast.success(`Reminder queued for ${selected.size} parent(s)`);
  };

  return (
    <div className="fees-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem' }}>
        <div>
          <h1 style={{ fontSize: '3.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.8rem' }}>Fee Defaulters</h1>
          <p style={{ fontSize: '1.6rem', color: '#64748b' }}>Students with outstanding fee balances.</p>
        </div>
        <button type="button" className="btn-primary-green" style={{ background: '#6A5ACD', padding: '1.2rem 3rem' }} onClick={handleNotify}>
          Notify Parents ({selected.size})
        </button>
      </div>

      <div className="defaulters-stats-grid">
        <div className="defaulter-stat-box">
          <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Total Outstanding</p>
          <p className="defaulter-val">₦{totalOutstanding.toLocaleString()}</p>
        </div>
        <div className="defaulter-stat-box">
          <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Active Defaulters</p>
          <p className="defaulter-val">{defaulters.length} Students</p>
        </div>
      </div>

      <div className="exam-list-card">
        {loading ? (
          <p style={{ padding: '2rem', color: '#64748b' }}>Loading…</p>
        ) : defaulters.length === 0 ? (
          <p style={{ padding: '2rem', color: '#64748b' }}>No fee defaulters — all payments up to date.</p>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th></th>
                <th>Student</th>
                <th>Fee</th>
                <th>Outstanding</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {defaulters.map(d => (
                <tr key={d._id}>
                  <td>
                    <input type="checkbox" checked={selected.has(d._id)} onChange={() => toggleSelect(d._id)} />
                  </td>
                  <td>{studentLabel(d)}</td>
                  <td>{d.fee?.title || '—'}</td>
                  <td style={{ fontWeight: 800, color: '#b91c1c' }}>₦{(d.balance ?? 0).toLocaleString()}</td>
                  <td>{d.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default FeeDefaulters;
