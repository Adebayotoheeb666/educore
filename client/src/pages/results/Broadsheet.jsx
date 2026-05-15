import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getBroadsheet } from '../../services/resultService';
import { getClasses } from '../../services/classService';
import './Results.css';
import '../teachers/Teachers.css';

const parseBlobError = async (blob) => {
  try {
    const text = await blob.text();
    const json = JSON.parse(text);
    return json.message || 'Failed to generate broadsheet';
  } catch {
    return 'Failed to generate broadsheet';
  }
};

const Broadsheet = () => {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [term, setTerm] = useState('First Term');
  const [session, setSession] = useState('2024/2025');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    getClasses()
      .then(({ data }) => setClasses(data?.classes ?? data ?? []))
      .catch(() => toast.error('Failed to load classes'));
  }, []);

  const selectedClass = classes.find((c) => c._id === classId);
  const classLabel = selectedClass
    ? `${selectedClass.name}${selectedClass.arm ? ` ${selectedClass.arm}` : ''}`
    : classId;

  const handleDownload = async (e) => {
    e.preventDefault();
    if (!classId) {
      toast.error('Select a class');
      return;
    }
    setDownloading(true);
    try {
      const response = await getBroadsheet(classId, { term, session });
      const contentType = response.headers['content-type'] || '';

      if (
        response.data instanceof Blob &&
        (contentType.includes('spreadsheet') ||
          contentType.includes('excel') ||
          contentType.includes('octet-stream'))
      ) {
        const safeClass = (classLabel || 'class').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        const safeTerm = term.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        const url = window.URL.createObjectURL(response.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `broadsheet-${safeClass}-${safeTerm}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Broadsheet downloaded');
        return;
      }

      if (response.data?.url) {
        window.open(response.data.url, '_blank');
        toast.success('Broadsheet generated');
        return;
      }

      toast.success(response.data?.message || 'Broadsheet request submitted');
    } catch (err) {
      const data = err?.response?.data;
      if (data instanceof Blob) {
        toast.error(await parseBlobError(data));
      } else {
        toast.error(err?.response?.data?.message ?? 'Failed to generate broadsheet');
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="results-container">
      <h1 style={{ fontSize: '3.6rem', fontWeight: 800, marginBottom: '0.8rem' }}>Export Broadsheet</h1>
      <p style={{ fontSize: '1.6rem', color: '#64748b', marginBottom: '4rem' }}>
        Download a class-wide Excel broadsheet with per-subject CA, exam, total, and grade columns.
      </p>

      <div className="broadsheet-grid">
        <div className="export-criteria-card">
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '3rem' }}>Selection Criteria</h2>
          <form onSubmit={handleDownload}>
            <div className="form-group-premium" style={{ marginBottom: '2rem' }}>
              <label>Class *</label>
              <select required value={classId} onChange={e => setClassId(e.target.value)}>
                <option value="">Choose a class…</option>
                {classes.map(c => (
                  <option key={c._id} value={c._id}>{c.name}{c.arm ? ` ${c.arm}` : ''}</option>
                ))}
              </select>
            </div>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
              <div className="form-group-premium">
                <label>Term</label>
                <select value={term} onChange={e => setTerm(e.target.value)}>
                  <option>First Term</option>
                  <option>Second Term</option>
                  <option>Third Term</option>
                </select>
              </div>
              <div className="form-group-premium">
                <label>Session</label>
                <input type="text" value={session} onChange={e => setSession(e.target.value)} />
              </div>
            </div>
            <button type="submit" disabled={downloading} className="btn-primary-green" style={{ width: '100%', padding: '2rem', background: '#6A5ACD' }}>
              {downloading ? 'Generating…' : 'Download Broadsheet (Excel)'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Broadsheet;
