import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { generateEMISReport, generateNEMISReport } from '../../services/analyticsService';
import './Analytics.css';

const TERMS = ['First Term', 'Second Term', 'Third Term'];
const currentYear = new Date().getFullYear();
const SESSIONS = [`${currentYear - 1}/${currentYear}`, `${currentYear}/${currentYear + 1}`];

const EMISReport = () => {
  const [session, setSession] = useState(SESSIONS[0]);
  const [term, setTerm] = useState(TERMS[0]);
  const [loadingEMIS, setLoadingEMIS] = useState(false);
  const [loadingNEMIS, setLoadingNEMIS] = useState(false);

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEMIS = async () => {
    setLoadingEMIS(true);
    try {
      const { data } = await generateEMISReport({ session, term });
      downloadBlob(data, `EMIS_Report_${session}_${term}.xlsx`);
      toast.success('EMIS report downloaded successfully');
    } catch {
      toast.error('Failed to generate EMIS report');
    } finally {
      setLoadingEMIS(false);
    }
  };

  const handleNEMIS = async () => {
    setLoadingNEMIS(true);
    try {
      const { data } = await generateNEMISReport({ session, term });
      downloadBlob(data, `NEMIS_Report_${session}_${term}.xlsx`);
      toast.success('NEMIS report downloaded successfully');
    } catch {
      toast.error('Failed to generate NEMIS report');
    } finally {
      setLoadingNEMIS(false);
    }
  };

  return (
    <div className="analytics-container">
      <header className="mb-5">
        <Link to="/analytics" style={{ fontSize: '1.4rem', color: '#64748b', fontWeight: 700, textDecoration: 'none' }}>
          ← Analytics
        </Link>
        <h1 className="display-4 fw-bold text-dark mb-2 mt-2">EMIS / NEMIS Reports</h1>
        <p className="lead text-secondary">Generate government-compliant Education Management Information System exports</p>
      </header>

      <div className="analytics-summary-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '4rem' }}>
        <div className="stat-card-premium" style={{ cursor: 'default' }}>
          <div className="stat-info">
            <h4>EMIS</h4>
            <p style={{ fontSize: '1.4rem', fontWeight: 400, color: '#64748b' }}>
              Federal Ministry of Education format. Covers enrollment, attendance, infrastructure, and academic outcomes.
            </p>
          </div>
          <div className="stat-icon-box blue">🏛️</div>
        </div>
        <div className="stat-card-premium" style={{ cursor: 'default' }}>
          <div className="stat-info">
            <h4>NEMIS</h4>
            <p style={{ fontSize: '1.4rem', fontWeight: 400, color: '#64748b' }}>
              National Education Management Information System. Student-level enrollment data with biometric IDs.
            </p>
          </div>
          <div className="stat-icon-box indigo">🆔</div>
        </div>
      </div>

      <div className="chart-card-premium">
        <div className="chart-header mb-4">
          <h3>Generate Report</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '4rem' }}>
          <div className="form-group-premium" style={{ position: 'relative' }}>
            <label>Academic Session</label>
            <select value={session} onChange={(e) => setSession(e.target.value)}>
              {SESSIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group-premium" style={{ position: 'relative' }}>
            <label>Term</label>
            <select value={term} onChange={(e) => setTerm(e.target.value)}>
              {TERMS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <button
            className="btn-primary-green"
            style={{ padding: '1.4rem 3.5rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}
            onClick={handleEMIS}
            disabled={loadingEMIS}
          >
            {loadingEMIS
              ? <><div className="spinner-border spinner-border-sm" /> Generating...</>
              : <>📥 Download EMIS Report</>}
          </button>
          <button
            className="btn-secondary-outline"
            style={{ padding: '1.4rem 3.5rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}
            onClick={handleNEMIS}
            disabled={loadingNEMIS}
          >
            {loadingNEMIS
              ? <><div className="spinner-border spinner-border-sm" /> Generating...</>
              : <>📄 Download NEMIS Report</>}
          </button>
        </div>
      </div>

      <div className="chart-card-premium mt-4" style={{ background: '#f3f0ff', border: '1px solid #fde68a' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '2.4rem' }}>⚠️</span>
          <div>
            <h4 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#b8860b', marginBottom: '0.8rem' }}>Compliance Notice</h4>
            <p style={{ fontSize: '1.4rem', color: '#78350f', margin: 0 }}>
              EMIS and NEMIS reports contain sensitive student data. Only share with authorised government agencies.
              Ensure all student records are complete and accurate before generating official submissions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EMISReport;
