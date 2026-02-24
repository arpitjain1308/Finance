import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Trash2, Check } from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '', currency: user?.currency || 'INR' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.put('/auth/me', profile);
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 680 }}>
      <h1 className="page-title">Settings</h1>
      <p className="page-subtitle">Manage your account preferences</p>

      {/* Profile */}
      <motion.div className="glass-card" style={{ padding: 28, marginBottom: 16 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <User size={20} color="var(--accent)" />
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Profile Settings</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: 16, background: 'var(--bg-hover)', borderRadius: 12 }}>
          <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800 }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user?.email}</div>
          </div>
        </div>
        <form onSubmit={handleProfileSave}>
          <div className="form-group"><label>Full Name</label><input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} /></div>
          <div className="form-group"><label>Email Address</label><input value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} type="email" /></div>
          <div className="form-group">
            <label>Currency</label>
            <select value={profile.currency} onChange={e => setProfile({...profile, currency: e.target.value})}>
              {[['INR','₹ Indian Rupee'],['USD','$ US Dollar'],['EUR','€ Euro'],['GBP','£ British Pound']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <div className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><Check size={16} /> Save Changes</>}
          </button>
        </form>
      </motion.div>

      {/* Security */}
      <motion.div className="glass-card" style={{ padding: 28, marginBottom: 16 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <Shield size={20} color="#10b981" />
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Security</h3>
        </div>
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (passwords.newPassword !== passwords.confirmPassword) return toast.error('Passwords do not match');
          try {
            await API.put('/auth/me', { password: passwords.newPassword });
            toast.success('Password updated!');
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
          } catch { toast.error('Failed to update password'); }
        }}>
          <div className="form-group"><label>New Password</label><input type="password" value={passwords.newPassword} onChange={e => setPasswords({...passwords, newPassword: e.target.value})} placeholder="Minimum 6 characters" /></div>
          <div className="form-group"><label>Confirm New Password</label><input type="password" value={passwords.confirmPassword} onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})} placeholder="Repeat new password" /></div>
          <button type="submit" className="btn-primary"><Check size={16} /> Update Password</button>
        </form>
      </motion.div>

      {/* Danger Zone */}
      <motion.div className="glass-card" style={{ padding: 28, border: '1px solid rgba(239,68,68,0.2)' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Trash2 size={20} color="var(--danger)" />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--danger)' }}>Danger Zone</h3>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>Once you sign out, you can log back in with your credentials. To permanently delete your account, contact support.</p>
        <button className="btn-danger" onClick={async () => { await logout(); window.location.href = '/login'; }}>Sign Out of All Devices</button>
      </motion.div>
    </div>
  );
}
