import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Check, Trash2, Target } from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const EMOJIS = ['🎯','🏠','🚗','✈️','📱','💻','👶','📚','💍','🏋️','🎸','🌍'];
const formatCurrency = (amount, currency = 'INR') => {
  const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
  return `${symbols[currency] || '₹'}${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

function GoalModal({ onClose, onSave }) {
  const [form, setForm] = useState({ title: '', targetAmount: '', savedAmount: 0, deadline: '', icon: '🎯', color: '#6366f1' });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post('/goals', form);
      onSave(data.goal);
      toast.success('Goal created!');
      onClose();
    } catch { toast.error('Failed to create goal'); }
    finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div className="modal" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="modal-title">Create Goal <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button></div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Choose Icon</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              {EMOJIS.map(e => (
                <button key={e} type="button" onClick={() => setForm({...form, icon: e})}
                  style={{ width: 38, height: 38, border: form.icon === e ? '2px solid var(--accent)' : '1px solid var(--border)', borderRadius: 10, background: form.icon === e ? 'var(--accent-light)' : 'var(--bg-primary)', fontSize: 20, cursor: 'pointer' }}>{e}</button>
              ))}
            </div>
          </div>
          <div className="form-group"><label>Goal Title</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g., Buy a Laptop" required /></div>
          <div className="grid-2">
            <div className="form-group"><label>Target Amount</label><input type="number" value={form.targetAmount} onChange={e => setForm({...form, targetAmount: e.target.value})} placeholder="50000" min="0" required /></div>
            <div className="form-group"><label>Already Saved</label><input type="number" value={form.savedAmount} onChange={e => setForm({...form, savedAmount: e.target.value})} placeholder="0" min="0" /></div>
          </div>
          <div className="form-group"><label>Target Date (optional)</label><input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} /></div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <div className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><Check size={16} /> Create Goal</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function AddFundsModal({ goal, onClose, onSave }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newSaved = Number(goal.savedAmount) + Number(amount);
      const { data } = await API.put(`/goals/${goal._id}`, { savedAmount: newSaved });
      onSave(data.goal);
      toast.success('Funds added! 🎉');
      onClose();
    } catch { toast.error('Failed to add funds'); }
    finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div className="modal" style={{ maxWidth: 360 }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="modal-title">Add Funds to {goal.title} <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button></div>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Amount to Add</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="1000" min="0" required autoFocus /></div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <div className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Add Funds'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [addFundsGoal, setAddFundsGoal] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    API.get('/goals').then(({ data }) => setGoals(data.goals)).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this goal?')) return;
    await API.delete(`/goals/${id}`);
    setGoals(prev => prev.filter(g => g._id !== id));
    toast.success('Goal deleted');
  };

  const active = goals.filter(g => !g.isCompleted);
  const completed = goals.filter(g => g.isCompleted);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Savings Goals</h1>
          <p className="page-subtitle">{active.length} active · {completed.length} completed</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> New Goal</button>
      </div>

      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="loading-spinner" /></div> :
        goals.length === 0 ? (
          <div className="glass-card"><div className="empty-state"><Target size={48} /><h3>No goals yet</h3><p>Create your first savings goal and start tracking your progress.</p></div></div>
        ) : (
          <>
            {active.length > 0 && (
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Goals</h3>
                <div className="grid-2" style={{ marginBottom: 24 }}>
                  {active.map((goal, i) => {
                    const pct = goal.targetAmount > 0 ? Math.min((goal.savedAmount / goal.targetAmount) * 100, 100) : 0;
                    const remaining = goal.targetAmount - goal.savedAmount;
                    const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                    return (
                      <motion.div key={goal._id} className="glass-card" style={{ padding: 22 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ fontSize: 32 }}>{goal.icon}</div>
                            <div>
                              <div style={{ fontSize: 16, fontWeight: 700 }}>{goal.title}</div>
                              {daysLeft !== null && <div style={{ fontSize: 12, color: daysLeft < 30 ? 'var(--warning)' : 'var(--text-muted)' }}>{daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed'}</div>}
                            </div>
                          </div>
                          <button className="icon-btn danger" onClick={() => handleDelete(goal._id)}><Trash2 size={14} /></button>
                        </div>
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 22, fontWeight: 800 }}>{formatCurrency(goal.savedAmount, user?.currency)}</span>
                            <span style={{ fontSize: 14, color: 'var(--text-muted)', alignSelf: 'center' }}>/ {formatCurrency(goal.targetAmount, user?.currency)}</span>
                          </div>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, #6366f1, #8b5cf6)` }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{pct.toFixed(0)}% complete</span>
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatCurrency(remaining, user?.currency)} to go</span>
                          </div>
                        </div>
                        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px' }} onClick={() => setAddFundsGoal(goal)}>
                          <Plus size={14} /> Add Funds
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
            {completed.length > 0 && (
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completed Goals 🎉</h3>
                <div className="grid-2">
                  {completed.map((goal, i) => (
                    <motion.div key={goal._id} className="glass-card" style={{ padding: 22, opacity: 0.7, border: '1px solid rgba(16,185,129,0.3)' }} initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ delay: i * 0.05 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                        <div style={{ fontSize: 28 }}>{goal.icon}</div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700 }}>{goal.title}</div>
                          <span className="badge badge-income">Completed ✓</span>
                        </div>
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(goal.targetAmount, user?.currency)}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )
      }

      {showModal && <GoalModal onClose={() => setShowModal(false)} onSave={(g) => setGoals(prev => [g, ...prev])} />}
      {addFundsGoal && <AddFundsModal goal={addFundsGoal} onClose={() => setAddFundsGoal(null)} onSave={(updated) => { setGoals(prev => prev.map(g => g._id === updated._id ? updated : g)); setAddFundsGoal(null); }} />}
    </div>
  );
}
