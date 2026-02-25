const Transaction = require('../models/Transaction');
const csv = require('csv-parser');
const fs = require('fs');
const { categorizeTransaction } = require('../utils/categorize');

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
    const data = { ...req.body, user: req.user._id };
    // Auto-categorize if category not provided or is 'Other'
    if (!data.category || data.category === 'Other') {
      data.category = categorizeTransaction(data.description, data.type);
    }
    const transaction = await Transaction.create(data);
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
  const filePath = req.file && req.file.path;
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const rawContent = fs.readFileSync(filePath, 'utf8')
      .replace(/^\uFEFF/, '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');

    const allLines = rawContent.split('\n');

    // Find the real header row
    const headerKeywords = ['date', 'description', 'amount', 'debit', 'credit', 'narration', 'txn', 'particulars', 'dr', 'cr', 'withdrawal', 'deposit'];
    let headerLineIndex = -1;
    for (let i = 0; i < allLines.length; i++) {
      const lineLower = allLines[i].toLowerCase();
      const matchCount = headerKeywords.filter(kw => lineLower.includes(kw)).length;
      if (matchCount >= 2) { headerLineIndex = i; break; }
    }

    if (headerLineIndex === -1) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({ success: false, message: 'Could not find transaction headers. Make sure CSV has date, description, and amount/debit/credit columns.' });
    }

    const transactionSection = allLines.slice(headerLineIndex).filter(l => l.trim()).join('\n');

    const results = [];
    await new Promise((resolve, reject) => {
      const { Readable } = require('stream');
      Readable.from([transactionSection])
        .pipe(csv({
          mapHeaders: ({ header }) => header.trim().toLowerCase()
            .replace(/\uFEFF/g, '')
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_')
        }))
        .on('data', (row) => results.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    if (results.length === 0) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({ success: false, message: 'No transaction rows found in CSV.' });
    }

    // Parse DD/MM/YYYY or standard dates
    const parseDate = (str) => {
      if (!str) return new Date();
      str = str.trim();
      const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (dmy) return new Date(`${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`);
      const d = new Date(str);
      return isNaN(d.getTime()) ? new Date() : d;
    };

    const parseAmount = (val) => {
      if (!val) return null;
      const c = val.toString().replace(/[^0-9.\-]/g, '').trim();
      if (!c) return null;
      const n = parseFloat(c);
      return isNaN(n) ? null : n;
    };

    const transactions = [];

    for (const row of results) {
      try {
        const keys = Object.keys(row);
        const getVal = (...names) => {
          for (const name of names) {
            const key = keys.find(k => k.includes(name));
            if (key !== undefined) {
              const v = row[key] && row[key].toString().trim();
              if (v && v !== '-') return v;
            }
          }
          return null;
        };

        const desc = getVal('description', 'narration', 'particulars', 'details', 'remarks', 'note', 'desc') || 'Unknown';
        const dateVal = getVal('txn_date', 'date', 'transaction_date', 'value_date', 'posting_date');
        const parsedDate = parseDate(dateVal);

        // Separate Dr/Cr columns (Indian bank statements)
        const drVal = parseAmount(getVal('dr_amount', 'debit', 'dr', 'withdrawal', 'withdrawl', 'debit_amount', 'chq_dr_amt'));
        const crVal = parseAmount(getVal('cr_amount', 'credit', 'cr', 'deposit', 'credit_amount', 'chq_cr_amt'));
        const singleAmt = parseAmount(getVal('amount', 'value', 'sum', 'transaction_amount'));

        let amount = 0;
        let type = 'expense';

        if (drVal && drVal > 0) {
          amount = drVal; type = 'expense';
        } else if (crVal && crVal > 0) {
          amount = crVal; type = 'income';
        } else if (singleAmt !== null && singleAmt !== 0) {
          amount = Math.abs(singleAmt);
          type = singleAmt < 0 ? 'expense' : 'income';
          const typeVal = getVal('type', 'txn_type', 'cr_dr', 'transaction_type');
          if (typeVal) {
            type = ['cr','credit','income','deposit'].some(w => typeVal.toLowerCase().includes(w)) ? 'income' : 'expense';
          }
        } else {
          continue;
        }

        if (amount === 0) continue;

        // 🧠 Smart categorization using UPI ID + merchant name
        const category = categorizeTransaction(desc, type);

        transactions.push({
          user: req.user._id,
          description: desc.substring(0, 200),
          amount,
          type,
          date: parsedDate,
          category
        });
      } catch (e) { continue; }
    }

    if (transactions.length === 0) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({ success: false, message: 'No valid transactions found.' });
    }

    // Count how many got smart-categorized vs Other
    const categorized = transactions.filter(t => t.category !== 'Other').length;

    const batchSize = 100;
    for (let i = 0; i < transactions.length; i += batchSize) {
      await Transaction.insertMany(transactions.slice(i, i + batchSize), { ordered: false });
    }

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({
      success: true,
      message: `${transactions.length} transactions imported! ${categorized} auto-categorized.`,
      count: transactions.length,
      categorized
    });

  } catch (error) {
    if (filePath && fs.existsSync(filePath)) { try { fs.unlinkSync(filePath); } catch {} }
    next(error);
  }
};

// Re-categorize all existing transactions for a user
exports.recategorizeAll = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id });
    let updated = 0;
    for (const tx of transactions) {
      const newCategory = categorizeTransaction(tx.description, tx.type);
      if (newCategory !== tx.category) {
        await Transaction.findByIdAndUpdate(tx._id, { category: newCategory });
        updated++;
      }
    }
    res.json({ success: true, message: `Re-categorized ${updated} transactions out of ${transactions.length}`, updated });
  } catch (error) { next(error); }
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

    res.json({ success: true, thisMonth: fmt(thisMonthStats), lastMonth: fmt(lastMonthStats), categoryBreakdown, monthlyTrend, recentTransactions, totalTransactions });
  } catch (error) { next(error); }
};