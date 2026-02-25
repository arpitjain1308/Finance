import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, Wallet, Target, BarChart3,
  Settings, LogOut, Menu, X, Sparkles, TrendingUp, Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';
import './Layout.css';

const NAV = [
  { to: '/',            icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions',icon: ArrowLeftRight,  label: 'Transactions' },
  { to: '/budget',      icon: Wallet,          label: 'Budget' },
  { to: '/goals',       icon: Target,          label: 'Goals' },
  { to: '/analytics',   icon: BarChart3,       label: 'Analytics' },
  { to: '/about',       icon: Info,            label: 'About' },
  { to: '/settings',    icon: Settings,        label: 'Settings' },
];

function ToggleSwitch() {
  const { theme, toggleTheme } = useTheme();
  return (
    <label className="theme-toggle-btn" title="Toggle theme">
      <input type="checkbox" checked={theme === 'light'} onChange={toggleTheme} />
      <div className="toggle-track" />
      <div className="toggle-thumb">{theme === 'dark' ? '🌙' : '☀️'}</div>
    </label>
  );
}

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('See you soon! 👋');
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || 'U';

  return (
    <div className="l-wrap">
      {open && <div className="l-overlay" onClick={() => setOpen(false)} />}

      <aside className={`l-side ${open ? 'is-open' : ''}`}>
        <div className="l-logo">
          <div className="l-logo-mark">
            <TrendingUp size={18} strokeWidth={2.5} />
          </div>
          <div>
            <div className="l-logo-name">FinanceAI</div>
            <div className="l-logo-tagline">Smart Money</div>
          </div>
          <button className="l-close-btn" onClick={() => setOpen(false)}><X size={18} /></button>
        </div>

        <nav className="l-nav">
          <div className="l-nav-section">MENU</div>
          {NAV.slice(0,5).map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}
              className={({ isActive }) => `l-nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={16} strokeWidth={2} />
              <span>{label}</span>
            </NavLink>
          ))}
          <div className="l-nav-section" style={{marginTop:16}}>MORE</div>
          {NAV.slice(5).map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}
              className={({ isActive }) => `l-nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={16} strokeWidth={2} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="l-foot">
          <div className="l-ai-pill">
            <Sparkles size={11} />
            <span>AI Powered Engine</span>
          </div>
          <div className="l-user-row">
            <div className="l-avatar">{initials}</div>
            <div className="l-user-text">
              <div className="l-user-name">{user?.name}</div>
              <div className="l-user-email">{user?.email}</div>
            </div>
            <button className="ibtn del" onClick={handleLogout} title="Sign out"><LogOut size={14} /></button>
          </div>
        </div>
      </aside>

      <div className="l-body">
        <header className="l-topbar">
          <button className="l-hamburger" onClick={() => setOpen(true)}><Menu size={20} /></button>
          <div className="l-topbar-right">
            <ToggleSwitch />
            <div className="l-user-chip">
              <div className="l-avatar-sm">{initials}</div>
              <span>{user?.name?.split(' ')[0]}</span>
            </div>
          </div>
        </header>
        <main className="l-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}