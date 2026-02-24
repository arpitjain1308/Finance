const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

exports.getBudgets = async (req, res, next) => {
  try {
    const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;
    const budgets = await Budget.find({ user: req.user._id, month: Number(month), year: Number(year) });
    // Calculate spent for each budget
    const budgetsWithSpent = await Promise.all(budgets.map(async (budget) => {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      const spent = await Transaction.aggregate([
        { $match: { user: req.user._id, category: budget.category, type: 'expense', date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      return { ...budget.toObject(), spent: spent[0]?.total || 0 };
    }));
    res.json({ success: true, budgets: budgetsWithSpent });
  } catch (error) { next(error); }
};

exports.createBudget = async (req, res, next) => {
  try {
    const { category, amount, month, year, color } = req.body;
    const existing = await Budget.findOne({ user: req.user._id, category, month, year });
    if (existing) {
      existing.amount = amount;
      if (color) existing.color = color;
      await existing.save();
      return res.json({ success: true, budget: existing });
    }
    const budget = await Budget.create({ user: req.user._id, category, amount, month, year, color });
    res.status(201).json({ success: true, budget });
  } catch (error) { next(error); }
};

exports.deleteBudget = async (req, res, next) => {
  try {
    await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: 'Budget deleted' });
  } catch (error) { next(error); }
};
