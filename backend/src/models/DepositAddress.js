const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed']
  },
  hash: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const depositAddressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  currency: {
    type: String,
    required: true
  },
  network: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true,
    unique: true
  },
  walletId: {
    type: String,
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  minDeposit: {
    type: Number,
    default: 0
  },
  transactions: [transactionSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
depositAddressSchema.index({ userId: 1, currency: 1, network: 1 });
depositAddressSchema.index({ address: 1 }, { unique: true });

module.exports = mongoose.model('DepositAddress', depositAddressSchema); 