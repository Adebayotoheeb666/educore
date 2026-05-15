import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  getTimetable,
  updateTimetableSlot,
  publishTimetable,
} from '../../services/timetableService';
import { getClasses } from '../../services/classService';
import { getSubjects } from '../../services/subjectService';
import { getTeachers } from '../../services/teacherService';
import EditTimetableSlotModal from './EditTimetableSlotModal';
import './Timetable.css';

const SUBJECT_TYPE_MAP = {
  math: 'math', mathematics: 'math',
  english: 'english',
  science: 'science', biology: 'science', chemistry: 'chemistry', physics: 'physics',
  default: 'arts',
};

const TERMS = ['First Term', 'Second Term', 'Third Term'];

const getSubjectType = (name = '') => {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(SUBJECT_TYPE_MAP)) {
    if (lower.includes(key)) return val;
  }
  return 'arts';
};

const buildGridFromTimetable = (timetable) => {
  if (!timetable?.slots?.length) return {};
  const grid = {};
  timetable.slots.forEach((slot, slotIndex) => {
    const { day, startTime, subject, teacher } = slot;
    if (!day || !startTime) return;
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
      slotIndex,
    };
  });
  return grid;
};

const findRawSlot = (timetable, day, startTime) => {
  if (!timetable?.slots) return { slot: null, slotIndex: -1 };
  const slotIndex = timetable.slots.findIndex(
    (s) => s.day === day && s.startTime === startTime
  );
  return {
    slot: slotIndex >= 0 ? timetable.slots[slotIndex] : null,
    slotIndex,
  };
};

