import React, { useState, useEffect } from 'react';
import '../subjects/Subjects.css';

const EditTimetableSlotModal = ({
  open,
  day,
  startTime,
  slot,
  subjects,
  teachers,
  onClose,
  onSave,
  saving,
}) => {
  const [subjectId, setSubjectId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [room, setRoom] = useState('');

  useEffect(() => {
    if (!open) return;
    setSubjectId(slot?.subject?._id ?? slot?.subject ?? '');
    setTeacherId(slot?.teacher?._id ?? slot?.teacher ?? '');
    setRoom(slot?.room ?? '');
  }, [open, slot]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      subject: subjectId || undefined,
      teacher: teacherId || undefined,
      room: room.trim() || undefined,
      day,
      startTime,
    });
  };

  return (
    <div className="subject-modal-overlay" onClick={onClose}>
      <div className="subject-modal" onClick={(e) => e.stopPropagation()}>
        <div className="subject-modal-header">
          <h2>Edit period</h2>
          <p>{day} · {startTime}</p>
          <button type="button" className="subject-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group-premium" style={{ marginBottom: '1.5rem' }}>
            <label>Subject</label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">— Select —</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group-premium" style={{ marginBottom: '1.5rem' }}>
            <label>Teacher</label>
            <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
              <option value="">— Select —</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.firstName} {t.lastName}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group-premium" style={{ marginBottom: '2rem' }}>
            <label>Room</label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="e.g. Lab 2"
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save slot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTimetableSlotModal;
