import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created! Welcome 🎉');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-blob blob-1" />
        <div className="auth-blob blob-2" />
      </div>
      <motion.div className="auth-card" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="auth-logo">
          <div className="logo-icon"><TrendingUp size={24} /></div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 800 }}>FinanceAI</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Smart Money Dashboard</div>
          </div>
        </div>
        <h2 className="auth-title">Create account</h2>
        <p className="auth-sub">Start managing your finances with AI</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <div className="input-icon-wrap">
              <User size={16} className="input-icon" />
              <input type="text" placeholder="John Doe" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required style={{ paddingLeft: '40px' }} />
            </div>
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <div className="input-icon-wrap">
              <Mail size={16} className="input-icon" />
              <input type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required style={{ paddingLeft: '40px' }} />
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="input-icon-wrap">
              <Lock size={16} className="input-icon" />
              <input type={showPassword ? 'text' : 'password'} placeholder="Min. 6 characters" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required style={{ paddingLeft: '40px', paddingRight: '40px' }} />
              <button type="button" className="input-icon-right" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <div className="input-icon-wrap">
              <Lock size={16} className="input-icon" />
              <input type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} required style={{ paddingLeft: '40px' }} />
            </div>
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: '8px' }} disabled={loading}>
            {loading ? <div className="loading-spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Create Account'}
          </button>
        </form>
        <p className="auth-footer">Already have an account? <Link to="/login" className="auth-link">Sign in</Link></p>
      </motion.div>
    </div>
  );
}
