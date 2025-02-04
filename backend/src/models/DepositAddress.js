const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  txId: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  amountUSD: {
    type: Number,
    required: true
  },
  fromAddress: {
    type: String,
    required: true
  },
  toAddress: {
    type: String,
    required: true
  },
  confirmations: {
    type: Number,
    default: 0
  },
  processed: {
    type: Boolean,
    default: false
  },
  fee: {
    type: Number
  },
  blockNumber: {
    type: Number
  },
  blockHash: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending'
  }
});

const depositAddressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  chain: {
    type: String,
    required: true,
    enum: [
      // Bitcoin and forks
      'BTC', 'LTC', 'BCH', 'DOGE',
      // Ethereum and L2s
      'ETH', 'ETH_BASE', 'ETH_OP', 'ETH_ARB',
      // Other major chains
      'MATIC', 'POLYGON', 'SOL', 'TRON', 'BSC',
      'XRP', 'CELO', 'AVAX', 'FTM',
      // Additional chains
      'KLAY', 'ONE'
    ]
  },
  address: {
    type: String,
    required: true,
    unique: true
  },
  memo: {
    type: String
  },
  // Encrypted private key or mnemonic
  privateKey: {
    type: String,
    required: true,
    select: false // Don't include in normal queries
  },
  // Extended public key for BTC-like chains
  xpub: {
    type: String,
    select: false // Don't include in normal queries
  },
  balance: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  transactions: [transactionSchema],
  lastChecked: {
    type: Date,
    default: Date.now
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

// Create indexes for faster queries
depositAddressSchema.index({ userId: 1, chain: 1 });
depositAddressSchema.index({ address: 1 }, { unique: true });

// Update the updatedAt timestamp before saving
depositAddressSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const DepositAddress = mongoose.model('DepositAddress', depositAddressSchema);

module.exports = DepositAddress; 