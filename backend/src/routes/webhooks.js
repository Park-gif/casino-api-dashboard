const express = require('express');
const router = express.Router();
const DepositAddress = require('../models/DepositAddress');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { tatumService } = require('../services/tatum');

// Helper function to get USD value
async function getUSDValue(amount, chain) {
  try {
    // You would typically use an external price feed here
    // For now, using hardcoded values for example
    const prices = {
      BTC: 42000,
      ETH: 2200,
      TRON: 0.1,
      BSC: 230
    };
    return amount * prices[chain];
  } catch (error) {
    console.error('Error getting USD value:', error);
    return 0;
  }
}

// Handle deposit notifications from Tatum
router.post('/deposits', async (req, res) => {
  try {
    const {
      address: toAddress,
      amount,
      txId,
      confirmations,
      chain,
      from: fromAddress,
      blockNumber,
      blockHash,
      timestamp
    } = req.body;

    console.log('Received deposit webhook:', {
      toAddress,
      amount,
      txId,
      confirmations,
      chain,
      fromAddress,
      blockNumber,
      blockHash,
      timestamp
    });

    // Find the deposit address
    const depositAddress = await DepositAddress.findOne({ address: toAddress });
    if (!depositAddress) {
      console.warn(`No deposit address found for ${toAddress}`);
      return res.status(404).json({ message: 'Deposit address not found' });
    }

    // Check if transaction already exists
    const existingTx = depositAddress.transactions.find(tx => tx.txId === txId);
    if (existingTx) {
      // Update confirmations and status if needed
      if (existingTx.confirmations !== confirmations) {
        existingTx.confirmations = confirmations;
        existingTx.status = confirmations >= getRequiredConfirmations(chain) ? 'confirmed' : 'pending';
        await depositAddress.save();
      }
      return res.status(200).json({ message: 'Transaction already processed' });
    }

    // Get USD value
    const amountUSD = await getUSDValue(amount, chain);

    // Add transaction to address
    const transaction = {
      txId,
      amount,
      amountUSD,
      fromAddress,
      toAddress,
      confirmations,
      blockNumber,
      blockHash,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      status: confirmations >= getRequiredConfirmations(chain) ? 'confirmed' : 'pending',
      processed: false
    };

    depositAddress.transactions.push(transaction);

    // If enough confirmations, credit user balance
    if (confirmations >= getRequiredConfirmations(chain)) {
      const user = await User.findById(depositAddress.userId);
      if (user) {
        // Update user balance
        user.balance += amount;
        await user.save();

        // Mark transaction as processed
        const tx = depositAddress.transactions.find(t => t.txId === txId);
        if (tx) {
          tx.processed = true;
          tx.status = 'confirmed';
        }

        // Log activity with enhanced details
        await ActivityLog.create({
          userId: user.id,
          username: user.username,
          activityType: 'DEPOSIT_RECEIVED',
          description: `Received ${amount} ${chain} (${amountUSD.toFixed(2)} USD) deposit`,
          metadata: {
            chain,
            amount,
            amountUSD,
            txId,
            fromAddress,
            toAddress,
            confirmations,
            blockNumber,
            blockHash,
            timestamp: transaction.timestamp
          }
        });
      }
    }

    await depositAddress.save();
    res.status(200).json({ message: 'Deposit processed successfully' });
  } catch (error) {
    console.error('Error processing deposit:', error);
    res.status(500).json({ message: 'Error processing deposit' });
  }
});

function getRequiredConfirmations(chain) {
  switch (chain.toUpperCase()) {
    case 'BTC':
      return 2;
    case 'ETH':
      return 12;
    case 'TRON':
      return 19;
    case 'BSC':
      return 15;
    default:
      return 1;
  }
}

// Handle Oxapay payment notifications
router.post('/oxapay', async (req, res) => {
  try {
    const { depositController } = require('../controllers/depositController');
    await depositController.handleOxapayCallback(req, res);
  } catch (error) {
    console.error('Error in Oxapay webhook:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router; 