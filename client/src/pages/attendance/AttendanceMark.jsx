import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getAttendanceByDate, markAttendance } from '../../services/attendanceService';
import { getClasses } from '../../services/classService';
import './Attendance.css';

const today = new Date().toISOString().slice(0, 10);

const AttendanceMark = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(today);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load class list on mount
  useEffect(() => {
    getClasses()
      .then(({ data }) => {
        if (!data || (!Array.isArray(data) && !data.classes)) {
          throw new Error('Invalid classes response format');
        }
        const list = Array.isArray(data) ? data : data.classes;
        setClasses(list);
        if (list.length > 0) setSelectedClass(list[0]._id ?? list[0].id);
      })
      .catch((error) => {
        const message = error?.message || 'Failed to load classes';
        console.error('Error loading classes:', error);
        toast.error(message);
      });
  }, []);

  // Load attendance roster when class or date changes
  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    getAttendanceByDate(selectedClass, selectedDate)
      .then(({ data }) => {
        if (!data) {
          setStudents([]);
          return;
        }
        const roster = data.records || [];
        setStudents(roster.map(s => ({
          _id: s._id ?? s.id,
          admissionNo: s.admissionNo ?? s.id,
          name: s.name,
          initials: (s.name ?? '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
          status: s.status ?? 'present',
          note: s.note ?? '',
        })));
      })
      .catch((error) => {
        const message = error?.message || 'Failed to load attendance roster';
        console.error('Error loading attendance roster:', error);
        toast.error(message);
        setStudents([]);
      })
      .finally(() => setLoading(false));
  }, [selectedClass, selectedDate]);

  const handleStatusChange = (id, newStatus) =>
    setStudents(prev => prev.map(s => s._id === id ? { ...s, status: newStatus } : s));

  const handleNoteChange = (id, note) =>
    setStudents(prev => prev.map(s => s._id === id ? { ...s, note } : s));

  const handleSave = async () => {
    setSaving(true);
    try {
      await markAttendance({
        classId: selectedClass,
        date: selectedDate,
        records: students.map(s => ({ studentId: s._id, status: s.status, note: s.note })),
      });
      toast.success('Attendance saved successfully!');
    } catch {
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount = students.filter(s => s.status === 'absent').length;
  const selectedClassName = classes.find(c => (c._id ?? c.id) === selectedClass)?.name ?? '';

  return (
    <div className="attendance-container">

      {/* Top Header & Controls */}
      <div className="attendance-controls">
        <div className="selection-group">
          <div className="attendance-select-wrap">
            <label>Current Class</label>
            <select
              className="attendance-select"
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
            >
              {classes.map(c => (
                <option key={c._id ?? c.id} value={c._id ?? c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="attendance-select-wrap">
            <label>Date</label>
            <input
              type="date"
              className="attendance-select"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
        <div className="attendance-btn-row">
          <div className="btn-offline-mode">
            <span style={{fontSize: '1.4rem'}}>📡</span> Live Sync
          </div>
          <button className="btn-secondary-outline" style={{padding: '1rem 2.5rem'}}
            onClick={() => {
              const id = selectedClass;
              setSelectedClass('');
              setTimeout(() => setSelectedClass(id), 50);
            }}>
            <span>🔄</span> Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="attendance-summary-grid">
        <div className="att-card">
          <div className="att-card-icon">👥</div>
          <h3>Total Students</h3>
          <p className="main-val">{students.length}</p>
          <span className="sub-text">{selectedClassName}</span>
        </div>
        <div className="att-card present">
          <div className="att-card-icon" style={{background: '#ede9fa', color: '#2d2460'}}>✓</div>
          <h3>Present</h3>
          <p className="main-val">{presentCount}</p>
          {students.length > 0 && (
            <div className="prog-bar-bg" style={{height: '6px', width: '80%'}}>
              <div className="prog-bar-fill" style={{width: `${(presentCount/students.length)*100}%`, background: '#6A5ACD'}}></div>
            </div>
          )}
        </div>
        <div className="att-card absent">
          <div className="att-card-icon" style={{background: '#fee2e2', color: '#991b1b'}}>✕</div>
          <h3>Absent</h3>
          <p className="main-val" style={{color: '#dc2626'}}>{absentCount}</p>
          <span className="sub-text red">
            {students.length > 0 ? `${((absentCount/students.length)*100).toFixed(1)}% Absence Rate` : '—'}
          </span>
        </div>
        <div className="att-card">
          <div className="att-card-icon" style={{background: '#f3f0ff', color: '#b8860b'}}>🕒</div>
          <h3>Late Entry</h3>
          <p className="main-val">{students.filter(s => s.status === 'late').length}</p>
          <span className="sub-text">Flagged for review</span>
        </div>
      </div>

      {/* Roster Section */}
      <div className="roster-section">
        <div className="roster-section-header">
          <h2 style={{fontSize: '2.4rem', fontWeight: 800}}>Student Roster</h2>
          <div style={{display: 'flex', gap: '1.5rem'}}>
            <button className="btn-secondary-outline" style={{padding: '0.8rem 2rem', fontSize: '1.2rem'}}
              onClick={() => setStudents(prev => prev.map(s => ({...s, status: 'present'})))}>
              MARK ALL PRESENT
            </button>
            <button className="btn-secondary-outline" style={{padding: '0.8rem 2rem', fontSize: '1.2rem'}}
              onClick={() => setStudents(prev => prev.map(s => ({...s, status: 'present', note: ''})))}>
              RESET ALL
            </button>
          </div>
        </div>

        <div className="roster-row-premium" style={{borderBottom: '2px solid #f1f5f9', paddingBottom: '1.5rem'}}>
          <div style={{fontSize: '1.1rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase'}}>Student Name</div>
          <div style={{fontSize: '1.1rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase'}}>Attendance Status</div>
          <div style={{fontSize: '1.1rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase'}}>Notes / Remarks</div>
          <div style={{fontSize: '1.1rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase'}}>Action</div>
        </div>

        {loading ? (
          <div style={{padding: '4rem', textAlign: 'center', color: '#64748b'}}>Loading roster…</div>
        ) : students.length === 0 ? (
          <div style={{padding: '4rem', textAlign: 'center', color: '#64748b'}}>No students in this class.</div>
        ) : students.map(student => (
          <div className="roster-row-premium" key={student._id}>
            <div className="student-meta-box">
              <div className="student-avatar-circle">{student.initials}</div>
              <div className="student-info-mini">
                <h4>{student.name}</h4>
                <p>ID: {student.admissionNo}</p>
              </div>
            </div>
            <div className="toggle-group">
              <button
                className={`toggle-btn present ${student.status === 'present' ? 'active' : ''}`}
                onClick={() => handleStatusChange(student._id, 'present')}
              >Present</button>
              <button
                className={`toggle-btn absent ${student.status === 'absent' ? 'active' : ''}`}
                onClick={() => handleStatusChange(student._id, 'absent')}
              >Absent</button>
            </div>
            <div>
              <input
                type="text"
                className="notes-input"
                placeholder="Add optional note..."
                value={student.note}
                onChange={e => handleNoteChange(student._id, e.target.value)}
              />
            </div>
            <div style={{textAlign: 'center', fontSize: '2rem', color: '#94a3b8', cursor: 'pointer'}}>⋮</div>
          </div>
        ))}
      </div>

      {/* Fixed Bottom Bar */}
      <div className="bottom-action-bar">
        <div className="marked-status-wrap">
          <div className="marked-status-text">MARKED: {presentCount + absentCount} / {students.length}</div>
          <div className="marked-progress-bg">
            <div className="marked-progress-fill"
              style={{width: students.length > 0 ? `${((presentCount + absentCount)/students.length)*100}%` : '0%'}}></div>
          </div>
        </div>
        <div style={{display: 'flex', gap: '2rem'}}>
          <button className="btn-primary-green"
            style={{padding: '1.4rem 4rem', fontSize: '1.4rem', borderRadius: '12px', background: '#6A5ACD'}}
            onClick={handleSave} disabled={saving}>
            <span>💾</span> {saving ? 'SAVING…' : 'SAVE ATTENDANCE'}
          </button>
        </div>
      </div>

      {/* Floating AI Insight */}
      <div style={{position: 'fixed', bottom: '3rem', left: '2rem', width: '220px', background: '#0f172a', borderRadius: '16px', padding: '2rem', color: 'white', zIndex: 110}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', color: '#FFD700', marginBottom: '1rem'}}>
          <span>✨</span> AI Insights
        </div>
        <p style={{fontSize: '1.1rem', color: '#94a3b8', lineHeight: 1.4}}>
          View attendance trends for {selectedClassName} performance analysis.
        </p>
      </div>

    </div>
  );
};

export default AttendanceMark;
