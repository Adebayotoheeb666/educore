import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import './Parent.css';

const ParentFees = () => {
  const { user } = useSelector(s => s.auth);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) return <div className="parent-dashboard-container d-flex justify-content-center align-items-center"><div className="spinner-border text-success" /></div>;

  const feeRecords = [
    { desc: "Tuition Fees", term: "1st Term", amount: 150000, paid: 150000, balance: 0, status: "Paid", action: "📄" },
    { desc: "Bus Transportation", term: "1st Term", amount: 45000, paid: 45000, balance: 0, status: "Paid", action: "📄" },
    { desc: "Laboratory & Practical Materials", term: "1st Term", amount: 75000, paid: 30000, balance: 45000, status: "Partial", action: "Pay Now" },
    { desc: "Library Membership", term: "Academic Year", amount: 15000, paid: 15000, balance: 0, status: "Paid", action: "📄" }
  ];

  return (
    <div className="parent-dashboard-container">
      <header className="ann-page-header">
        <div className="ann-header-left">
           <div className="d-flex align-items-center gap-3">
             <img src="https://ui-avatars.com/api/?name=Chidi+Adebayo&background=random" alt="S" style={{ width: 60, height: 60, borderRadius: '12px' }} />
             <div>
               <h1 style={{ margin: 0 }}>Chidi Adebayo</h1>
               <p style={{ margin: 0 }}>Student ID: EDU-2024-0892 <span style={{ background: '#FFD700', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, verticalAlign: 'middle', marginLeft: '0.5rem' }}>JSS 2 Gold</span></p>
             </div>
           </div>
        </div>
        <button className="btn-catalog-action" style={{ background: 'white', border: '1px solid #e2e8f0', padding: '0.8rem 1.5rem' }}>
           📥 Statement
        </button>
      </header>

      {/* Outstanding Balance Alert */}
      <div className="child-card-premium" style={{ background: '#fee2e2', border: '1px solid #fecaca', marginBottom: '3rem', padding: '1.5rem 2.5rem' }}>
         <div className="d-flex align-items-center gap-4 w-100">
           <div style={{ width: 50, height: 50, background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>⚠️</div>
           <div style={{ flex: 1 }}>
             <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#991b1b', margin: 0 }}>Outstanding Balance</h3>
             <p style={{ margin: 0, color: '#991b1b', fontWeight: 600 }}>Please settle the remaining amount to avoid late fees for the current term.</p>
           </div>
           <div className="text-end">
             <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#991b1b', margin: 0 }}>₦45,000</h2>
             <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 800, color: '#991b1b' }}>DUE BY OCT 15, 2024</p>
           </div>
         </div>
      </div>

      <div className="snapshots-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
        <div className="snapshot-card-premium" style={{ background: '#f3f0ff', border: '1px solid #ede9fa' }}>
           <div className="d-flex align-items-center gap-2 mb-3">
             <span style={{ fontSize: '1.2rem' }}>✨</span>
             <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#5849b8' }}>AI INSIGHT</span>
           </div>
           <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2d2460', lineHeight: 1.5 }}>
             Based on your payment history, you are eligible for a <span style={{ color: '#5849b8', fontWeight: 900 }}>5% Early Bird discount</span> if the 2nd Term fees are settled before November.
           </p>
           <div className="perf-bar-bg" style={{ height: '6px', marginTop: '1rem' }}>
              <div className="perf-bar-fill" style={{ width: '60%', background: '#5849b8' }}></div>
           </div>
        </div>

        <div className="snapshot-card-premium">
           <span className="snapshot-label">Total Invoiced</span>
           <h2 className="snapshot-val">₦285,000</h2>
           <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#6A5ACD' }}>📈 Academic Year 2024</span>
        </div>

        <div className="snapshot-card-premium">
           <span className="snapshot-label">Total Paid</span>
           <h2 className="snapshot-val">₦240,000</h2>
           <div className="perf-bar-bg" style={{ height: '6px', marginTop: '1rem' }}>
              <div className="perf-bar-fill" style={{ width: '84%', background: '#6A5ACD' }}></div>
           </div>
        </div>

        <div className="snapshot-card-premium">
           <span className="snapshot-label">Last Payment</span>
           <h2 className="snapshot-val">₦120,000</h2>
           <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8' }}>Aug 12, 2024</span>
        </div>
      </div>

      <div className="catalog-table-card" style={{ padding: 0 }}>
        <div className="table-header-custom" style={{ padding: '2rem 2.5rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
           <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Detailed Fee Statement</h3>
           <div className="d-flex gap-3">
             <button className="btn-table-icon">⚙️</button>
             <button className="btn-table-icon">🖨</button>
           </div>
        </div>
        <div className="table-responsive">
          <table className="curriculum-table">
             <thead style={{ background: '#f8fafc' }}>
               <tr>
                 <th style={{ padding: '1rem 2.5rem' }}>Fee Description</th>
                 <th>Term</th>
                 <th>Amount</th>
                 <th>Paid</th>
                 <th>Balance</th>
                 <th>Status</th>
                 <th style={{ padding: '1rem 2.5rem' }}>Action</th>
               </tr>
             </thead>
             <tbody>
               {feeRecords.map((r, i) => (
                 <tr key={i}>
                   <td style={{ padding: '1.5rem 2.5rem' }}>
                     <div style={{ fontWeight: 800 }}>{r.desc}</div>
                     <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>{i === 0 ? "Regular academic instruction" : i === 1 ? "Morning & afternoon shuttle" : i === 2 ? "Science lab consumables" : "Annual digital & physical access"}</div>
                   </td>
                   <td style={{ fontWeight: 700, color: '#475569' }}>{r.term}</td>
                   <td style={{ fontWeight: 800 }}>₦{r.amount.toLocaleString()}</td>
                   <td style={{ fontWeight: 800, color: '#5849b8' }}>₦{r.paid.toLocaleString()}</td>
                   <td style={{ fontWeight: 800, color: r.balance > 0 ? '#ef4444' : '#0f172a' }}>₦{r.balance.toLocaleString()}</td>
                   <td>
                     <span className="status-cell-pill" style={{ background: r.status === 'Paid' ? '#ede9fa' : '#fef3c7', color: r.status === 'Paid' ? '#2d2460' : '#b8860b' }}>
                       {r.status}
                     </span>
                   </td>
                   <td style={{ padding: '1.5rem 2.5rem' }}>
                     {r.action === 'Pay Now' ? (
                       <button style={{ background: '#5849b8', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem' }}>Pay Now</button>
                     ) : (
                       <button className="btn-table-icon">{r.action}</button>
                     )}
                   </td>
                 </tr>
               ))}
             </tbody>
          </table>
        </div>
      </div>

      <div className="child-card-premium" style={{ marginTop: '3.5rem', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <div className="d-flex align-items-center gap-4">
           <div style={{ width: 60, height: 60, background: '#0f172a', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>💳</div>
           <div>
             <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Secure Online Payment</h3>
             <p style={{ margin: 0, color: '#64748b', fontWeight: 600 }}>Your transaction is encrypted and managed by Paystack.</p>
           </div>
         </div>
         <button style={{ background: '#5849b8', color: 'white', border: 'none', padding: '1.2rem 2.5rem', borderRadius: '12px', fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
           💳 Pay Online via Paystack
         </button>
      </div>

      <footer className="ann-footer-main" style={{ background: '#f8fafc', margin: '5rem -4rem -3rem', padding: '2.5rem 8rem' }}>
        <div className="footer-left-content">
          <span className="footer-brand">EduCore AI</span> • © {new Date().getFullYear()} EduCore AI. Empowering Nigerian Education.
        </div>
        <div className="footer-links">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/support">Support Center</Link>
          <Link to="/contact">Contact Us</Link>
        </div>
      </footer>
    </div>
  );
};

export default ParentFees;
