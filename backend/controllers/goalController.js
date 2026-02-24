const Goal = require('../models/Goal');

exports.getGoals = async (req, res, next) => {
  try {
    const goals = await Goal.find({ user: req.user._id }).sort('-createdAt');
    res.json({ success: true, goals });
  } catch (error) { next(error); }
};

exports.createGoal = async (req, res, next) => {
  try {
    const goal = await Goal.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, goal });
  } catch (error) { next(error); }
};

exports.updateGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id }, req.body, { new: true, runValidators: true }
    );
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    if (goal.savedAmount >= goal.targetAmount) { goal.isCompleted = true; await goal.save(); }
    res.json({ success: true, goal });
  } catch (error) { next(error); }
};

exports.deleteGoal = async (req, res, next) => {
  try {
    await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: 'Goal deleted' });
  } catch (error) { next(error); }
};
