import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { bulkImportStudents } from '../../services/studentService';
import './Students.css';

const TEMPLATE_HEADERS = ['STUDENT_ID', 'FULL_NAME', 'CLASS_GRADE', 'GENDER', 'PARENT_PHONE', 'DATE_OF_BIRTH', 'ADDRESS'];
const TEMPLATE_EXAMPLE = ['ST-0001', 'Adebayo Tunde', 'JSS 1', 'Male', '08012345678', '2010-04-15', '12 Broad Street, Lagos'];

const downloadTemplate = () => {
  const rows = [TEMPLATE_HEADERS, TEMPLATE_EXAMPLE];
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'student_import_template.csv';
  a.click();
  URL.revokeObjectURL(url);
};

const BulkImport = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const processFile = async (file) => {
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      toast.error('Only .csv and .xlsx files are supported');
      return;
    }

    setSelectedFile(file);
    setResults(null);
    setIsUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await bulkImportStudents(formData, {
        onUploadProgress: (evt) => {
          if (evt.total) {
            setProgress(Math.round((evt.loaded / evt.total) * 100));
          }
        },
      });
      setProgress(100);
      setResults(data);
      toast.success(`Import complete — ${data.successful ?? data.created ?? 0} students added`);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Import failed. Please check your file and try again.');
      setResults(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e) => processFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processFile(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  return (
    <div className="students-container">

      <div style={{marginBottom: '3rem'}}>
        <Link to="/students" style={{textDecoration: 'none', color: '#64748b', fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <span>←</span> Back to Student List
        </Link>
      </div>

      <div style={{marginBottom: '4rem'}}>
        <h1 style={{fontSize: '3.6rem', fontWeight: 800, color: '#0f172a'}}>Bulk Import Students</h1>
      </div>

      <div className="import-layout">

        {/* Left: Requirements */}
        <aside>
          <div className="requirement-card">
            <h3 className="widget-section-title"><span>ℹ️</span> Data Requirements</h3>
            <p style={{fontSize: '1.3rem', color: '#64748b', marginBottom: '2.5rem', lineHeight: 1.5}}>
              Ensure your .csv or .xlsx file includes the following mandatory columns to avoid import errors.
            </p>

            {[
              { id: 'STUDENT_ID', label: 'STUDENT_ID', desc: 'Unique identifier (Numeric/Alphanumeric)' },
              { id: 'FULL_NAME', label: 'FULL_NAME', desc: 'Official name as on birth certificate' },
              { id: 'CLASS_GRADE', label: 'CLASS_GRADE', desc: 'Current grade (e.g., JSS 1, SS 2)' },
              { id: 'PARENT_PHONE', label: 'PARENT_PHONE', desc: '11-digit mobile number' },
            ].map(req => (
              <div className="req-item-import" key={req.id}>
                <div className="req-check">✓</div>
                <div className="req-text">
                  <h5>{req.label}</h5>
                  <p>{req.desc}</p>
                </div>
              </div>
            ))}

            <button
              className="btn-secondary-outline"
              style={{width: '100%', justifyContent: 'center', marginTop: '2rem'}}
              onClick={downloadTemplate}
            >
              <span>📥</span> Download Template
            </button>
          </div>

          <div className="ai-formatting-card">
            <span>⚡</span>
            <div>
              <h4>AI-SMART FORMATTING</h4>
              <p>Our AI automatically matches your column headers to our system, even if the names don't match exactly.</p>
            </div>
          </div>
        </aside>

        {/* Right: Upload Area */}
        <div className="upload-section">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            style={{display: 'none'}}
            onChange={handleFileChange}
          />

          <div
            className="upload-dropzone"
            style={dragOver ? {borderColor: '#6A5ACD', background: '#f3f0ff'} : {}}
            onClick={() => !isUploading && fileInputRef.current.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="dropzone-icon">📁</div>
            <div className="dropzone-text">
              <h3>{selectedFile ? selectedFile.name : 'Upload your Student List'}</h3>
              <p>
                {selectedFile
                  ? 'Click to choose a different file'
                  : <>Drag and drop your .csv or .xlsx file here, or <span style={{color: '#6A5ACD', textDecoration: 'underline', fontWeight: 700}}>browse files</span></>}
              </p>
            </div>
            <div className="format-selectors">
              <div className="format-btn">📄 .CSV</div>
              <div className="format-btn">📊 .XLSX</div>
            </div>
          </div>

          {isUploading && (
            <div className="import-progress-card">
              <div className="progress-header-row">
                <span>Processing {selectedFile?.name ?? 'file'}…</span>
                <span style={{color: '#6A5ACD'}}>{progress}% COMPLETE</span>
              </div>
              <div className="progress-bar-bg-import">
                <div className="progress-bar-fill-import" style={{width: `${progress}%`}}></div>
              </div>
            </div>
          )}

          {results && (
            <div className="import-results-container">
              <div className="results-summary-bar">
                <h3 style={{fontSize: '2rem', fontWeight: 800}}>Import Results</h3>
                <div style={{display: 'flex', gap: '1rem'}}>
                  <span className="summary-pill success">✓ {results.successful ?? results.created ?? 0} SUCCESSFUL</span>
                  {(results.errors?.length > 0 || results.failed > 0) && (
                    <span className="summary-pill error">⚠ {results.errors?.length ?? results.failed} ERRORS FOUND</span>
                  )}
                </div>
              </div>

              {results.errors?.length > 0 && (
                <div className="error-list-import">
                  {results.errors.map((err, i) => (
                    <div className="error-item-import" key={i}>
                      <div className="error-main-info">
                        <div className="error-icon-box">⚠</div>
                        <div className="error-msg-text">
                          <h5>{err.row ? `Row ${err.row}: ` : ''}{err.title ?? err.message ?? 'Error'}</h5>
                          <p>{err.detail ?? err.description ?? ''}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{marginTop: '3rem', display: 'flex', justifyContent: 'flex-end', gap: '2rem'}}>
                <button
                  className="btn-cancel"
                  style={{padding: '1.2rem 3rem'}}
                  onClick={() => { setResults(null); setSelectedFile(null); }}
                >
                  Import Another
                </button>
                {(results.successful ?? results.created ?? 0) > 0 && (
                  <Link to="/students" className="btn-primary-green" style={{padding: '1.2rem 3rem', background: '#6A5ACD', textDecoration: 'none'}}>
                    View Students
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default BulkImport;
