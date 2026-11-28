// models/Transaction.js
const mongoose = require('mongoose');
const transactionSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  merchant: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  status: { type: String, required: true, enum: ['paid', 'pending'] },
  date: { type: String, required: true },
}, { timestamps: true });
module.exports = mongoose.model('Transaction', transactionSchema);