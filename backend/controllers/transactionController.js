const Transaction = require('../models/Transaction');
const csv = require('csv-parser');
const fs = require('fs');

exports.getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category, type, startDate, endDate, sort = '-date', search } = req.query;
    const filter = { user: req.user._id };
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (search) filter.description = { $regex: search, $options: 'i' };
    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter).sort(sort).limit(limit * 1).skip((page - 1) * limit);
    res.json({ success: true, count: transactions.length, total, pages: Math.ceil(total / limit), currentPage: Number(page), transactions });
  } catch (error) { next(error); }
};

exports.addTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, transaction });
  } catch (error) { next(error); }
};

exports.updateTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id }, req.body, { new: true, runValidators: true }
    );
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, transaction });
  } catch (error) { next(error); }
};

exports.deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (error) { next(error); }
};

exports.uploadCSV = async (req, res, next) => {
  const filePath = req.file?.path;
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const results = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv({ mapHeaders: ({ header }) => header.trim().toLowerCase().replace(/\s+/g, '_') }))
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    if (results.length === 0) {
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({ success: false, message: 'CSV file is empty or could not be parsed' });
    }

    const transactions = [];

    for (const row of results) {
      try {
        const keys = Object.keys(row);

        const getVal = (...names) => {
          for (const name of names) {
            const key = keys.find(k => k.includes(name));
            if (key && row[key]?.toString().trim()) return row[key].toString().trim();
          }
          return null;
        };

        const rawAmount = getVal('amount', 'debit', 'credit', 'value', 'sum');
        const desc = getVal('description', 'desc', 'narration', 'details', 'particular', 'remarks') || 'Unknown';
        const dateVal = getVal('date', 'time', 'created');
        const typeVal = getVal('type');

        if (!rawAmount) continue;

        const cleanAmount = rawAmount.replace(/[₹$€£,\s]/g, '');
        const amount = parseFloat(cleanAmount);
        if (isNaN(amount) || amount === 0) continue;

        let type;
        if (typeVal) {
          type = ['income', 'credit'].some(w => typeVal.toLowerCase().includes(w)) ? 'income' : 'expense';
        } else {
          type = amount < 0 ? 'expense' : 'income';
        }

        let parsedDate = new Date();
        if (dateVal) {
          const d = new Date(dateVal);
          if (!isNaN(d.getTime())) parsedDate = d;
        }

        transactions.push({
          user: req.user._id,
          description: desc.substring(0, 200),
          amount: Math.abs(amount),
          type,
          date: parsedDate,
          category: 'Other'
        });
      } catch (rowErr) {
        continue;
      }
    }

    if (transactions.length === 0) {
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({ success: false, message: 'No valid transactions found. Make sure CSV has: date, description, amount columns.' });
    }

    const batchSize = 100;
    for (let i = 0; i < transactions.length; i += batchSize) {
      await Transaction.insertMany(transactions.slice(i, i + batchSize), { ordered: false });
    }

    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ success: true, message: `${transactions.length} transactions imported successfully!`, count: transactions.length });

  } catch (error) {
    if (filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch {}
    }
    next(error);
  }
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [thisMonthStats, lastMonthStats, categoryBreakdown, monthlyTrend, recentTransactions, totalTransactions] = await Promise.all([
      Transaction.aggregate([{ $match: { user: userId, date: { $gte: startOfMonth } } }, { $group: { _id: '$type', total: { $sum: '$amount' } } }]),
      Transaction.aggregate([{ $match: { user: userId, date: { $gte: startOfLastMonth, $lte: endOfLastMonth } } }, { $group: { _id: '$type', total: { $sum: '$amount' } } }]),
      Transaction.aggregate([{ $match: { user: userId, date: { $gte: startOfMonth }, type: 'expense' } }, { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } }, { $sort: { total: -1 } }]),
      Transaction.aggregate([
        { $match: { user: userId, date: { $gte: sixMonthsAgo } } },
        { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' }, type: '$type' }, total: { $sum: '$amount' } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      Transaction.find({ user: userId }).sort('-date').limit(5),
      Transaction.countDocuments({ user: userId })
    ]);

    const fmt = (stats) => {
      const income = stats.find(s => s._id === 'income')?.total || 0;
      const expense = stats.find(s => s._id === 'expense')?.total || 0;
      return { income, expense, savings: income - expense };
    };

    res.json({
      success: true,
      thisMonth: fmt(thisMonthStats),
      lastMonth: fmt(lastMonthStats),
      categoryBreakdown,
      monthlyTrend,
      recentTransactions,
      totalTransactions
    });
  } catch (error) { next(error); }
};
