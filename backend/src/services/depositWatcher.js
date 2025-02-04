const DepositAddress = require('../models/DepositAddress');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

class DepositWatcher {
  constructor() {
    this.isWatching = false;
  }

  start() {
    if (this.isWatching) {
      console.log('Deposit watcher is already running');
      return;
    }

    this.isWatching = true;
    console.log('🔄 Deposit watcher started');
  }

  stop() {
    if (!this.isWatching) {
      console.log('Deposit watcher is not running');
      return;
    }

    this.isWatching = false;
    console.log('⏹️ Deposit watcher stopped');
  }
}

const depositWatcher = new DepositWatcher();
module.exports = { depositWatcher }; 