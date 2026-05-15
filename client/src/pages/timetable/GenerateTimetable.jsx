import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { generateAITimetable } from '../../services/timetableService';
import { getClasses } from '../../services/classService';
import './Timetable.css';

const GenerateTimetable = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [term, setTerm] = useState('First Term');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    getClasses()
      .then(({ data }) => {
        const list = data?.classes ?? data ?? [];
        setClasses(list);
        if (list[0]) setClassId(list[0]._id ?? list[0].id);
      })
      .catch(() => toast.error('Failed to load classes'));
  }, []);

  const handleGenerate = async () => {
    if (!classId) {
      toast.error('Select a class');
      return;
    }
    setIsGenerating(true);
    try {
      await generateAITimetable({ classId, term });
      toast.success('Timetable generated successfully');
      navigate('/timetable');
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to generate timetable');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="timetable-container">
      <header className="timetable-header-premium">
        <div className="header-left">
          <h1 className="display-4 fw-bold text-dark mb-2">AI Timetable Studio</h1>
          <p className="lead text-secondary">Constraint-based automated scheduling</p>
        </div>
        <div className="header-right">
          <button
            type="button"
            className={`btn btn-lg px-5 rounded-pill shadow ${isGenerating ? 'btn-secondary' : 'btn-primary'}`}
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating…' : '✨ Generate Timetable'}
          </button>
        </div>
      </header>

      <div className="generator-layout">
        <aside className="config-panel">
          <h3 className="fw-bold mb-4">Generation Settings</h3>
          <div className="mb-4">
            <label className="form-label fw-bold">Class *</label>
            <select className="form-select premium-select" value={classId} onChange={e => setClassId(e.target.value)}>
              {classes.map(c => (
                <option key={c._id ?? c.id} value={c._id ?? c.id}>{c.name}{c.arm ? ` ${c.arm}` : ''}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="form-label fw-bold">Term *</label>
            <select className="form-select premium-select" value={term} onChange={e => setTerm(e.target.value)}>
              <option>First Term</option>
              <option>Second Term</option>
              <option>Third Term</option>
            </select>
          </div>
          <p className="text-secondary small">
            The AI engine assigns subjects to periods based on class curriculum and teacher availability.
          </p>
        </aside>
        <main className="generation-preview">
          <div className="timetable-card p-5 text-center">
            <h3 className="text-muted">Select a class and term, then click Generate.</h3>
            <p className="text-secondary">View the result on the Timetable page after generation.</p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default GenerateTimetable;
