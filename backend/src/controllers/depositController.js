const DepositAddress = require('../models/DepositAddress');
const oxapay = require('../services/oxapay');
const config = require('../config');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Transaction = require('../models/transaction');

// Minimum deposit amounts for each currency/network
const MIN_DEPOSITS = {
  BTC: { Bitcoin: 0.0003 },
  ETH: { ERC20: 0.01, Base: 0.01 },
  USDC: { ERC20: 10 },
  TRX: { TRC20: 100 },
  BNB: { BEP20: 0.05 },
  DOGE: { Dogecoin: 100 },
  LTC: { Litecoin: 0.1 },
  XMR: { Monero: 0.01 },
  USDT: { 
    BEP20: 10, 
    ERC20: 10, 
    TRC20: 10, 
    Polygon: 10, 
    Ton: 10 
  },
  TON: { Ton: 10 },
  POL: { Polygon: 1 },
  BCH: { BitcoinCash: 0.01 },
  SHIB: { BEP20: 500000 },
  SOL: { Solana: 0.1 },
  NOT: { Ton: 100 },
  DOGS: { Ton: 100 }
};

exports.generateDepositAddress = async (req, res) => {
  try {
    const { currency, network } = req.body;
    const userId = req.user.id;

    console.log('Generating deposit address:', { currency, network, userId });

    // Validate currency
    if (!currency || !config.supportedCurrencies.includes(currency)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported currency. Supported currencies are: ${config.supportedCurrencies.join(', ')}`
      });
    }

    // Get supported networks for the currency
    const supportedNetworksForCurrency = config.supportedNetworks[currency];
    if (!supportedNetworksForCurrency) {
      return res.status(400).json({
        success: false,
        message: `No supported networks found for currency: ${currency}`
      });
    }

    // Use provided network or default to first supported network
    const selectedNetwork = network || supportedNetworksForCurrency[0];

    // Validate network
    if (!supportedNetworksForCurrency.includes(selectedNetwork)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported network for ${currency}. Supported networks are: ${supportedNetworksForCurrency.join(', ')}`
      });
    }

    // Get minimum deposit amount
    const minDeposit = MIN_DEPOSITS[currency]?.[selectedNetwork];
    if (!minDeposit) {
      console.warn(`No minimum deposit amount configured for ${currency}/${selectedNetwork}`);
    }

    // Check if user already has an active address for this currency and network
    const existingAddress = await DepositAddress.findOne({
      userId,
      currency,
      network: selectedNetwork,
      isActive: true
    });

    if (existingAddress) {
      console.log('Found existing address:', existingAddress);
      return res.status(200).json({
        success: true,
        data: {
          ...existingAddress.toObject(),
          minDeposit: minDeposit || 0
        }
      });
    }

    console.log('Creating new OxaPay address for:', { currency, network: selectedNetwork, minDeposit });

    // Create static address in OxaPay
    const result = await oxapay.createStaticAddress({
      currency,
      network: selectedNetwork,
      description: `${currency}/${selectedNetwork} deposit address for user ${userId}`,
      orderId: `${userId}-${currency}-${selectedNetwork}-${Date.now()}`,
      minAmount: minDeposit // Changed from amount to minAmount
    });

    if (!result.success) {
      console.error('OxaPay address creation failed:', result);
      return res.status(400).json({
        success: false,
        message: result.error || 'Failed to create deposit address',
        details: result.details
      });
    }

    console.log('OxaPay address created:', result);

    // Create deposit address record
    const depositAddress = await DepositAddress.create({
      userId,
      currency,
      network: selectedNetwork,
      address: result.address,
      isActive: true,
      transactions: [],
      minDeposit: minDeposit || 0
    });

    console.log('Deposit address created:', depositAddress);

    // Log activity
    await ActivityLog.create({
      userId,
      username: req.user.username,
      activityType: 'DEPOSIT_ADDRESS_CREATED',
      description: `Created deposit address for ${currency} on ${selectedNetwork}`,
      metadata: {
        currency,
        network: selectedNetwork,
        address: result.address,
        minDeposit: minDeposit || 0
      }
    });

    res.status(201).json({
      success: true,
      data: {
        ...depositAddress.toObject(),
        minDeposit: minDeposit || 0
      }
    });
  } catch (error) {
    console.error('Generate deposit address error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating deposit address'
    });
  }
};

exports.getDepositAddresses = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Get total count
    const totalCount = await DepositAddress.countDocuments({
      userId: req.user.id,
      isActive: true
    });

    // Get addresses with pagination
    const addresses = await DepositAddress.find({
      userId: req.user.id,
      isActive: true
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    if (!addresses || addresses.length === 0) {
      // If no addresses found, create a new one with default currency
      const defaultCurrency = config.supportedCurrencies[0]; // BTC
      const defaultNetwork = config.supportedNetworks[defaultCurrency][0];

      const result = await oxapay.createStaticAddress({
        currency: defaultCurrency,
        network: defaultNetwork,
        callbackUrl: process.env.OXAPAY_CALLBACK_URL,
        description: `Default deposit address for user ${req.user.id}`,
        orderId: `${req.user.id}-${Date.now()}`
      });

      if (result.success) {
        const newAddress = await DepositAddress.create({
          userId: req.user.id,
          currency: defaultCurrency,
          network: defaultNetwork,
          address: result.address,
          isActive: true,
          transactions: []
        });

        return res.status(201).json({
          success: true,
          data: [newAddress],
          pagination: {
            total: 1,
            page: 1,
            pages: 1,
            hasMore: false
          }
        });
      }
    }

    res.status(200).json({
      success: true,
      data: addresses,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        pages: Math.ceil(totalCount / limit),
        hasMore: skip + addresses.length < totalCount
      }
    });
  } catch (error) {
    console.error('Get deposit addresses error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching deposit addresses'
    });
  }
};

