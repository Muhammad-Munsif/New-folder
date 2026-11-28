const asyncHandler = require('express-async-handler');
const Transaction = require('../models/Transaction');
const getTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ user: req.user._id }).sort({
    date: -1,
    createdAt: -1,
  });
  res.json(transactions);
});
const createTransaction = asyncHandler(async (req, res) => {
  const { merchant, amount, category, status, date } = req.body;
  const transaction = await Transaction.create({
    user: req.user._id,
    merchant,
    amount,
    category,
    status,
    date,
  });

  res.status(201).json(transaction);
});
const updateTransaction = asyncHandler(async (req, res) => {
  const { merchant, amount, category, status, date } = req.body;
  const transaction = await Transaction.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { merchant, amount, category, status, date },
    { new: true, runValidators: true },
  );
  if (!transaction) {
    res.status(404);
    throw new Error('Transaction not found');
  }
  res.json(transaction);
});
const deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!transaction) {
    res.status(404);
    throw new Error('Transaction not found');
  }
  res.json({ message: 'Transaction removed' });
});
module.exports = {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};