import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Upload, Search, Filter, Trash2, Edit2, X, Check } from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CATEGORIES = ['Food','Transport','Shopping','Entertainment','Health','Rent','Utilities','Education','Travel','Salary','Investment','Other'];
const formatCurrency = (amount, currency = 'INR') => {
  const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
  return `${symbols[currency] || '₹'}${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

function TransactionModal({ onClose, onSave, editing }) {
  const [form, setForm] = useState(editing || { description: '', amount: '', type: 'expense', category: 'Other', date: new Date().toISOString().split('T')[0], notes: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        const { data } = await API.put(`/transactions/${editing._id}`, form);
        onSave(data.transaction, 'edit');
        toast.success('Transaction updated');
      } else {
        const { data } = await API.post('/transactions', form);
        onSave(data.transaction, 'add');
        toast.success('Transaction added');
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save transaction');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div className="modal" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="modal-title">
          {editing ? 'Edit Transaction' : 'Add Transaction'}
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Description</label>
            <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="e.g., Lunch at restaurant" required />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Amount</label>
              <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="0" min="0" step="0.01" required />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Category</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={form.date?.split('T')[0]} onChange={e => setForm({...form, date: e.target.value})} required />
            </div>
          </div>
          <div className="form-group">
            <label>Notes (optional)</label>
            <input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Additional details..." />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <div className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><Check size={16} /> {editing ? 'Update' : 'Add'}</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({ search: '', type: '', category: '', page: 1 });
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: filters.page, limit: 20, ...(filters.search && { search: filters.search }), ...(filters.type && { type: filters.type }), ...(filters.category && { category: filters.category }) });
      const { data } = await API.get(`/transactions?${params}`);
      setTransactions(data.transactions);
      setPagination({ total: data.total, pages: data.pages });
    } catch { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const handleSave = (transaction, type) => {
    if (type === 'add') setTransactions(prev => [transaction, ...prev]);
    else setTransactions(prev => prev.map(t => t._id === transaction._id ? transaction : t));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await API.delete(`/transactions/${id}`);
      setTransactions(prev => prev.filter(t => t._id !== id));
      toast.success('Transaction deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await API.post('/transactions/upload-csv', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`${data.count} transactions imported!`);
      fetchTransactions();
    } catch { toast.error('Failed to import CSV'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">{pagination.total} total transactions</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <label className="btn-secondary" style={{ cursor: 'pointer' }}>
            {uploading ? <div className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <><Upload size={16} /> Import CSV</>}
            <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCSVUpload} />
          </label>
          <button className="btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
            <Plus size={16} /> Add Transaction
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input placeholder="Search transactions..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value, page: 1})} style={{ paddingLeft: 36 }} />
        </div>
        <select value={filters.type} onChange={e => setFilters({...filters, type: e.target.value, page: 1})} style={{ width: 'auto', minWidth: 130 }}>
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select value={filters.category} onChange={e => setFilters({...filters, category: e.target.value, page: 1})} style={{ width: 'auto', minWidth: 150 }}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {(filters.search || filters.type || filters.category) && (
          <button className="btn-secondary" onClick={() => setFilters({ search: '', type: '', category: '', page: 1 })}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Transactions Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="loading-spinner" /></div>
        ) : transactions.length === 0 ? (
          <div className="empty-state"><h3>No transactions found</h3><p>Add your first transaction or import a CSV file.</p></div>
        ) : (
          <div className="tx-table">
            <div className="tx-header">
              <span>Description</span>
              <span>Category</span>
              <span>Date</span>
              <span>Amount</span>
              <span>Actions</span>
            </div>
            <AnimatePresence>
              {transactions.map((tx, i) => (
                <motion.div key={tx._id} className="tx-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.02 }}>
                  <div className="tx-desc">
                    <div className="tx-icon" style={{ background: tx.type === 'income' ? 'var(--success-light)' : 'var(--danger-light)', color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                      {tx.category?.[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{tx.description}</div>
                      {tx.notes && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tx.notes}</div>}
                    </div>
                  </div>
                  <span><span className="badge" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>{tx.category}</span></span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span className={`tx-amount ${tx.type}`}>{tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, user?.currency)}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="icon-btn" onClick={() => { setEditing(tx); setShowModal(true); }} title="Edit"><Edit2 size={14} /></button>
                    <button className="icon-btn danger" onClick={() => handleDelete(tx._id)} title="Delete"><Trash2 size={14} /></button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
            <button className="btn-secondary" onClick={() => setFilters(f => ({...f, page: f.page - 1}))} disabled={filters.page === 1} style={{ padding: '8px 16px' }}>Prev</button>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Page {filters.page} of {pagination.pages}</span>
            <button className="btn-secondary" onClick={() => setFilters(f => ({...f, page: f.page + 1}))} disabled={filters.page === pagination.pages} style={{ padding: '8px 16px' }}>Next</button>
          </div>
        )}
      </div>

      {showModal && <TransactionModal onClose={() => setShowModal(false)} onSave={handleSave} editing={editing} />}
    </div>
  );
}
