const { tatumService } = require('./tatum');
const MerchantDeposit = require('../models/MerchantDeposit');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const axios = require('axios');

class MerchantDepositWatcher {
  constructor() {
    this.watchIntervalMs = 30000; // 30 seconds
    this.watching = false;
    this.watchInterval = null;
  }

  async start() {
    if (this.watching) return;
    
    console.log('🔄 Starting merchant deposit watcher...');
    this.watching = true;
    this.watchInterval = setInterval(() => this.checkMerchantDeposits(), this.watchIntervalMs);
    
    // Do initial check
    await this.checkMerchantDeposits();
  }

  stop() {
    if (!this.watching) return;
    
    console.log('⏹️ Stopping merchant deposit watcher...');
    this.watching = false;
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
    }
  }

  async checkMerchantDeposits() {
    try {
      // Get all pending deposits
      const pendingDeposits = await MerchantDeposit.find({ status: 'pending' });
      
      for (const deposit of pendingDeposits) {
        try {
          // Get transaction details from Tatum
          const txDetails = await this.getTransactionDetails(deposit.chain, deposit.txId);
          
          // Update confirmations
          deposit.confirmations = txDetails.confirmations;
          
          // Check if enough confirmations
          if (txDetails.confirmations >= this.getRequiredConfirmations(deposit.chain)) {
            await this.processDeposit(deposit, txDetails);
          }
          
          await deposit.save();
        } catch (error) {
          console.error(`Error checking deposit ${deposit.txId}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in merchant deposit watcher:', error);
    }
  }

  async processDeposit(deposit, txDetails) {
    try {
      // Get merchant
      const merchant = await User.findById(deposit.merchantId);
      if (!merchant) {
        deposit.status = 'failed';
        deposit.processedAt = new Date();
        await deposit.save();
        return;
      }

      // Update merchant balance
      merchant.balance += deposit.amount;
      await merchant.save();

      // Mark deposit as confirmed
      deposit.status = 'confirmed';
      deposit.processedAt = new Date();
      await deposit.save();

      // Log activity
      await ActivityLog.create({
        userId: merchant.id,
        username: merchant.username,
        activityType: 'MERCHANT_DEPOSIT_CONFIRMED',
        description: `Confirmed ${deposit.amount} ${deposit.chain} merchant deposit`,
        metadata: {
          depositId: deposit.id,
          chain: deposit.chain,
          amount: deposit.amount,
          txId: deposit.txId
        }
      });

      // Notify merchant via callback URL if configured
      if (merchant.callbackUrl) {
        try {
          await axios.post(merchant.callbackUrl, {
            event: 'deposit_confirmed',
            data: {
              merchantId: merchant.id,
              depositId: deposit.id,
              chain: deposit.chain,
              amount: deposit.amount,
              txId: deposit.txId,
              confirmations: deposit.confirmations,
              processedAt: deposit.processedAt
            }
          });
        } catch (error) {
          console.error(`Failed to notify merchant ${merchant.id}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error processing deposit ${deposit.txId}:`, error);
      deposit.status = 'failed';
      deposit.processedAt = new Date();
      await deposit.save();
    }
  }

  async getTransactionDetails(chain, txId) {
    try {
      const response = await tatumService.axios.get(`/${chain.toLowerCase()}/transaction/${txId}`);
      return {
        confirmations: response.data.confirmations,
        amount: response.data.amount,
        from: response.data.from,
        to: response.data.to
      };
    } catch (error) {
      console.error(`Failed to get transaction details for ${txId}:`, error);
      throw error;
    }
  }

  getRequiredConfirmations(chain) {
    switch (chain.toUpperCase()) {
      case 'BTC':
        return 2;
      case 'ETH':
        return 12;
      case 'TRON':
        return 19;
      case 'BSC':
        return 12;
      default:
        return 12;
    }
  }
}

const merchantDepositWatcher = new MerchantDepositWatcher();

module.exports = { merchantDepositWatcher }; 