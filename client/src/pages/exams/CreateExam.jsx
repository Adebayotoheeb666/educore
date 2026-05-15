import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { createExam } from '../../services/examService';
import { getSubjects } from '../../services/subjectService';
import { getClasses } from '../../services/classService';
import './Exams.css';
import '../teachers/Teachers.css';

const CreateExam = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    subject: '',
    class: '',
    term: 'First Term',
    type: 'exam',
    totalMarks: 100,
    duration: 120,
    scheduledDate: '',
  });

  useEffect(() => {
    Promise.all([getSubjects(), getClasses()])
      .then(([sRes, cRes]) => {
        setSubjects(sRes.data || []);
        setClasses(cRes.data?.classes ?? cRes.data ?? []);
      })
      .catch(() => toast.error('Failed to load form data'));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.class) {
      toast.error('Subject and class are required');
      return;
    }
    setSubmitting(true);
    try {
      await createExam(form);
      toast.success('Exam created');
      navigate('/exams');
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to create exam');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="exams-container">
      <h1 style={{ fontSize: '3.6rem', fontWeight: 800, marginBottom: '4rem' }}>Schedule Examination</h1>
      <div className="exam-details-form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div className="form-group-premium">
              <label>Subject *</label>
              <select required value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}>
                <option value="">Select subject</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group-premium">
              <label>Class *</label>
              <select required value={form.class} onChange={e => setForm(f => ({ ...f, class: e.target.value }))}>
                <option value="">Select class</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.name}{c.arm ? ` ${c.arm}` : ''}</option>)}
              </select>
            </div>
            <div className="form-group-premium">
              <label>Term</label>
              <select value={form.term} onChange={e => setForm(f => ({ ...f, term: e.target.value }))}>
                <option>First Term</option>
                <option>Second Term</option>
                <option>Third Term</option>
              </select>
            </div>
            <div className="form-group-premium">
              <label>Exam Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="ca">Continuous Assessment</option>
                <option value="exam">Exam</option>
              </select>
            </div>
            <div className="form-group-premium">
              <label>Total Marks</label>
              <input type="number" value={form.totalMarks} onChange={e => setForm(f => ({ ...f, totalMarks: Number(e.target.value) }))} />
            </div>
            <div className="form-group-premium">
              <label>Duration (minutes)</label>
              <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} />
            </div>
            <div className="form-group-premium" style={{ gridColumn: '1 / -1' }}>
              <label>Scheduled Date</label>
              <input type="date" value={form.scheduledDate} onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2rem', marginTop: '3rem' }}>
            <button type="button" className="btn-cancel" onClick={() => navigate('/exams')}>Cancel</button>
            <button type="submit" className="btn-submit" disabled={submitting} style={{ background: '#5849b8' }}>
              {submitting ? 'Creating…' : 'Create Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateExam;
