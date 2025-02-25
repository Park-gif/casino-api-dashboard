const DepositAddress = require('../models/DepositAddress');
const User = require('../models/User');
const oxapay = require('./oxapay');
const ActivityLog = require('../models/ActivityLog');

class DepositWatcher {
  constructor() {
    this.isRunning = false;
    this.checkInterval = 6000000; // Check every minute
  }

  async start() {
    if (this.isRunning) return;
    
    console.log('🔄 Deposit watcher started');
    this.isRunning = true;
    this.watch();
  }

  async stop() {
    this.isRunning = false;
    console.log('🛑 Deposit watcher stopped');
  }

  async watch() {
    while (this.isRunning) {
      try {
        // Get all active deposit addresses
        const addresses = await DepositAddress.find({ isActive: true });
        
        for (const address of addresses) {
          try {
            // Get payment history for this wallet
            const history = await oxapay.getPaymentHistory({
              wallet_id: address.walletId,
              status: 'completed'
            });

            // Process new transactions
            if (history && history.data) {
              for (const payment of history.data) {
                // Check if transaction is already processed
                const existingTx = address.transactions.find(tx => tx.paymentId === payment.id);
                if (!existingTx) {
                  // Add new transaction
                  address.transactions.push({
                    paymentId: payment.id,
                    amount: payment.amount,
                    status: payment.status,
                    hash: payment.hash,
                    createdAt: new Date(payment.created_at)
                  });

                  // Update user balance
                  const user = await User.findById(address.userId);
                  if (user) {
                    await user.updateBalance(payment.amount);
                    
                    // Log activity
                    await ActivityLog.create({
                      userId: user.id,
                      username: user.username,
                      activityType: 'DEPOSIT_RECEIVED',
                      description: `Received deposit of ${payment.amount} ${address.currency}`,
                      metadata: {
                        amount: payment.amount,
                        currency: address.currency,
                        hash: payment.hash
                      }
                    });
                  }
                }
              }

              // Save updated address
              await address.save();
            }
          } catch (error) {
            console.error(`Error checking address ${address.address}:`, error);
          }
        }
      } catch (error) {
        console.error('Deposit watcher error:', error);
      }

      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, this.checkInterval));
    }
  }
}

module.exports = {
  depositWatcher: new DepositWatcher()
}; 