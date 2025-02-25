const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  txId: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  currency: {
    type: String,
    required: true
  },
  network: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  convertedAmount: {
    type: Number
  },
  convertedCurrency: {
    type: String
  },
  rate: {
    type: Number,
    description: "Exchange rate at the time of conversion"
  },
  address: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update timestamps on save
transactionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema); 