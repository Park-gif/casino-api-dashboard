const mongoose = require('mongoose');

const merchantDepositSchema = new mongoose.Schema({
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  chain: {
    type: String,
    required: true,
    enum: ['BTC', 'ETH', 'TRON', 'BSC']
  },
  amount: {
    type: Number,
    required: true
  },
  txId: {
    type: String,
    required: true,
    unique: true
  },
  fromAddress: {
    type: String,
    required: true
  },
  toAddress: {
    type: String,
    required: true
  },
  memo: {
    type: String
  },
  confirmations: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending'
  },
  processedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for faster queries
merchantDepositSchema.index({ merchantId: 1, status: 1 });
merchantDepositSchema.index({ txId: 1 }, { unique: true });
merchantDepositSchema.index({ fromAddress: 1 });
merchantDepositSchema.index({ toAddress: 1 });

// Update the updatedAt timestamp before saving
merchantDepositSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const MerchantDeposit = mongoose.model('MerchantDeposit', merchantDepositSchema);

module.exports = MerchantDeposit; 