const mongoose = require('mongoose');

const slotTransactionSchema = new mongoose.Schema({
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  username: {
    type: String,
    required: true,
    index: true
  },
  formattedUsername: {
    type: String,
    required: true,
    index: true
  },
  operator: {
    type: String,
    required: true
  },
  roundId: {
    type: String,
    required: true,
    index: true
  },
  gameId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['spin', 'bonus_fs', 'jackpot', 'bonus'],
    default: 'spin'
  },
  credit: {
    type: Number,
    default: null
  },
  debit: {
    type: Number,
    default: null
  },
  currency: {
    type: String,
    required: true
  },
  callId: {
    type: String,
    required: true,
    unique: true
  },
  sessionId: {
    type: String,
    required: true
  },
  gameplayFinal: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  metadata: {
    timestamp: String,
    balanceBefore: Number,
    balanceAfter: Number
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Compound indexes for better query performance
slotTransactionSchema.index({ playerId: 1, createdAt: -1 });
slotTransactionSchema.index({ username: 1, createdAt: -1 });
slotTransactionSchema.index({ formattedUsername: 1, createdAt: -1 });
slotTransactionSchema.index({ gameId: 1, roundId: 1 });
slotTransactionSchema.index({ callId: 1 }, { unique: true });

const SlotTransaction = mongoose.model('SlotTransaction', slotTransactionSchema);

module.exports = SlotTransaction; 