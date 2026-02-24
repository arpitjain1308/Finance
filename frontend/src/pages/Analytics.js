import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const formatCurrency = (amount, currency = 'INR') => {
  const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
  return `${symbols[currency] || '₹'}${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

export default function Analytics() {
  const [forecast, setForecast] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetch = async () => {
      try {
        const [forecastRes, anomalyRes, insightRes] = await Promise.all([
          API.get('/ml/forecast'),
          API.get('/ml/anomalies'),
          API.get('/ml/insights')
        ]);
        setForecast(forecastRes.data.forecast);
        setAnomalies(anomalyRes.data.anomalies || []);
        setInsights(insightRes.data);
      } catch { toast.error('Failed to load analytics'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="loading-spinner" style={{ width: 48, height: 48 }} /></div>;

  const categoryForecastData = forecast?.categoryForecasts ? Object.entries(forecast.categoryForecasts).map(([name, value]) => ({ name, value: Math.round(value) })).sort((a, b) => b.value - a.value).slice(0, 8) : [];

  return (
    <div>
      <h1 className="page-title">Analytics & AI</h1>
      <p className="page-subtitle">Machine learning powered insights about your finances</p>

      {/* Forecast Summary */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        {[
          { label: 'Next Month Forecast', value: formatCurrency(forecast?.nextMonthEstimate || 0, user?.currency), icon: TrendingUp, color: '#6366f1', sub: forecast?.trend ? `Trend: ${forecast.trend}` : '' },
          { label: 'Daily Average', value: formatCurrency(forecast?.dailyAverage || 0, user?.currency), icon: BarChart3, color: '#06b6d4', sub: 'Average daily spend' },
          { label: 'Savings Rate', value: `${insights?.savingsRate || 0}%`, icon: Sparkles, color: '#10b981', sub: 'Of income saved' }
        ].map((item, i) => (
          <motion.div key={i} className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${item.color}20`, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><item.icon size={20} /></div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>{item.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.label}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{item.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Category Forecast */}
        <motion.div className="glass-card" style={{ padding: 24 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Category Forecast</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Next month estimate</span>
          </div>
          {categoryForecastData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categoryForecastData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, color: '#f1f5f9' }} formatter={(v) => formatCurrency(v, user?.currency)} />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ padding: '40px 0' }}><p>Add more transactions for forecasting</p></div>}
        </motion.div>

        {/* Forecast message */}
        <motion.div className="glass-card" style={{ padding: 24 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>AI Forecast Analysis</h3>
          {forecast ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: 16, background: 'var(--accent-light)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginBottom: 6 }}>FORECAST</div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{forecast.message}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Spending Trend', value: forecast.trend === 'increasing' ? '📈 Increasing' : forecast.trend === 'decreasing' ? '📉 Decreasing' : '➡️ Stable' },
                  { label: 'Trend Change', value: `${forecast.trendPercentage > 0 ? '+' : ''}${forecast.trendPercentage || 0}%` },
                  { label: 'Weekly Average', value: formatCurrency(forecast.weeklyAverage, user?.currency) }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <div className="empty-state"><p>Not enough data for forecasting</p></div>}
        </motion.div>
      </div>

      {/* Anomalies */}
      <motion.div className="glass-card" style={{ padding: 24 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <AlertTriangle size={20} color="#f59e0b" />
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Anomaly Detection</h3>
          {anomalies.length > 0 && <span className="badge badge-warning">{anomalies.length} unusual transactions</span>}
        </div>
        {anomalies.length === 0 ? (
          <div className="empty-state" style={{ padding: '30px 0' }}>
            <p style={{ fontSize: 14 }}>✅ No unusual transactions detected — your spending looks normal!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {anomalies.map((tx, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: 14, background: 'var(--warning-light)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{tx.description}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{tx.category} · {new Date(tx.date).toLocaleDateString()}</div>
                  {tx.reasons?.map((r, j) => <div key={j} style={{ fontSize: 12, color: 'var(--warning)' }}>⚠️ {r}</div>)}
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--warning)', flexShrink: 0, marginLeft: 16 }}>{formatCurrency(tx.amount, user?.currency)}</div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
