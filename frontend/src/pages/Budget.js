import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Check, Trash2 } from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CATEGORIES = ['Food','Transport','Shopping','Entertainment','Health','Rent','Utilities','Education','Travel','Other'];
const COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#84cc16','#f97316','#64748b'];
const formatCurrency = (amount, currency = 'INR') => {
  const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
  return `${symbols[currency] || '₹'}${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

function BudgetModal({ onClose, onSave }) {
  const [form, setForm] = useState({ category: 'Food', amount: '', color: COLORS[0], month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post('/budgets', form);
      onSave(data.budget);
      toast.success('Budget saved!');
      onClose();
    } catch (err) { toast.error('Failed to save budget'); }
    finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div className="modal" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="modal-title">Set Budget <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button></div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Category</label>
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Monthly Budget Amount</label>
            <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="5000" min="0" required />
          </div>
          <div className="form-group">
            <label>Color</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm({...form, color: c})}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: form.color === c ? '3px solid white' : '2px solid transparent', cursor: 'pointer', boxShadow: form.color === c ? '0 0 0 2px ' + c : 'none' }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <div className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><Check size={16} /> Save Budget</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function Budget() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    API.get('/budgets').then(({ data }) => setBudgets(data.budgets)).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    await API.delete(`/budgets/${id}`);
    setBudgets(prev => prev.filter(b => b._id !== id));
    toast.success('Budget deleted');
  };

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + (b.spent || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Budget</h1>
          <p className="page-subtitle">Track your spending limits by category</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Set Budget</button>
      </div>

      {/* Overview */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Budget', value: formatCurrency(totalBudget, user?.currency), color: '#6366f1' },
          { label: 'Total Spent', value: formatCurrency(totalSpent, user?.currency), color: '#ef4444' },
          { label: 'Remaining', value: formatCurrency(totalBudget - totalSpent, user?.currency), color: '#10b981' }
        ].map((item, i) => (
          <motion.div key={i} className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{item.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: item.color }}>{item.value}</div>
          </motion.div>
        ))}
      </div>

      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="loading-spinner" /></div> :
        budgets.length === 0 ? (
          <div className="glass-card">
            <div className="empty-state"><h3>No budgets set</h3><p>Set budgets for each spending category to track your limits.</p></div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {budgets.map((budget, i) => {
              const pct = budget.amount > 0 ? Math.min((budget.spent / budget.amount) * 100, 100) : 0;
              const over = budget.spent > budget.amount;
              return (
                <motion.div key={budget._id} className="glass-card" style={{ padding: 20 }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: budget.color || '#6366f1', flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{budget.category}</span>
                      {over && <span className="badge badge-expense">Over Budget!</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>{formatCurrency(budget.spent, user?.currency)} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 13 }}>/ {formatCurrency(budget.amount, user?.currency)}</span></div>
                        <div style={{ fontSize: 12, color: over ? 'var(--danger)' : 'var(--text-muted)' }}>{pct.toFixed(0)}% used</div>
                      </div>
                      <button className="icon-btn danger" onClick={() => handleDelete(budget._id)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: over ? 'var(--danger)' : budget.color || 'var(--accent)' }} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      }
      {showModal && <BudgetModal onClose={() => setShowModal(false)} onSave={(b) => setBudgets(prev => { const exists = prev.find(x => x._id === b._id); return exists ? prev.map(x => x._id === b._id ? b : x) : [...prev, b]; })} />}
    </div>
  );
}
