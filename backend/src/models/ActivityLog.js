const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  username: {
    type: String,
    required: true
  },
  activityType: {
    type: String,
    required: true,
    enum: [
      'BALANCE_UPDATE',
      'AGENT_CREATED',
      'AGENT_STATUS_CHANGED',
      'API_KEY_CREATED',
      'API_KEY_DELETED',
      'API_KEY_STATUS_CHANGED',
      'SUBAGENT_CREATED',
      'LOGIN',
      'LOGOUT',
      'DEPOSIT_ADDRESS_CREATED',
      'CALLBACK_URL_UPDATED',
      'PLAYER_CREATED',
      'GAME_LAUNCHED',
      'BALANCE_CHECK'
    ]
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ activityType: 1, createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog; 