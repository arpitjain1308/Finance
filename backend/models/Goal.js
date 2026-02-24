const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  savedAmount: { type: Number, default: 0 },
  deadline: { type: Date },
  category: { type: String, default: 'General' },
  isCompleted: { type: Boolean, default: false },
  icon: { type: String, default: '🎯' },
  color: { type: String, default: '#6366f1' }
}, { timestamps: true });

module.exports = mongoose.model('Goal', goalSchema);
