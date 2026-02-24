const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  spent: { type: Number, default: 0 },
  color: { type: String, default: '#6366f1' }
}, { timestamps: true });

budgetSchema.index({ user: 1, month: 1, year: 1 });

module.exports = mongoose.model('Budget', budgetSchema);
