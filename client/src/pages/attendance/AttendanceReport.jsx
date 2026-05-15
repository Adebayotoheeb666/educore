import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import './Attendance.css';

const getClassAttendanceReport = (classId) => 
  axios.get(`/api/attendance/report/${classId}`);

const getClasses = () => axios.get('/api/classes');

const AttendanceReport = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const { data } = await getClasses();
        const classList = data.classes ?? data;
        setClasses(classList);
        if (classList.length > 0) {
          setSelectedClass(classList[0]._id ?? classList[0].id);
        }
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Failed to load classes';
        setError(message);
        toast.error(message);
      }
    };
    loadClasses();
  }, []);

  useEffect(() => {
    if (!selectedClass) return;

    const loadReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await getClassAttendanceReport(selectedClass);
        setReportData(data);
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Failed to load attendance report';
        setError(message);
        toast.error(message);
        setReportData(null);
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [selectedClass]);

  if (error && !loading) {
    return (
      <div className="attendance-container">
        <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
          <h3>⚠️ Error Loading Report</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#6A5ACD', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const selectedClassName = classes.find(c => (c._id ?? c.id) === selectedClass)?.name ?? 'Select Class';

  return (
    <div className="attendance-container">
      
      <div style={{marginBottom: '4rem'}}>
        <h1 style={{fontSize: '3.2rem', fontWeight: 800, color: '#0f172a'}}>Attendance Reporting</h1>
      </div>

      {/* Filter Card */}
      <div className="report-filter-card">
         <div className="attendance-select-wrap" style={{flex: 1}}>
            <label>Select Grade / Class</label>
            <select 
              className="attendance-select" 
              style={{width: '100%'}} 
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              {classes.map(c => (
                <option key={c._id ?? c.id} value={c._id ?? c.id}>
                  {c.name}
                </option>
              ))}
            </select>
         </div>
         <div className="attendance-select-wrap" style={{flex: 1}}>
            <label>Select Term Period</label>
            <div style={{position: 'relative'}}>
              <input 
                type="text" 
                className="attendance-select" 
                style={{width: '100%'}} 
                defaultValue="Current Academic Session" 
                disabled
              />
              <span style={{position: 'absolute', right: '1.5rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.8rem'}}>📅</span>
            </div>
         </div>
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
          <div className="spinner-border text-primary"></div>
          <p style={{ marginTop: '1rem' }}>Loading attendance report...</p>
        </div>
      ) : reportData ? (
        <>
          {/* Summary Cards */}
          <div className="attendance-summary-grid">
            <div className="att-card">
              <div className="att-card-icon" style={{background: '#eff6ff', color: '#1e40af'}}>📅</div>
              <h3>Total School Days</h3>
              <p className="main-val">{reportData.totalSchoolDays ?? '—'}</p>
              <span className="sub-text">ⓘ Current Academic Year</span>
            </div>
            
            <div className="att-card" style={{gridColumn: 'span 1.5'}}>
              <div className="att-card-icon" style={{background: '#ede9fa', color: '#2d2460'}}>📈</div>
              <h3>Average Attendance Rate</h3>
              <p className="main-val" style={{color: '#6A5ACD'}}>{reportData.averageAttendanceRate ? `${reportData.averageAttendanceRate.toFixed(1)}%` : '—'}</p>
              <div className="prog-bar-bg" style={{height: '8px', width: '60%'}}>
                 <div className="prog-bar-fill" style={{width: `${Math.min(reportData.averageAttendanceRate ?? 0, 100)}%`, background: '#6A5ACD'}}></div>
              </div>
            </div>

          </div>

          {/* Breakdown Table */}
          <div className="roster-section">
             <div className="roster-section-header">
                <h2 style={{fontSize: '2.4rem', fontWeight: 800}}>{selectedClassName} - Student Breakdown</h2>
                <button className="btn-secondary-outline" style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                   <span>📥</span> Export CSV
                </button>
             </div>

             <table className="premium-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Attendance Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.studentBreakdown && reportData.studentBreakdown.length > 0 ? (
                    reportData.studentBreakdown.map((s, i) => {
                      const attendanceRate = s.totalDays > 0 
                        ? ((s.present / s.totalDays) * 100).toFixed(1)
                        : '0';
                      const level = attendanceRate >= 85 ? 'high' : attendanceRate >= 75 ? 'med' : 'low';
                      return (
                        <tr key={i}>
                          <td>
                            <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
                               <div className="student-avatar-circle" style={{background: '#eff6ff', color: '#1e40af'}}>
                                 {(s.name ?? '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                               </div>
                               <span style={{fontWeight: 700}}>{s.name ?? '—'}</span>
                            </div>
                          </td>
                          <td>{s.present ?? 0}</td>
                          <td>{s.absent ?? 0}</td>
                          <td>
                            <span className={`att-rate-badge ${level}`}>
                              {attendanceRate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                        No attendance data available
                      </td>
                    </tr>
                  )}
                </tbody>
             </table>

             {reportData.studentBreakdown && reportData.studentBreakdown.length > 0 && (
               <div style={{marginTop: '3rem', display: 'flex', justifyContent: 'flex-end'}}>
                  <div className="pagination-wrap">
                     <button className="pag-btn">❮</button>
                     <button className="pag-btn">❯</button>
                  </div>
               </div>
             )}
          </div>

          {/* Policy Helper Banner */}
          <div className="policy-helper-banner">
             <div className="policy-image-side">
                <img 
                  src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=1000" 
                  alt="Students in classroom" 
                />
                <div style={{position: 'absolute', bottom: '3rem', left: '3rem', right: '3rem', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', padding: '2rem', borderRadius: '12px', color: 'white', fontSize: '1.5rem', fontWeight: 700, fontStyle: 'italic', border: '1px solid rgba(255,255,255,0.2)'}}>
                  "Consistent attendance is the first step toward academic mastery."
                </div>
             </div>
             <div className="policy-text-side">
                <h2>Attendance Policy Helper</h2>
                <p>
                  The school policy requires students to maintain a minimum of 75% attendance to qualify for terminal examinations. Students marked in <span style={{color: '#dc2626', fontWeight: 800}}>Red</span> should be scheduled for a counseling session with the academic registrar.
                </p>
                <div style={{display: 'flex', gap: '2rem'}}>
                   <button className="btn-secondary-outline" style={{flex: 1, padding: '1.5rem', borderRadius: '10px', fontSize: '1.4rem', fontWeight: 800, background: 'white'}}>
                     <span>✉</span> Notify Parents
                   </button>
                   <button className="btn-secondary-outline" style={{flex: 1, padding: '1.5rem', borderRadius: '10px', fontSize: '1.4rem', fontWeight: 800, background: 'white'}}>
                     <span>📄</span> Generate Slip
                   </button>
                </div>
             </div>
          </div>

        </>
      ) : null}

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

export default AttendanceReport;
