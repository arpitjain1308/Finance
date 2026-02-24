const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true, trim: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: {
    type: String,
    enum: ['Food', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Rent',
           'Utilities', 'Education', 'Travel', 'Salary', 'Investment', 'Other'],
    default: 'Other'
  },
  date: { type: Date, required: true, default: Date.now },
  merchant: { type: String, default: '' },
  notes: { type: String, default: '' },
  isAnomalous: { type: Boolean, default: false },
  tags: [String]
}, { timestamps: true });

transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
