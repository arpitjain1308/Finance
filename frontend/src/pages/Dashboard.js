import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, Sparkles, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Dashboard.css';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#84cc16'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const formatCurrency = (amount, currency = 'INR') => {
  const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
  return `${symbols[currency] || '₹'}${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

const StatCard = ({ title, value, icon: Icon, color, trend, trendLabel, delay = 0 }) => (
  <motion.div className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
    <div className="stat-header">
      <div className="stat-icon" style={{ background: `${color}20`, color }}><Icon size={20} /></div>
      {trend !== undefined && (
        <div className={`stat-trend ${trend >= 0 ? 'positive' : 'negative'}`}>
          {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{title}</div>
    {trendLabel && <div className="stat-sublabel">{trendLabel}</div>}
  </motion.div>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, insightsRes] = await Promise.all([
          API.get('/transactions/stats'),
          API.get('/ml/insights')
        ]);
        setStats(statsRes.data);
        setInsights(insightsRes.data.insights || []);
      } catch (err) {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <div className="loading-spinner" style={{ width: 48, height: 48 }} />
    </div>
  );

  const { thisMonth, lastMonth, categoryBreakdown, monthlyTrend, recentTransactions } = stats || {};
  const incomeChange = lastMonth?.income > 0 ? ((thisMonth?.income - lastMonth?.income) / lastMonth?.income * 100) : 0;
  const expenseChange = lastMonth?.expense > 0 ? ((thisMonth?.expense - lastMonth?.expense) / lastMonth?.expense * 100) : 0;

  // Process monthly trend data for chart
  const trendMap = {};
  (monthlyTrend || []).forEach(item => {
    const key = `${item._id.year}-${String(item._id.month).padStart(2,'0')}`;
    if (!trendMap[key]) trendMap[key] = { month: MONTH_NAMES[item._id.month - 1], income: 0, expense: 0 };
    trendMap[key][item._id.type] = item.total;
  });
  const trendData = Object.values(trendMap);

  const pieData = (categoryBreakdown || []).slice(0, 6).map((c, i) => ({
    name: c._id, value: Math.round(c.total), color: COLORS[i]
  }));

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="page-subtitle">Here's your financial overview for {MONTH_NAMES[new Date().getMonth()]} {new Date().getFullYear()}</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard title="Total Income" value={formatCurrency(thisMonth?.income, user?.currency)} icon={TrendingUp} color="#10b981" trend={incomeChange} trendLabel="vs last month" delay={0} />
        <StatCard title="Total Expenses" value={formatCurrency(thisMonth?.expense, user?.currency)} icon={TrendingDown} color="#ef4444" trend={-expenseChange} trendLabel="vs last month" delay={0.1} />
        <StatCard title="Net Savings" value={formatCurrency(thisMonth?.savings, user?.currency)} icon={PiggyBank} color="#6366f1" trendLabel="this month" delay={0.2} />
        <StatCard title="Transactions" value={stats?.totalTransactions || 0} icon={DollarSign} color="#f59e0b" trendLabel="total recorded" delay={0.3} />
      </div>

      {/* Charts Row */}
      <div className="dashboard-charts">
        {/* Monthly Trend */}
        <motion.div className="glass-card chart-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="chart-header">
            <h3>Income vs Expenses</h3>
            <span className="chart-subtitle">Last 6 months</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, color: '#f1f5f9' }} />
              <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fill="url(#incomeGrad)" name="Income" />
              <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fill="url(#expenseGrad)" name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category Pie */}
        <motion.div className="glass-card chart-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="chart-header">
            <h3>Spending Breakdown</h3>
            <span className="chart-subtitle">This month</span>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, color: '#f1f5f9' }} formatter={(v) => formatCurrency(v, user?.currency)} />
                <Legend iconType="circle" iconSize={8} formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <p>No expense data for this month</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom Row: AI Insights + Recent Transactions */}
      <div className="dashboard-bottom">
        {/* AI Insights */}
        <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <div className="chart-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} color="#6366f1" /> AI Insights
            </h3>
          </div>
          <div className="insights-list">
            {insights.length > 0 ? insights.map((insight, i) => (
              <div key={i} className={`insight-item insight-${insight.type}`}>
                <span className="insight-icon">{insight.icon}</span>
                <div>
                  <div className="insight-title">{insight.title}</div>
                  <div className="insight-msg">{insight.message}</div>
                </div>
              </div>
            )) : (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <p style={{ fontSize: 14 }}>Add transactions to get AI insights</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <div className="chart-header">
            <h3>Recent Transactions</h3>
            <a href="/transactions" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowUpRight size={14} />
            </a>
          </div>
          <div className="recent-list">
            {(recentTransactions || []).length > 0 ? (recentTransactions || []).map(tx => (
              <div key={tx._id} className="recent-item">
                <div className="recent-cat-icon" style={{ background: tx.type === 'income' ? 'var(--success-light)' : 'var(--danger-light)', color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                  {tx.category?.[0] || '?'}
                </div>
                <div className="recent-info">
                  <div className="recent-desc">{tx.description}</div>
                  <div className="recent-cat">{tx.category} · {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                </div>
                <div className={`recent-amount ${tx.type}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, user?.currency)}
                </div>
              </div>
            )) : (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <p style={{ fontSize: 14 }}>No transactions yet</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