exports.getDepositHistory = async (req, res) => {
  try {
    const addresses = await DepositAddress.find({
      userId: req.user.id
    }).sort({ createdAt: -1 });

    // Flatten all transactions from all addresses
    const transactions = addresses.reduce((acc, addr) => {
      return acc.concat(addr.transactions.map(tx => ({
        ...tx.toObject(),
        currency: addr.currency,
        network: addr.network,
        address: addr.address
      })));
    }, []);

    // Sort by date
    transactions.sort((a, b) => b.createdAt - a.createdAt);

    res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Get deposit history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching deposit history'
    });
  }
};

async function updateUserBalance(userId, amount, cryptoCurrency, userCurrency) {
  try {
    // Get current prices from OxaPay
    const prices = await oxapay.getPrices();
    
    // Get exchange rates for fiat currencies
    const exchangeRates = await oxapay.getExchangeRates();
    
    // Calculate the value in user's preferred currency
    let convertedAmount;
    
    // First get the crypto price in the user's currency
    const cryptoPrice = prices[cryptoCurrency][userCurrency] || 
                       (prices[cryptoCurrency].USD * exchangeRates.rates[userCurrency]);
    
    // Calculate final amount in user's currency
    convertedAmount = amount * cryptoPrice;

    // Round to 2 decimal places
    convertedAmount = Math.round(convertedAmount * 100) / 100;

    // Update user's balance
    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { balance: convertedAmount } },
      { new: true }
    );

    // Log the conversion
    console.log(`Converted ${amount} ${cryptoCurrency} to ${convertedAmount} ${userCurrency} for user ${userId}`);
    
    // Create activity log
    await ActivityLog.create({
      userId,
      username: user.username,
      activityType: 'DEPOSIT_CONVERSION',
      description: `Converted ${amount} ${cryptoCurrency} to ${convertedAmount} ${userCurrency}`,
      metadata: {
        originalAmount: amount,
        originalCurrency: cryptoCurrency,
        convertedAmount,
        convertedCurrency: userCurrency,
        rate: cryptoPrice
      }
    });

    return {
      convertedAmount,
      rate: cryptoPrice,
      newBalance: user.balance
    };
  } catch (error) {
    console.error('Error updating user balance:', error);
    throw error;
  }
}

async function handleDeposit(req, res) {
  try {
    const { userId, currency, network, amount, txId } = req.body;

    // Verify the transaction exists
    const transaction = await Transaction.findOne({ txId });
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Get user's preferred currency
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user's balance with currency conversion
    const result = await updateUserBalance(userId, amount, currency, user.currency);

    // Update transaction status and conversion details
    transaction.status = 'completed';
    transaction.convertedAmount = result.convertedAmount;
    transaction.convertedCurrency = user.currency;
    transaction.rate = result.rate;
    await transaction.save();

    res.json({ 
      success: true, 
      data: {
        convertedAmount: result.convertedAmount,
        currency: user.currency,
        newBalance: result.newBalance,
        rate: result.rate
      }
    });
  } catch (error) {
    console.error('Error handling deposit:', error);
    res.status(500).json({ error: 'Failed to process deposit' });
  }
}

exports.handleOxapayCallback = async (req, res) => {
  try {
    const {
      merchant,
      status,
      track_id,
      currency,
      network,
      amount,
      txid,
      address,
      confirmations
    } = req.body;

    // Verify merchant ID
    if (merchant !== process.env.OXAPAY_API_KEY) {
      return res.status(403).json({
        success: false,
        message: 'Invalid merchant'
      });
    }

    // Find the deposit address
    const depositAddress = await DepositAddress.findOne({
      address,
      currency,
      network,
      isActive: true
    });

    if (!depositAddress) {
      return res.status(404).json({
        success: false,
        message: 'Deposit address not found'
      });
    }

    // Check if transaction already exists
    const existingTx = depositAddress.transactions.find(tx => tx.txId === txid);
    if (existingTx) {
      // Update status if needed
      if (existingTx.status !== status) {
        existingTx.status = status;
        existingTx.confirmations = confirmations;
        await depositAddress.save();
      }
      return res.status(200).json({ success: true });
    }

    // Add new transaction
    depositAddress.transactions.push({
      txId: txid,
      amount: parseFloat(amount),
      status,
      confirmations,
      createdAt: new Date()
    });
    await depositAddress.save();

    // If payment is completed, update user balance
    if (status === 'completed') {
      const user = await User.findById(depositAddress.userId);
      if (!user) {
        throw new Error('User not found');
      }

      await updateUserBalance(
        depositAddress.userId,
        parseFloat(amount),
        currency,
        user.currency || 'USD'
      );

      // Create transaction record
      await Transaction.create({
        userId: depositAddress.userId,
        type: 'deposit',
        amount: parseFloat(amount),
        currency,
        status: 'completed',
        txId: txid,
        metadata: {
          network,
          address,
          confirmations,
          track_id
        }
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Oxapay callback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing callback'
    });
  }
};

module.exports = {
  generateDepositAddress,
  getDepositAddresses,
  getDepositHistory,
  handleDeposit,
  handleOxapayCallback
}; 