const Timetable = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [term, setTerm] = useState('First Term');
  const [timetable, setTimetable] = useState(null);
  const [scheduleData, setScheduleData] = useState({});
  const [clashes, setClashes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [slotModal, setSlotModal] = useState(null);
  const [savingSlot, setSavingSlot] = useState(false);
  const [publishing, setPublishing] = useState(false);

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

  const loadTimetable = useCallback(() => {
    if (!selectedClass) return;
    setLoading(true);
    getTimetable({ classId: selectedClass, term })
      .then(({ data }) => {
        setTimetable(data);
        setScheduleData(buildGridFromTimetable(data));
        setClashes([]);
      })
      .catch(() => toast.error('Failed to load timetable'))
      .finally(() => setLoading(false));
  }, [selectedClass, term]);

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
    loadTimetable();
  }, [loadTimetable]);

  useEffect(() => {
    if (!editMode) return;
    Promise.all([getSubjects(), getTeachers()])
      .then(([subRes, teachRes]) => {
        setSubjects(subRes.data?.subjects ?? subRes.data ?? []);
        setTeachers(teachRes.data?.teachers ?? teachRes.data ?? []);
      })
      .catch(() => toast.error('Failed to load subjects or teachers'));
  }, [editMode]);

  const selectedClassName = classes.find(c => (c._id ?? c.id) === selectedClass)?.name ?? '';

  const handleCellClick = (day, time) => {
    if (!editMode || !timetable?._id) {
      if (editMode && !timetable?._id) {
        toast.error('Generate a timetable first before editing slots');
      }
      return;
    }
    const { slot, slotIndex } = findRawSlot(timetable, day, time);
    setSlotModal({ day, startTime: time, slot, slotIndex });
  };

  const handleSaveSlot = async (payload) => {
    if (!timetable?._id) return;
    setSavingSlot(true);
    try {
      const body = {
        slot: {
          subject: payload.subject,
          teacher: payload.teacher,
          room: payload.room,
        },
        day: payload.day,
        startTime: payload.startTime,
      };
      if (slotModal?.slotIndex >= 0) {
        body.slotIndex = slotModal.slotIndex;
      }
      const { data } = await updateTimetableSlot(timetable._id, body);
      setTimetable(data.timetable);
      setScheduleData(buildGridFromTimetable(data.timetable));
      setClashes(data.clashes ?? []);
      setSlotModal(null);
      toast.success('Slot updated');
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to update slot');
    } finally {
      setSavingSlot(false);
    }
  };

  const handlePublish = async () => {
    if (!timetable?._id) {
      toast.error('No timetable to publish');
      return;
    }
    setPublishing(true);
    try {
      const { data } = await publishTimetable(timetable._id);
      setTimetable((prev) => ({ ...prev, status: data.status }));
      toast.success('Timetable published');
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="timetable-container">
      <header className="timetable-header-premium">
        <div className="header-left">
          <h1 className="display-4 fw-bold text-dark mb-2">Class Timetables</h1>
          <p className="lead text-secondary">
            {selectedClassName || 'Select a class'} · {term}
            {timetable?.status && (
              <span className={`badge ms-2 ${timetable.status === 'published' ? 'bg-success' : 'bg-secondary'}`}>
                {timetable.status}
              </span>
            )}
          </p>
        </div>
        <div className="header-right d-flex gap-3 flex-wrap">
          <select
            className="form-select form-select-lg premium-select"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            {classes.map(c => (
              <option key={c._id ?? c.id} value={c._id ?? c.id}>{c.name}</option>
            ))}
          </select>
          <select
            className="form-select form-select-lg premium-select"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          >
            {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button
            type="button"
            className={`btn btn-lg px-4 rounded-pill ${editMode ? 'btn-warning' : 'btn-outline-secondary'}`}
            onClick={() => setEditMode((v) => !v)}
          >
            {editMode ? 'Done editing' : 'Edit mode'}
          </button>
          {timetable?.status === 'draft' && timetable?._id && (
            <button
              type="button"
              className="btn btn-success btn-lg px-4 rounded-pill"
              onClick={handlePublish}
              disabled={publishing}
            >
              {publishing ? 'Publishing…' : 'Publish'}
            </button>
          )}
          <Link to="/timetable/generate" className="btn btn-outline-primary btn-lg px-4 rounded-pill">
            <span>✨</span> Generate
          </Link>
        </div>
      </header>

      {editMode && (
        <div className="alert alert-info mb-4">
          Click any period cell to edit subject, teacher, or room. Empty cells can be filled the same way.
        </div>
      )}

      <div className="timetable-card">
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>Loading timetable…</div>
        ) : !timetable ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
            No timetable for this class and term.{' '}
            <Link to="/timetable/generate">Generate one</Link>
          </div>
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
                        <td key={`${day}-${slot.time}`}>
                          <div className="break-slot">BREAK</div>
                        </td>
                      );
                    }
                    const period = scheduleData[day]?.[slot.time];
                    const clickable = editMode && timetable?._id;
                    return (
                      <td
                        key={`${day}-${slot.time}`}
                        className={clickable ? 'timetable-cell-editable' : ''}
                        onClick={() => clickable && handleCellClick(day, slot.time)}
                      >
                        {period ? (
                          <div className={`period-card ${period.type}`}>
                            <h4>{period.subject}</h4>
                            <p>{period.teacher}</p>
                            {period.room && <span className="room">📍 {period.room}</span>}
                            {editMode && <span className="edit-hint">Click to edit</span>}
                          </div>
                        ) : (
                          <div className={`period-card empty ${clickable ? 'editable-empty' : ''}`}>
                            <p className="text-muted opacity-50">
                              {clickable ? 'Click to add' : 'Free Slot'}
                            </p>
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

      {clashes.length > 0 && (
        <div className="conflict-panel mt-5">
          <div className="d-flex align-items-center gap-3 mb-4">
            <span className="fs-1">⚠️</span>
            <h2 className="fw-bold m-0">Detected Conflicts ({clashes.length})</h2>
          </div>
          <div className="row g-4">
            {clashes.map((c, i) => (
              <div key={i} className="col-md-6">
                <div className="conflict-card">
                  <h4 className="fw-bold text-danger m-0 mb-2">Teacher double-booking</h4>
                  <p className="text-secondary m-0">
                    {c.day} · period {c.period}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <EditTimetableSlotModal
        open={Boolean(slotModal)}
        day={slotModal?.day}
        startTime={slotModal?.startTime}
        slot={slotModal?.slot}
        subjects={subjects}
        teachers={teachers}
        onClose={() => setSlotModal(null)}
        onSave={handleSaveSlot}
        saving={savingSlot}
      />
    </div>
  );
};

export default Timetable;
