import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { generateLessonPlan, saveLessonPlan } from '../../services/aiService';

const TERMS = ['First Term', 'Second Term', 'Third Term'];
const BLOOMS = ['Remembering', 'Understanding', 'Applying', 'Analysing', 'Evaluating', 'Creating'];

const GenerateLessonPlan = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({ subject: '', subjectName: '', classLevel: '', classId: '', topic: '', term: 'First Term', duration: 40 });
  const [generated, setGenerated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([axios.get('/api/subjects'), axios.get('/api/classes')])
      .then(([s, c]) => {
        if (!Array.isArray(s.data)) {
          throw new Error('Invalid subjects response');
        }
        if (!Array.isArray(c.data)) {
          throw new Error('Invalid classes response');
        }
        setSubjects(s.data);
        setClasses(c.data);
      })
      .catch((error) => {
        console.error('Error loading subjects/classes:', error);
        toast.error(error?.message || 'Failed to load form data');
      });
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.topic) return toast.error('Topic is required');
    setLoading(true);
    try {
      const { data } = await generateLessonPlan({ ...form });
      setGenerated(data);
      toast.success('Lesson plan generated!');
    } catch (err) {
      console.error('Error generating lesson plan:', err);
      if (err?.status === 503) {
        toast.error('AI service unavailable — try again shortly');
      } else {
        const message = err?.message || 'Failed to generate lesson plan';
        toast.error(message);
      }
    } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!generated) return;
    setSaving(true);
    try {
      await saveLessonPlan({ ...generated, subject: form.subject, class: form.classId, topic: form.topic, aiGenerated: true });
      toast.success('Lesson plan saved!');
      navigate('/lesson-plans');
    } catch (error) {
      console.error('Error saving lesson plan:', error);
      const message = error?.message || 'Failed to save lesson plan';
      toast.error(message);
    }
    finally { setSaving(false); }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold">Generate Lesson Plan</h4>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>← Back</button>
      </div>
      <div className="row g-4">
        <div className="col-md-4">
          <div className="card p-3">
            <h6 className="fw-bold mb-3">Parameters</h6>
            <form onSubmit={handleGenerate}>
              <div className="mb-2">
                <label className="form-label">Subject</label>
                <select className="form-select form-select-sm" value={form.subject} onChange={(e) => { const s = subjects.find(x => x._id === e.target.value); setForm({...form, subject: e.target.value, subjectName: s?.name || ''}); }}>
                  <option value="">Select subject</option>
                  {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div className="mb-2">
                <label className="form-label">Class</label>
                <select className="form-select form-select-sm" value={form.classId} onChange={(e) => { const c = classes.find(x => x._id === e.target.value); setForm({...form, classId: e.target.value, classLevel: c?.level || ''}); }}>
                  <option value="">Select class</option>
                  {classes.map(c => <option key={c._id} value={c._id}>{c.name} {c.arm}</option>)}
                </select>
              </div>
              <div className="mb-2"><label className="form-label">Topic *</label><input className="form-control form-control-sm" value={form.topic} onChange={(e) => setForm({...form, topic: e.target.value})} required /></div>
              <div className="mb-2"><label className="form-label">Term</label><select className="form-select form-select-sm" value={form.term} onChange={(e) => setForm({...form, term: e.target.value})}>{TERMS.map(t => <option key={t}>{t}</option>)}</select></div>
              <div className="mb-3"><label className="form-label">Duration (mins)</label><input type="number" className="form-control form-control-sm" value={form.duration} onChange={(e) => setForm({...form, duration: e.target.value})} /></div>
              <button type="submit" className="btn btn-primary w-100" disabled={loading}>{loading ? 'Generating...' : '✨ Generate with AI'}</button>
            </form>
          </div>
        </div>

        <div className="col-md-8">
          {!generated ? (
            <div className="text-center py-5 text-muted card"><p>Fill in the parameters and click Generate to create a lesson plan using AI.</p></div>
          ) : (
            <div className="card p-3">
              <div className="d-flex justify-content-between mb-3">
                <h6 className="fw-bold mb-0">{generated.topic}</h6>
                <button className="btn btn-success btn-sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Plan'}</button>
              </div>
              <p className="small text-muted mb-2">NERDC Ref: {generated.nerdcReference}</p>
              <div className="mb-2"><strong>Objectives:</strong><ul className="mt-1">{generated.objectives?.map((o, i) => <li key={i} className="small">{o}</li>)}</ul></div>
              <div className="mb-2"><strong>Introduction:</strong><p className="small">{generated.content?.intro}</p></div>
              <div className="mb-2"><strong>Development:</strong><p className="small">{generated.content?.development}</p></div>
              <div className="mb-2"><strong>Conclusion:</strong><p className="small">{generated.content?.conclusion}</p></div>
              <div className="mb-2"><strong>Teaching Aids:</strong><div className="d-flex flex-wrap gap-1 mt-1">{generated.teachingAids?.map((a, i) => <span key={i} className="badge bg-light text-dark border">{a}</span>)}</div></div>
              <div><strong>Assessment:</strong><p className="small">{generated.assessment}</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerateLessonPlan;
