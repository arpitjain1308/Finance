import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import './Auth.css';

function Toggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <label className="theme-toggle-btn" title="Toggle theme">
      <input type="checkbox" checked={theme === 'light'} onChange={toggleTheme} />
      <div className="toggle-track" />
      <div className="toggle-thumb">{theme === 'dark' ? '🌙' : '☀️'}</div>
    </label>
  );
}

export default function Login() {
  const [form, setForm] = useState({ email:'', password:'' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back! 🎉');
      nav('/');
    } catch(err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-mesh">
        <div className="auth-grid" />
        <div className="auth-orb orb-1" />
        <div className="auth-orb orb-2" />
        <div className="auth-orb orb-3" />
      </div>

      <motion.div className="auth-card"
        initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.45, ease:[0.34,1.56,0.64,1] }}>

        <div className="auth-top-bar">
          <div className="auth-logo-group">
            <div className="auth-logo-icon"><TrendingUp size={18} strokeWidth={2.5} /></div>
            <div>
              <div className="auth-logo-name">FinanceAI</div>
              <div className="auth-logo-sub">Smart Money</div>
            </div>
          </div>
          <Toggle />
        </div>

        <h2 className="auth-h">Welcome back</h2>
        <p className="auth-p">Sign in to track your money intelligently</p>

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-wrap">
              <Mail size={14} className="input-icon-l" />
              <input className="form-input has-icon-l" type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({...form, email:e.target.value})} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrap">
              <Lock size={14} className="input-icon-l" />
              <input className="form-input has-icon-l has-icon-r" type={show ? 'text' : 'password'}
                placeholder="••••••••" value={form.password}
                onChange={e => setForm({...form, password:e.target.value})} required />
              <button type="button" className="input-icon-r" onClick={() => setShow(!show)}>
                {show ? <EyeOff size={14}/> : <Eye size={14}/>}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-full" style={{marginTop:8}} disabled={loading}>
            {loading ? <div className="spinner" style={{width:20,height:20,borderWidth:2}} /> : 'Sign In →'}
          </button>
        </form>

        <p className="auth-footer-line">
          No account yet? <Link to="/register">Create one free</Link>
        </p>
      </motion.div>
    </div>
  );
}