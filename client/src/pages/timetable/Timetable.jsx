import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getTimetable } from '../../services/timetableService';
import { getClasses } from '../../services/classService';
import './Timetable.css';

const SUBJECT_TYPE_MAP = {
  math: 'math', mathematics: 'math',
  english: 'english',
  science: 'science', biology: 'science', chemistry: 'chemistry', physics: 'physics',
  default: 'arts',
};

const getSubjectType = (name = '') => {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(SUBJECT_TYPE_MAP)) {
    if (lower.includes(key)) return val;
  }
  return 'arts';
};

const normalizeTimetable = (timetable) => {
  if (!timetable?.slots?.length) return {};
  const grid = {};
  for (const slot of timetable.slots) {
    const { day, startTime, subject, teacher } = slot;
    if (!day || !startTime) continue;
    if (!grid[day]) grid[day] = {};
    const subjectName = subject?.name ?? subject ?? '';
    const teacherName = teacher
      ? `${teacher.firstName ?? ''} ${teacher.lastName ?? ''}`.trim()
      : '';
    grid[day][startTime] = {
      subject: subjectName,
      teacher: teacherName,
      room: slot.room ?? '',
      type: getSubjectType(subjectName),
    };
  }
  return grid;
};

const Timetable = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [scheduleData, setScheduleData] = useState({});
  const [loading, setLoading] = useState(false);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const slots = [
    { time: '08:00', label: '1st Period' },
    { time: '08:45', label: '2nd Period' },
    { time: '09:30', label: '3rd Period' },
    { time: '10:15', label: 'Break', isBreak: true },
    { time: '10:45', label: '4th Period' },
    { time: '11:30', label: '5th Period' },
    { time: '12:15', label: '6th Period' },
    { time: '13:00', label: 'Break', isBreak: true },
    { time: '13:30', label: '7th Period' },
    { time: '14:15', label: '8th Period' },
  ];

  useEffect(() => {
    getClasses()
      .then(({ data }) => {
        const list = data.classes ?? data;
        setClasses(list);
        if (list.length > 0) setSelectedClass(list[0]._id ?? list[0].id);
      })
      .catch(() => toast.error('Failed to load classes'));
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    getTimetable({ classId: selectedClass })
      .then(({ data }) => setScheduleData(normalizeTimetable(data)))
      .catch(() => toast.error('Failed to load timetable'))
      .finally(() => setLoading(false));
  }, [selectedClass]);

  const selectedClassName = classes.find(c => (c._id ?? c.id) === selectedClass)?.name ?? '';

  return (
    <div className="timetable-container">
      <header className="timetable-header-premium">
        <div className="header-left">
          <h1 className="display-4 fw-bold text-dark mb-2">Class Timetables</h1>
          <p className="lead text-secondary">Academic Year 2023/2024 • Term 2</p>
        </div>
        <div className="header-right d-flex gap-3">
          <select
            className="form-select form-select-lg premium-select"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            {classes.map(c => (
              <option key={c._id ?? c.id} value={c._id ?? c.id}>{c.name}</option>
            ))}
          </select>
          <button className="btn btn-primary btn-lg px-4 rounded-pill shadow-sm">
            <span>🖨️</span> Print Schedule
          </button>
          <button className="btn btn-outline-primary btn-lg px-4 rounded-pill">
            <span>⚙️</span> Edit Mode
          </button>
        </div>
      </header>

      <div className="optimization-banner">
        <div className="opt-icon">✨</div>
        <div className="opt-content">
          <h3>AI Optimization Available</h3>
          <p>
            Let AI analyze the current schedule for <strong>{selectedClassName}</strong> and suggest
            improvements to reduce cognitive load and optimize teacher allocations.
          </p>
          <button className="btn btn-warning fw-bold px-4 rounded-pill">Apply AI Suggestion</button>
        </div>
      </div>

      <div className="timetable-card">
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>Loading timetable…</div>
        ) : (
          <table className="premium-timetable-grid">
            <thead>
              <tr>
                <th style={{ width: '100px' }}>Time</th>
                {days.map(day => <th key={day}>{day}</th>)}
              </tr>
            </thead>
            <tbody>
              {slots.map((slot, idx) => (
                <tr key={idx}>
                  <td className="time-slot-column">
                    <span>{slot.time}</span>
                    <small>{slot.label}</small>
                  </td>
                  {days.map(day => {
                    if (slot.isBreak) {
                      return (
                        <td key={`${day}-${slot.time}`} colSpan="1">
                          <div className="break-slot">BREAK</div>
                        </td>
                      );
                    }
                    const period = scheduleData[day]?.[slot.time];
                    return (
                      <td key={`${day}-${slot.time}`}>
                        {period ? (
                          <div className={`period-card ${period.type}`}>
                            <h4>{period.subject}</h4>
                            <p>{period.teacher}</p>
                            {period.room && <span className="room">📍 {period.room}</span>}
                          </div>
                        ) : (
                          <div className="period-card empty">
                            <p className="text-muted opacity-50">Free Slot</p>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="conflict-panel mt-5">
        <div className="d-flex align-items-center gap-3 mb-4">
          <span className="fs-1">⚠️</span>
          <h2 className="fw-bold m-0">Detected Conflicts</h2>
        </div>
        <div className="row g-4">
          <div className="col-md-6">
            <div className="conflict-card">
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="fw-bold text-danger m-0">Teacher Double-Booking</h4>
                <span className="badge bg-danger">Critical</span>
              </div>
              <p className="text-secondary m-0">
                Check for teachers scheduled across multiple classes at the same period.
              </p>
              <button className="btn btn-outline-danger w-100">Resolve Conflict</button>
            </div>
          </div>
          <div className="col-md-6">
            <div className="conflict-card" style={{ borderLeftColor: '#FFD700' }}>
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="fw-bold text-warning m-0">Resource Conflict</h4>
                <span className="badge bg-warning text-dark">Warning</span>
              </div>
              <p className="text-secondary m-0">
                Labs and shared rooms may be double-booked across classes.
              </p>
              <button className="btn btn-outline-warning w-100">View Lab Schedule</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timetable;
