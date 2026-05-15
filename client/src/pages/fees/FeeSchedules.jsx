import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  getFeeSchedules,
  createFeeSchedule,
  updateFeeSchedule,
  deleteFeeSchedule,
} from '../../services/feeService';
import { getClasses } from '../../services/classService';
import './Fees.css';
import '../teachers/Teachers.css';

const emptyForm = {
  title: '',
  term: 'First Term',
  session: '2024/2025',
  classId: '',
  dueDate: '',
};

const FeeSchedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [items, setItems] = useState([{ name: 'Tuition', amount: '' }]);
  const [form, setForm] = useState(emptyForm);

  const load = () => {
    setLoading(true);
    Promise.all([getFeeSchedules(), getClasses()])
      .then(([feesRes, classesRes]) => {
        setSchedules(feesRes.data || []);
        setClasses(classesRes.data?.classes ?? classesRes.data ?? []);
      })
      .catch(() => toast.error('Failed to load fee schedules'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const totalAmount = items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setItems([{ name: 'Tuition', amount: '' }]);
  };

  const startEdit = (schedule) => {
    setEditingId(schedule._id);
    setForm({
      title: schedule.title,
      term: schedule.term,
      session: schedule.session,
      classId: schedule.class?._id ?? schedule.class ?? '',
      dueDate: schedule.dueDate
        ? new Date(schedule.dueDate).toISOString().slice(0, 10)
        : '',
    });
    setItems(
      (schedule.items?.length ? schedule.items : [{ name: 'Tuition', amount: 0 }]).map((i) => ({
        name: i.name,
        amount: String(i.amount ?? ''),
      }))
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemChange = (idx, field, value) => {
    setItems(prev => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const addItem = () => setItems(prev => [...prev, { name: '', amount: '' }]);

  const removeItem = (idx) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.classId || !form.dueDate) {
      toast.error('Title, class, and due date are required');
      return;
    }
    const feeItems = items.filter(i => i.name && Number(i.amount) > 0);
    if (feeItems.length === 0) {
      toast.error('Add at least one fee item with an amount');
      return;
    }
    const payload = {
      ...form,
      items: feeItems.map(i => ({ name: i.name, amount: Number(i.amount) })),
      totalAmount,
    };
    setSubmitting(true);
    try {
      if (editingId) {
        await updateFeeSchedule(editingId, payload);
        toast.success('Fee schedule updated');
      } else {
        await createFeeSchedule(payload);
        toast.success('Fee schedule created');
      }
      resetForm();
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to save schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (schedule) => {
    if (!window.confirm(`Delete "${schedule.title}"? This cannot be undone.`)) return;
    try {
      await deleteFeeSchedule(schedule._id);
      toast.success('Fee schedule deleted');
      if (editingId === schedule._id) resetForm();
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to delete schedule');
    }
  };

  const classLabel = (s) => {
    const c = s.class;
    if (!c) return 'Class';
    return `${c.name ?? ''}${c.arm ? ` ${c.arm}` : ''}`.trim();
  };

  return (
    <div className="fees-container">
      <div style={{ marginBottom: '4.5rem' }}>
        <h1 style={{ fontSize: '3.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.8rem' }}>Fee Schedules</h1>
        <p style={{ fontSize: '1.6rem', color: '#64748b' }}>Define and manage financial structures for academic terms.</p>
      </div>

      <div className="fee-schedules-grid">
        <div className="create-schedule-card">
          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '3rem' }}>
            {editingId ? 'Edit Schedule' : 'Create New Schedule'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group-premium" style={{ marginBottom: '2.5rem' }}>
              <label>Schedule Title *</label>
              <input type="text" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. 2024/25 First Term Fees" />
            </div>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
              <div className="form-group-premium">
                <label>Term</label>
                <select value={form.term} onChange={e => setForm(f => ({ ...f, term: e.target.value }))}>
                  <option>First Term</option>
                  <option>Second Term</option>
                  <option>Third Term</option>
                </select>
              </div>
              <div className="form-group-premium">
                <label>Session</label>
                <input type="text" value={form.session} onChange={e => setForm(f => ({ ...f, session: e.target.value }))} />
              </div>
            </div>
            <div className="form-group-premium" style={{ marginBottom: '2.5rem' }}>
              <label>Class *</label>
              <select required value={form.classId} onChange={e => setForm(f => ({ ...f, classId: e.target.value }))}>
                <option value="">Select class</option>
                {classes.map(c => (
                  <option key={c._id} value={c._id}>{c.name}{c.arm ? ` ${c.arm}` : ''}</option>
                ))}
              </select>
            </div>
            <div className="form-group-premium" style={{ marginBottom: '3rem' }}>
              <label>Due Date *</label>
              <input type="date" required value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Fee Items</h4>
              <button type="button" onClick={addItem} style={{ background: 'none', border: 'none', color: '#5849b8', fontWeight: 800, cursor: 'pointer' }}>+ Add Item</button>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="fee-item-row" style={{ display: 'grid', gridTemplateColumns: '1fr 120px 40px', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                <input type="text" placeholder="Item name" value={item.name} onChange={e => handleItemChange(idx, 'name', e.target.value)} />
                <input type="number" placeholder="Amount" value={item.amount} onChange={e => handleItemChange(idx, 'amount', e.target.value)} />
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(idx)} aria-label="Remove item" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.4rem' }}>×</button>
                )}
              </div>
            ))}
            <div className="total-estimate-box">
              <span>Total Estimate</span>
              <span>₦ {totalAmount.toLocaleString()}.00</span>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button type="submit" disabled={submitting} className="btn-primary-green" style={{ flex: 1, padding: '2rem', background: '#6A5ACD' }}>
                {submitting ? 'Saving…' : editingId ? 'Update Fee Schedule' : 'Save Fee Schedule'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="btn btn-outline-secondary" style={{ padding: '2rem 2.5rem' }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '3rem' }}>Active Schedules</h2>
          {loading ? (
            <p style={{ color: '#64748b' }}>Loading…</p>
          ) : schedules.length === 0 ? (
            <p style={{ color: '#64748b' }}>No fee schedules yet.</p>
          ) : schedules.map(s => (
            <div key={s._id} className="active-schedule-card" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '2rem', fontWeight: 800 }}>{s.title}</h3>
                  <p style={{ color: '#64748b' }}>{s.term} · {s.session} · {classLabel(s)}</p>
                  <p style={{ fontSize: '2rem', fontWeight: 800, marginTop: '1rem' }}>₦ {(s.totalAmount ?? 0).toLocaleString()}</p>
                  {s.dueDate && <p style={{ marginTop: '0.5rem' }}>Due: {new Date(s.dueDate).toLocaleDateString()}</p>}
                  {s.items?.length > 0 && (
                    <ul style={{ marginTop: '1rem', paddingLeft: '1.2rem', color: '#64748b', fontSize: '1.3rem' }}>
                      {s.items.map((item, i) => (
                        <li key={i}>{item.name}: ₦ {Number(item.amount).toLocaleString()}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => startEdit(s)}
                    style={{ background: 'none', border: '1px solid #6A5ACD', color: '#6A5ACD', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(s)}
                    style={{ background: 'none', border: '1px solid #ef4444', color: '#ef4444', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeeSchedules;
