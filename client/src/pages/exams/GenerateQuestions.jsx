import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { generateAIQuestions } from '../../services/examService';
import './Exams.css';

const QUESTION_TYPES = ['mcq', 'theory', 'essay', 'true_false', 'fill_blank'];
const DIFFICULTIES   = ['easy', 'medium', 'hard'];
const EXAM_PATTERNS  = ['waec', 'neco', 'jamb', 'internal', 'ca'];
const CLASS_LEVELS   = ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'];

const TYPE_LABELS = { mcq: 'Multiple Choice', theory: 'Theory', essay: 'Essay', true_false: 'True/False', fill_blank: 'Fill in the Blank' };

const GenerateQuestions = () => {
  const [params, setParams] = useState({
    subject: '',
    classLevel: 'SSS 3',
    topic: '',
    type: 'mcq',
    count: 10,
    difficulty: 'medium',
    examPattern: 'internal',
  });
  const [questions, setQuestions] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);

  const handleGenerate = async () => {
    if (!params.subject || !params.topic) {
      toast.error('Subject and topic are required');
      return;
    }
    setGenerating(true);
    setQuestions([]);
    try {
      const { data } = await generateAIQuestions(params);
      setQuestions(data?.questions || data || []);
      if ((data?.questions || data || []).length === 0) {
        toast.info('No questions returned. Check your parameters and try again.');
      } else {
        toast.success(`${(data?.questions || data).length} questions generated`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const updateQuestion = (idx, field, value) => {
    setQuestions((prev) => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const removeQuestion = (idx) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
    toast.info('Question removed');
  };

  return (
    <div className="exams-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '3rem' }}>
        <Link to="/exams/question-bank" style={{ textDecoration: 'none', color: '#64748b', fontSize: '1.4rem', fontWeight: 700 }}>
          Question Bank
        </Link>
        <span style={{ color: '#94a3b8' }}>›</span>
        <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>AI Question Generator</span>
      </div>

      <div className="qbank-layout">

        {/* Sidebar: Generation Parameters */}
        <aside className="qbank-sidebar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '3rem' }}>
            <span style={{ fontSize: '2rem' }}>🤖</span>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Generation Parameters</h3>
          </div>

          <div className="form-group-premium" style={{ marginBottom: '2rem', position: 'relative' }}>
            <label>Subject</label>
            <input
              type="text"
              placeholder="e.g. Mathematics"
              value={params.subject}
              onChange={(e) => setParams({ ...params, subject: e.target.value })}
            />
          </div>

          <div className="form-group-premium" style={{ marginBottom: '2rem', position: 'relative' }}>
            <label>Class Level</label>
            <select value={params.classLevel} onChange={(e) => setParams({ ...params, classLevel: e.target.value })}>
              {CLASS_LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>

          <div className="form-group-premium" style={{ marginBottom: '2rem', position: 'relative' }}>
            <label>Topic</label>
            <input
              type="text"
              placeholder="e.g. Calculus: Derivatives"
              value={params.topic}
              onChange={(e) => setParams({ ...params, topic: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="form-group-premium" style={{ position: 'relative' }}>
              <label>Type</label>
              <select value={params.type} onChange={(e) => setParams({ ...params, type: e.target.value })}>
                {QUESTION_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div className="form-group-premium" style={{ position: 'relative' }}>
              <label>Count</label>
              <input
                type="number"
                min={1}
                max={50}
                value={params.count}
                onChange={(e) => setParams({ ...params, count: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="form-group-premium" style={{ marginBottom: '2rem', position: 'relative' }}>
            <label>Difficulty</label>
            <select value={params.difficulty} onChange={(e) => setParams({ ...params, difficulty: e.target.value })}>
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
            </select>
          </div>

          <div className="form-group-premium" style={{ marginBottom: '3rem', position: 'relative' }}>
            <label>Exam Pattern</label>
            <select value={params.examPattern} onChange={(e) => setParams({ ...params, examPattern: e.target.value })}>
              {EXAM_PATTERNS.map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
            </select>
          </div>

          <button
            className="btn-primary-green"
            style={{ width: '100%', padding: '1.5rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating
              ? <><div className="spinner-border spinner-border-sm" /> AI is generating...</>
              : '✨ Generate Questions'}
          </button>

          <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f3f0ff', borderRadius: 10, border: '1px solid #c8c1e8' }}>
            <p style={{ fontSize: '1.2rem', color: '#2d2460', margin: 0 }}>
              💡 AI uses the NERDC curriculum to generate curriculum-aligned questions in the selected exam format.
            </p>
          </div>
        </aside>

        {/* Main: Generated Questions */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {questions.length === 0 && !generating ? (
            <div style={{ textAlign: 'center', padding: '8rem 2rem', background: '#f8fafc', borderRadius: 16, border: '2px dashed #e2e8f0' }}>
              <span style={{ fontSize: '5rem' }}>📝</span>
              <h3 style={{ fontSize: '2rem', fontWeight: 700, color: '#64748b', marginTop: '2rem' }}>Questions will appear here</h3>
              <p style={{ fontSize: '1.4rem', color: '#94a3b8', marginTop: '1rem' }}>
                Fill in the parameters on the left and click Generate Questions.
              </p>
            </div>
          ) : generating ? (
            <div style={{ textAlign: 'center', padding: '8rem 2rem' }}>
              <div className="spinner-border text-primary" style={{ width: '4rem', height: '4rem' }} />
              <p style={{ fontSize: '1.6rem', color: '#64748b', marginTop: '2rem' }}>
                🤖 AI is crafting your questions…
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>
                  {questions.length} Questions Generated
                </h3>
                <span style={{ fontSize: '1.3rem', color: '#64748b' }}>
                  Click any question to edit it before saving.
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {questions.map((q, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#fff',
                      borderRadius: 14,
                      border: editingIdx === idx ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                      padding: '2.5rem',
                      cursor: 'pointer',
                    }}
                    onClick={() => setEditingIdx(editingIdx === idx ? null : idx)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <span style={{ background: '#dbeafe', color: '#1e40af', padding: '0.3rem 1rem', borderRadius: 20, fontSize: '1.2rem', fontWeight: 700 }}>
                          Q{idx + 1}
                        </span>
                        <span style={{ background: '#f3e8ff', color: '#6d28d9', padding: '0.3rem 1rem', borderRadius: 20, fontSize: '1.2rem', fontWeight: 700 }}>
                          {TYPE_LABELS[q.type] || q.type}
                        </span>
                        <span style={{ background: '#fef9c3', color: '#854d0e', padding: '0.3rem 1rem', borderRadius: 20, fontSize: '1.2rem', fontWeight: 700 }}>
                          {q.difficulty || params.difficulty}
                        </span>
                        <span style={{ background: '#ede9fa', color: '#2d2460', padding: '0.3rem 1rem', borderRadius: 20, fontSize: '1.2rem', fontWeight: 700 }}>
                          {q.marks || 1} mark{q.marks !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeQuestion(idx); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '1.4rem', padding: '0.4rem' }}
                        title="Remove question"
                      >
                        ✕
                      </button>
                    </div>

                    {editingIdx === idx ? (
                      <textarea
                        style={{ width: '100%', border: 'none', outline: 'none', resize: 'vertical', fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.6, minHeight: 80 }}
                        value={q.question}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateQuestion(idx, 'question', e.target.value)}
                      />
                    ) : (
                      <p style={{ fontSize: '1.5rem', fontWeight: 600, color: '#0f172a', lineHeight: 1.6, margin: 0 }}>{q.question}</p>
                    )}

                    {q.options && q.options.length > 0 && (
                      <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {q.options.map((opt, oi) => (
                          <div key={oi} style={{
                            padding: '0.8rem 1.5rem',
                            borderRadius: 8,
                            fontSize: '1.4rem',
                            background: opt === q.answer ? '#ede9fa' : '#f8fafc',
                            color: opt === q.answer ? '#2d2460' : '#475569',
                            fontWeight: opt === q.answer ? 700 : 400,
                            border: `1px solid ${opt === q.answer ? '#ede9fa' : '#e2e8f0'}`,
                          }}>
                            {String.fromCharCode(65 + oi)}. {opt}
                            {opt === q.answer && ' ✓'}
                          </div>
                        ))}
                      </div>
                    )}

                    {q.answer && q.type !== 'mcq' && (
                      <div style={{ marginTop: '1.5rem', padding: '1.2rem', background: '#f3f0ff', borderRadius: 8, fontSize: '1.3rem', color: '#2d2460' }}>
                        <strong>Model Answer:</strong> {q.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '3rem', display: 'flex', gap: '1.5rem' }}>
                <button
                  className="btn-primary-green"
                  style={{ padding: '1.4rem 3.5rem', fontSize: '1.5rem' }}
                  onClick={() => toast.success('Questions saved to Question Bank')}
                >
                  💾 Save to Question Bank
                </button>
                <button
                  className="btn-secondary-outline"
                  style={{ padding: '1.4rem 3.5rem', fontSize: '1.5rem' }}
                  onClick={handleGenerate}
                  disabled={generating}
                >
                  🔄 Regenerate
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default GenerateQuestions;
