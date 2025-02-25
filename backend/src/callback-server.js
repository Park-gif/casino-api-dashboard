const express = require('express');
const cors = require('cors');

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware to parse query parameters
app.use(express.json());

// Store player balances in memory (for testing) - stored in cents
const playerBalances = new Map();

// Store transaction history
const transactionHistory = new Map();

// Helper function to log transaction
function logTransaction(username, data) {
  if (!transactionHistory.has(username)) {
    transactionHistory.set(username, []);
  }
  
  const transaction = {
    timestamp: new Date(),
    call_id: data.call_id,
    action: data.action,
    type: data.type || 'balance_check',
    amount: data.amount ? Math.round(parseFloat(data.amount) * 100) : 0,
    currency: data.currency,
    game_id: data.game_id,
    round_id: data.round_id,
    session_id: data.session_id,
    gameplay_final: data.gameplay_final,
    balance_before: data.balance_before,
    balance_after: data.balance_after
  };

  const transactions = transactionHistory.get(username);
  transactions.push(transaction);
  transactionHistory.set(username, transactions);

  // Log transaction details
  console.log('\n=== Transaction Log ===');
  console.log('Time:', transaction.timestamp.toISOString());
  console.log('Player:', username);
  console.log('Action:', transaction.action);
  console.log('Type:', transaction.type);
  if (transaction.amount > 0) {
    console.log('Amount:', `${transaction.amount} cents ($${transaction.amount/100} ${transaction.currency})`);
  }
  console.log('Game:', transaction.game_id || 'N/A');
  console.log('Round:', transaction.round_id || 'N/A');
  console.log('Balance Before:', `${transaction.balance_before} cents ($${transaction.balance_before/100} ${transaction.currency})`);
  console.log('Balance After:', `${transaction.balance_after} cents ($${transaction.balance_after/100} ${transaction.currency})`);
  console.log('Call ID:', transaction.call_id);
  if (transaction.gameplay_final) {
    console.log('Round Final:', transaction.gameplay_final === '1' ? 'Yes' : 'No');
  }
  console.log('=====================\n');
}

// Balance check endpoint
app.get('/', (req, res) => {
  console.log('Received request:', req.query);
  
  const {
    username,
    currency,
    action,
    amount,
    call_id,
    timestamp,
    key,
    gameplay_final,
    type,
    round_id,
    game_id,
    session_id,
    operator_id
  } = req.query;

  // Initialize player balance if not exists (100000 cents = $1000.00)
  if (!playerBalances.has(username)) {
    playerBalances.set(username, 100000);
  }

  // Get current balance in cents
  let currentBalance = playerBalances.get(username);
  let balanceBefore = currentBalance;

  // Handle different action types
  switch (action) {
    case 'balance':
      logTransaction(username, {
        ...req.query,
        balance_before: currentBalance,
        balance_after: currentBalance
      });
      return res.json({
        error: 0,
        balance: currentBalance
      });

    case 'debit':
      // Convert amount to cents
      const debitAmount = Math.round(parseFloat(amount || '0') * 100);
      if (isNaN(debitAmount) || debitAmount <= 0) {
        console.log('Invalid debit amount:', amount);
        return res.json({
          error: 1,
          balance: currentBalance
        });
      }

      // Check if player has enough balance
      if (currentBalance < debitAmount) {
        logTransaction(username, {
          ...req.query,
          balance_before: currentBalance,
          balance_after: currentBalance,
          error: 'Insufficient balance'
        });
        return res.json({
          error: 1,
          balance: currentBalance
        });
      }

      // Process debit
      currentBalance -= debitAmount;
      playerBalances.set(username, currentBalance);
      
      logTransaction(username, {
        ...req.query,
        balance_before: balanceBefore,
        balance_after: currentBalance
      });
      
      return res.json({
        error: 0,
        balance: currentBalance
      });

    case 'credit':
      // Convert amount to cents
      const creditAmount = Math.round(parseFloat(amount || '0') * 100);
      if (isNaN(creditAmount) || creditAmount < 0) {
        console.log('Invalid credit amount:', amount);
        return res.json({
          error: 1,
          balance: currentBalance
        });
      }

      // Process credit
      currentBalance += creditAmount;
      playerBalances.set(username, currentBalance);

      logTransaction(username, {
        ...req.query,
        balance_before: balanceBefore,
        balance_after: currentBalance
      });

      return res.json({
        error: 0,
        balance: currentBalance
      });

    default:
      console.log('Invalid action type:', action);
      return res.json({
        error: 2,
        balance: currentBalance
      });
  }
});

// Add endpoint to view transaction history
app.get('/transactions/:username', (req, res) => {
  const { username } = req.params;
  const transactions = transactionHistory.get(username) || [];
  res.json(transactions);
});

// Start server
const PORT = 3333;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Callback server running on http://0.0.0.0:${PORT}`);
  console.log('Server is ready to handle balance, debit, and credit actions');
  console.log('All balances are handled in cents (1 USD = 100 cents)');
  console.log('Transaction history available at /transactions/:username');
}); 