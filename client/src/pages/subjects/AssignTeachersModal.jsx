import { useState } from 'react';
import { toast } from 'sonner';
import { assignTeacher, unassignTeacher } from '../../services/subjectService';
import './Subjects.css';
import '../students/Students.css';

const teacherId = (t) => (typeof t === 'string' ? t : t._id);
const teacherName = (t) => (typeof t === 'object' && t?.name ? t.name : 'Teacher');
const avatarUrl = (name) =>
  `https://ui-avatars.com/api/?background=6A5ACD&color=fff&name=${encodeURIComponent(name || 'T')}`;

const AssignTeachersModal = ({ subject, allTeachers, onClose, onUpdated }) => {
  const [assigned, setAssigned] = useState(subject.teachers || []);
  const [selectedId, setSelectedId] = useState('');
  const [busy, setBusy] = useState(false);

  const assignedIds = new Set(assigned.map(teacherId));
  const available = allTeachers.filter(t => !assignedIds.has(teacherId(t)));

  const handleAssign = async () => {
    if (!selectedId) {
      toast.error('Select a teacher to assign');
      return;
    }
    setBusy(true);
    try {
      const { data } = await assignTeacher(subject._id, selectedId);
      setAssigned(data.teachers || []);
      setSelectedId('');
      onUpdated(data);
      toast.success('Teacher assigned');
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to assign teacher');
    } finally {
      setBusy(false);
    }
  };

  const handleUnassign = async (id) => {
    setBusy(true);
    try {
      const { data } = await unassignTeacher(subject._id, id);
      setAssigned(data.teachers || []);
      onUpdated(data);
      toast.success('Teacher removed');
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to remove teacher');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="subject-modal-overlay" onClick={onClose}>
      <div className="subject-modal" onClick={e => e.stopPropagation()}>
        <div className="subject-modal-header">
          <h2>Assign Teachers</h2>
          <p>{subject.name}{subject.code ? ` (${subject.code})` : ''}</p>
          <button type="button" className="subject-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="subject-modal-section">
          <h4>Currently assigned</h4>
          {assigned.length === 0 ? (
            <p className="subject-modal-empty">No teachers assigned yet.</p>
          ) : (
            <ul className="subject-teacher-list">
              {assigned.map(t => {
                const id = teacherId(t);
                const name = teacherName(t);
                return (
                  <li key={id}>
                    <img src={avatarUrl(name)} alt="" className="subject-teacher-avatar" />
                    <span>{name}</span>
                    <button
                      type="button"
                      className="subject-teacher-remove"
                      disabled={busy}
                      onClick={() => handleUnassign(id)}
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="subject-modal-section">
          <h4>Add teacher</h4>
          {available.length === 0 ? (
            <p className="subject-modal-empty">All school teachers are already assigned to this subject.</p>
          ) : (
            <div className="subject-assign-row">
              <select value={selectedId} onChange={e => setSelectedId(e.target.value)} disabled={busy}>
                <option value="">Select teacher…</option>
                {available.map(t => (
                  <option key={teacherId(t)} value={teacherId(t)}>{t.name}</option>
                ))}
              </select>
              <button type="button" className="subject-assign-btn" disabled={busy || !selectedId} onClick={handleAssign}>
                {busy ? '…' : 'Assign'}
              </button>
            </div>
          )}
        </div>

        <div className="subject-modal-footer">
          <button type="button" className="btn-cancel" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
};

export default AssignTeachersModal;
