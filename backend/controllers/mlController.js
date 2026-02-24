const axios = require('axios');
const Transaction = require('../models/Transaction');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

exports.categorizeTransactions = async (req, res, next) => {
  try {
    const { descriptions } = req.body;
    const response = await axios.post(`${ML_URL}/categorize`, { descriptions });
    res.json({ success: true, categories: response.data.categories });
  } catch (error) {
    // Fallback: rule-based categorization
    const categories = req.body.descriptions.map(desc => ruleBasedCategory(desc));
    res.json({ success: true, categories, note: 'ML service unavailable, using rule-based fallback' });
  }
};

exports.getForecast = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id, type: 'expense' }).sort('date').limit(200);
    const data = transactions.map(t => ({ date: t.date.toISOString().split('T')[0], amount: t.amount, category: t.category }));
    try {
      const response = await axios.post(`${ML_URL}/forecast`, { transactions: data });
      res.json({ success: true, forecast: response.data });
    } catch {
      const forecast = simpleForecast(data);
      res.json({ success: true, forecast, note: 'ML service unavailable, using simple forecast' });
    }
  } catch (error) { next(error); }
};

exports.getAnomalies = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id, type: 'expense' }).sort('-date').limit(100);
    const data = transactions.map(t => ({ id: t._id, description: t.description, amount: t.amount, category: t.category, date: t.date }));
    try {
      const response = await axios.post(`${ML_URL}/anomalies`, { transactions: data });
      res.json({ success: true, anomalies: response.data.anomalies });
    } catch {
      const anomalies = simpleAnomalyDetection(data);
      res.json({ success: true, anomalies, note: 'ML service unavailable, using rule-based detection' });
    }
  } catch (error) { next(error); }
};

exports.getInsights = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const transactions = await Transaction.find({ user: req.user._id, date: { $gte: startOfMonth } });
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const topCategory = transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount; return acc;
    }, {});
    const top = Object.entries(topCategory).sort((a, b) => b[1] - a[1])[0];
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(1) : 0;
    const insights = [
      { type: 'info', icon: '💰', title: 'Savings Rate', message: `You saved ${savingsRate}% of your income this month.` },
      top ? { type: 'warning', icon: '📊', title: 'Top Spending', message: `Your highest expense category is ${top[0]} at ₹${top[1].toFixed(0)}.` } : null,
      totalExpense > totalIncome ? { type: 'danger', icon: '⚠️', title: 'Overspending Alert', message: 'Your expenses exceeded your income this month!' } : { type: 'success', icon: '✅', title: 'On Track', message: 'You are spending within your income this month.' }
    ].filter(Boolean);
    res.json({ success: true, insights, savingsRate, totalExpense, totalIncome });
  } catch (error) { next(error); }
};

// Rule-based fallbacks
function ruleBasedCategory(description) {
  const desc = description.toLowerCase();
  if (/food|restaurant|cafe|zomato|swiggy|eat|pizza|burger|lunch|dinner/.test(desc)) return 'Food';
  if (/uber|ola|taxi|bus|metro|fuel|petrol|transport/.test(desc)) return 'Transport';
  if (/amazon|flipkart|shopping|mall|store|mart/.test(desc)) return 'Shopping';
  if (/netflix|movie|game|spotify|entertainment/.test(desc)) return 'Entertainment';
  if (/hospital|doctor|medicine|pharmacy|health|medical/.test(desc)) return 'Health';
  if (/rent|landlord|pg|hostel/.test(desc)) return 'Rent';
  if (/electricity|water|internet|phone|bill|utility/.test(desc)) return 'Utilities';
  if (/school|college|course|tuition|education/.test(desc)) return 'Education';
  if (/hotel|flight|travel|trip|holiday/.test(desc)) return 'Travel';
  if (/salary|stipend|income|credit/.test(desc)) return 'Salary';
  return 'Other';
}

function simpleForecast(data) {
  if (data.length === 0) return { nextMonth: 0, trend: 'stable' };
  const recent = data.slice(-30).reduce((s, t) => s + t.amount, 0);
  const avg = recent / 30;
  return { nextMonthEstimate: Math.round(avg * 30), dailyAverage: Math.round(avg), trend: 'stable', message: `Based on your recent spending, you may spend approximately ₹${Math.round(avg * 30)} next month.` };
}

function simpleAnomalyDetection(transactions) {
  if (transactions.length < 5) return [];
  const amounts = transactions.map(t => t.amount);
  const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
  const std = Math.sqrt(amounts.reduce((s, a) => s + Math.pow(a - avg, 2), 0) / amounts.length);
  return transactions.filter(t => t.amount > avg + 2 * std).map(t => ({ ...t, reason: `Amount (₹${t.amount}) is significantly higher than your average (₹${avg.toFixed(0)})` }));
}
