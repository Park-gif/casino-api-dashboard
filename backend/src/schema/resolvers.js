const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const DepositAddress = require('../models/DepositAddress');
const { categories } = require('../utils/auth');
const { UserInputError, AuthenticationError } = require('apollo-server-express');
const { GraphQLJSON } = require('graphql-type-json');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const ApiKey = require('../models/ApiKey');
const SlotMachine = require('../models/SlotMachine');
const { generateRefreshToken } = require('../utils/auth');
const Game = require('../models/Game');
const MerchantDeposit = require('../models/MerchantDeposit');
const { tatumService, TatumError } = require('../services/tatum');
const { SPINGATE_API_URL, SPINGATE_CONFIG } = require('../config/spingate');
const oxapay = require('../services/oxapay');
const { generateAccessToken } = require('../utils/auth');
const { supportedCurrencies, supportedNetworks } = require('../config');
const SlotTransaction = require('../models/SlotTransaction');

// Ensure these are strings
const SUPPORTED_CHAINS = ['BTC', 'ETH', 'TRON', 'BSC'];

const resolvers = {
  JSON: GraphQLJSON,
  
  MerchantDeposit: {
    merchant: async (deposit) => {
      return await User.findById(deposit.merchantId);
    }
  },
  
  Query: {
    me: async (_, __, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      const userData = await User.findById(user.id);
      console.log('User data from DB:', userData); // Debug log
      return userData;
    },
    getApiKeys: async (_, __, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return await ApiKey.find({ user: user.id });
    },
    getBalance: async (_, __, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      const userDoc = await User.findById(user.id);
      return userDoc.balance;
    },
    getBillingCycle: async (_, __, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      const userDoc = await User.findById(user.id);
      await userDoc.checkAndResetBillingCycle(); // Check and reset if needed
      return {
        current: userDoc.billingCycle.current,
        limit: userDoc.billingCycle.limit,
        lastReset: userDoc.billingCycle.lastReset.toISOString()
      };
    },
    getSlots: async (_, __, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return await SlotMachine.find();
    },
    getSlot: async (_, { id }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return await SlotMachine.findById(id);
    },
    getSlotStats: async (_, { id }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      const slot = await SlotMachine.findById(id);
      return slot.metrics;
    },
    getAgents: async (_, __, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      if (user.role === 'admin') {
        return await User.find({ role: 'agent' });
      } else {
        // For non-admin users, return agents where they are the parent
        return await User.find({ parentAgent: user.id });
      }
    },
    getAgent: async (_, { id }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      if (user.role !== 'admin') throw new AuthenticationError('Not authorized');
      return await User.findOne({ _id: id, role: 'agent' });
    },
    getSubAgents: async (_, __, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      if (user.role !== 'agent') throw new AuthenticationError('Not authorized');
      return await User.find({ parentAgent: user.id });
    },
    getActivityLogs: async (_, { limit = 50, offset = 0 }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      const logs = await ActivityLog.find({})
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit);
      
      return logs;
    },
    games: async (_, { filters = {}, page = 1, limit = 10 }) => {
      try {
        let query = {};
        
        if (filters.provider) {
          query.provider = filters.provider;
        }
        
        if (filters.category) {
          query.category = filters.category;
        }
        
        if (filters.type) {
          query.type = filters.type;
        }
        
        if (filters.status) {
          query.status = filters.status;
        }

        if (filters.dateFrom || filters.dateTo) {
          query.createdAt = {};
          if (filters.dateFrom) {
            query.createdAt.$gte = new Date(filters.dateFrom);
          }
          if (filters.dateTo) {
            query.createdAt.$lte = new Date(filters.dateTo);
          }
        }
        
        if (filters.search) {
          query.$or = [
            { name: { $regex: filters.search, $options: 'i' } },
            { gameId: { $regex: filters.search, $options: 'i' } },
            { provider: { $regex: filters.search, $options: 'i' } }
          ];
        }

        const totalGames = await Game.countDocuments(query);
        const totalPages = Math.ceil(totalGames / limit);

        const games = await Game.find(query)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit);

        return {
          games,
          totalGames,
          totalPages
        };
      } catch (error) {
        console.error('Error fetching games:', error);
        throw new Error('Failed to fetch games');
      }
    },
    game: async (_, { id }) => {
      try {
        const game = await Game.findById(id);
        if (!game) {
          throw new Error('Game not found');
        }
        return game;
      } catch (error) {
        console.error('Error fetching game:', error);
        throw new Error('Failed to fetch game');
      }
    },
    gamesByProvider: async (_, { provider }) => {
      try {
        const games = await Game.find({ provider })
          .sort({ name: 1 });
        return games;
      } catch (error) {
        console.error('Error fetching games by provider:', error);
        throw new Error('Failed to fetch games by provider');
      }
    },
    gameCategories: async () => {
      try {
        const categories = await Game.distinct('category');
        return categories.filter(category => category); // Remove null/empty categories
      } catch (error) {
        console.error('Error fetching game categories:', error);
        throw new Error('Failed to fetch game categories');
      }
    },
    getMerchantDeposits: async (_, { filters = {}, first = 10, after }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');

      try {
        let query = {};

        // Add merchant ID filter for non-admin users
        if (user.role !== 'admin') {
          query.merchantId = user.id;
        }

        // Apply filters
        if (filters.chain) {
          query.chain = filters.chain;
        }

        if (filters.status) {
          query.status = filters.status;
        }

        if (filters.fromDate || filters.toDate) {
          query.createdAt = {};
          if (filters.fromDate) {
            query.createdAt.$gte = new Date(filters.fromDate);
          }
          if (filters.toDate) {
            query.createdAt.$lte = new Date(filters.toDate);
          }
        }

        if (filters.minAmount || filters.maxAmount) {
          query.amount = {};
          if (filters.minAmount) {
            query.amount.$gte = filters.minAmount;
          }
          if (filters.maxAmount) {
            query.amount.$lte = filters.maxAmount;
          }
        }

        // Handle pagination
        if (after) {
          query._id = { $gt: after };
        }

        // Get total count
        const totalCount = await MerchantDeposit.countDocuments(query);

        // Get deposits
        const deposits = await MerchantDeposit.find(query)
          .sort({ _id: 1 })
          .limit(first + 1); // Get one extra to check if there are more

        const hasNextPage = deposits.length > first;
        const edges = deposits.slice(0, first);

        return {
          edges,
          pageInfo: {
            hasNextPage,
            endCursor: edges.length > 0 ? edges[edges.length - 1].id : null
          },
          totalCount
        };
      } catch (error) {
        console.error('Error fetching merchant deposits:', error);
        throw new Error('Failed to fetch merchant deposits');
      }
    },
    getMerchantDeposit: async (_, { id }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');

      try {
        const deposit = await MerchantDeposit.findById(id);
        if (!deposit) {
          throw new Error('Deposit not found');
        }

        // Check if user has access to this deposit
        if (user.role !== 'admin' && deposit.merchantId.toString() !== user.id) {
          throw new AuthenticationError('Not authorized');
        }

        return deposit;
      } catch (error) {
        console.error('Error fetching merchant deposit:', error);
        throw new Error('Failed to fetch merchant deposit');
      }
    },
    getDepositAddresses: async (_, args, context) => {
      try {
        // Check if user is authenticated
        if (!context.user) {
          throw new Error('Not authenticated');
        }

        const addresses = await DepositAddress.find({
          userId: context.user.id,
          isActive: true
        }).sort({ createdAt: -1 });

        return addresses;
      } catch (error) {
        console.error('Error fetching deposit addresses:', error);
        throw error;
      }
    },
    getDepositAddress: async (_, { userId, chain }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      // Only allow users to get their own deposit addresses or admins to view any
      if (user.role !== 'admin' && user.id !== userId) {
        throw new AuthenticationError('Not authorized');
      }

      return await DepositAddress.findOne({ userId, chain });
    },
    players: async (_, { filters, first, after }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');

      try {
        let query = { _id: user.id };

        // Get the user document
        const userDoc = await User.findOne(query);
        if (!userDoc) {
          return {
            players: [],
            totalCount: 0,
            hasNextPage: false
          };
        }

        // Filter and process players array
        let players = userDoc.players || [];

        // Apply search filter if provided
        if (filters?.search) {
          const searchRegex = new RegExp(filters.search, 'i');
          players = players.filter(player => 
            searchRegex.test(player.username) || 
            searchRegex.test(player.formattedUsername)
          );
        }

        // Apply status filter if provided
        if (filters?.status) {
          players = players.filter(player => player.status === filters.status);
        }

        // Apply date filters if provided
        if (filters?.dateFrom || filters?.dateTo) {
          players = players.filter(player => {
            const playerDate = new Date(player.createdAt);
            const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
            const toDate = filters.dateTo ? new Date(filters.dateTo) : null;

            return (!fromDate || playerDate >= fromDate) && (!toDate || playerDate <= toDate);
          });
        }

        // Apply sorting if provided
        if (filters?.orderBy && filters?.orderDirection) {
          players.sort((a, b) => {
            let aValue = a[filters.orderBy];
            let bValue = b[filters.orderBy];

            // Handle special cases for sorting
            if (filters.orderBy === 'createdAt') {
              aValue = new Date(aValue).getTime();
              bValue = new Date(bValue).getTime();
            } else if (filters.orderBy === 'totalBets') {
              aValue = aValue || 0;
              bValue = bValue || 0;
            }

            if (filters.orderDirection === 'asc') {
              return aValue > bValue ? 1 : -1;
            } else {
              return aValue < bValue ? 1 : -1;
            }
          });
        }

        // Handle pagination
        const startIndex = after ? parseInt(after) : 0;
        const hasNextPage = startIndex + first < players.length;
        const paginatedPlayers = players.slice(startIndex, startIndex + first);

        return {
          players: paginatedPlayers,
          totalCount: players.length,
          hasNextPage
        };
      } catch (error) {
        console.error('Error fetching players:', error);
        throw new Error('Failed to fetch players');
      }
    },
    exchangeRates: async () => {
      try {
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        
        if (!response.ok) {
          throw new Error('Failed to fetch exchange rates');
        }

        const data = await response.json();
        
        // Return the rates for supported currencies
        return {
          EUR: data.rates.EUR,
          TRY: data.rates.TRY,
          GBP: data.rates.GBP,
          BRL: data.rates.BRL,
          AUD: data.rates.AUD,
          CAD: data.rates.CAD,
          NZD: data.rates.NZD,
          TND: data.rates.TND
        };
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
        // Return default rates in case of error
        return {
          EUR: 0.966768,
          TRY: 35.984935,
          GBP: 0.805557,
          BRL: 5.763624,
          AUD: 1.593471,
          CAD: 1.430113,
          NZD: 1.76584,
          TND: 3.198701
        };
      }
    },
    slotTransactions: async (_, { filter = {}, page = 1, limit = 10 }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in to view transactions');
      }

      try {
        // Build query filters
        const query = {
          playerId: user._id // Only show transactions for the logged-in user's players
        };

        if (filter.username) {
          query.username = filter.username;
        }

        if (filter.formattedUsername) {
          query.formattedUsername = filter.formattedUsername;
        }

        if (filter.gameId) {
          query.gameId = filter.gameId;
        }

        if (filter.roundId) {
          query.roundId = filter.roundId;
        }

        if (filter.type) {
          query.type = filter.type;
        }

        // Date range filter
        if (filter.startDate || filter.endDate) {
          query.createdAt = {};
          if (filter.startDate) {
            query.createdAt.$gte = new Date(filter.startDate);
          }
          if (filter.endDate) {
            query.createdAt.$lte = new Date(filter.endDate);
          }
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Get total count for pagination
        const totalCount = await SlotTransaction.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);

        // Get transactions with pagination
        const transactions = await SlotTransaction.find(query)
          .sort({ createdAt: -1 }) // Most recent first
          .skip(skip)
          .limit(limit);

        return {
          transactions,
          totalCount,
          currentPage: page,
          totalPages
        };
      } catch (error) {
        console.error('Error fetching slot transactions:', error);
        throw new Error('Failed to fetch transactions');
      }
    }
  },
  Mutation: {
    register: async (_, { input }) => {
      try {
        const { username, email, password, currency } = input;

        // Check if user exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
          return {
            success: false,
            error: 'User already exists'
          };
        }

        // Create user
        const user = await User.create({
          username,
          email,
          password,
          currency,
          role: 'user'
        });

        // Get supported currencies from OxaPay
        const supportedCurrenciesResponse = await oxapay.getSupportedCurrencies();
        console.log('OxaPay supported currencies:', JSON.stringify(supportedCurrenciesResponse, null, 2));

        // Create deposit addresses for supported currencies and networks
        const addressPromises = [];

        // Iterate over OxaPay's supported currencies
        for (const [currencySymbol, currencyData] of Object.entries(supportedCurrenciesResponse)) {
          // Skip if currency is not active
          if (!currencyData.status) {
            console.log(`Skipping ${currencySymbol} - not active in OxaPay`);
            continue;
          }

          // Create address for each supported network
          for (const [networkName, networkData] of Object.entries(currencyData.networkList)) {
            try {
              // Create static address with exact currency symbol and network name
              const addressPromise = oxapay.createStaticAddress({
                currency: currencySymbol,
                network: networkName,
                callbackUrl: process.env.OXAPAY_CALLBACK_URL,
                description: `${currencySymbol}/${networkName} deposit address for user ${user.id}`,
                orderId: `${user.id}-${currencySymbol}-${networkName}-${Date.now()}`
              }).then(async (result) => {
                if (result.success) {
                  // Store the exact currency symbol and network name
                  await DepositAddress.create({
                    userId: user.id,
                    currency: currencySymbol,
                    network: networkName,
                    address: result.address,
                    isActive: true,
                    transactions: []
                  });
                  console.log(`Created ${currencySymbol}/${networkName} address successfully`);
                }
              }).catch(error => {
                console.error(`Failed to create ${currencySymbol}/${networkName} address:`, error.message);
              });

              addressPromises.push(addressPromise);
            } catch (error) {
              console.error(`Error creating ${currencySymbol}/${networkName} address:`, error.message);
            }
          }
        }

        // Wait for all addresses to be created
        await Promise.allSettled(addressPromises);

        // Generate token
        const accessToken = generateAccessToken(user);

        return {
          success: true,
          accessToken,
          user
        };
      } catch (error) {
        console.error('Registration error:', error);
        return {
          success: false,
          error: error.message || 'Registration failed'
        };
      }
    },
    login: async (_, { input }) => {
      const { email, password } = input;
      
      const user = await User.findOne({ email }).select('+password');
      if (!user || !(await user.matchPassword(password))) {
        throw new UserInputError('Invalid credentials');
      }

      const token = generateAccessToken(user);

      return {
        success: true,
        accessToken: token,
        user
      };
    },
    logout: async (_, __, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return true;
    },
    createApiKey: async (_, { input }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');

      try {
        const apiKey = new ApiKey({
          name: input.name,
          user: user.id
        });
        await apiKey.save();

        // Log activity
        await ActivityLog.create({
          userId: user.id,
          username: user.username,
          activityType: 'API_KEY_CREATED',
          description: `Created new API key: ${input.name}`,
          metadata: {
            keyId: apiKey.id,
            keyName: input.name
          }
        });

        return {
          success: true,
          apiKey,
          error: null
        };
      } catch (error) {
        return {
          success: false,
          apiKey: null,
          error: error.message
        };
      }
    },
    deleteApiKey: async (_, { id }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');

      const apiKey = await ApiKey.findById(id);
      if (!apiKey) throw new Error('API key not found');

      await ApiKey.findByIdAndDelete(id);

      // Log activity
      await ActivityLog.create({
        userId: user.id,
        username: user.username,
        activityType: 'API_KEY_DELETED',
        description: `Deleted API key: ${apiKey.name}`,
        metadata: {
          keyId: id,
          keyName: apiKey.name
        }
      });

      return true;
    },
    toggleApiKeyStatus: async (_, { id }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');

      const apiKey = await ApiKey.findById(id);
      if (!apiKey) throw new Error('API key not found');

      const newStatus = apiKey.status === 'active' ? 'inactive' : 'active';
      const updatedKey = await ApiKey.findByIdAndUpdate(
        id,
        { status: newStatus },
        { new: true }
      );

      // Log activity
      await ActivityLog.create({
        userId: user.id,
        username: user.username,
        activityType: 'API_KEY_STATUS_CHANGED',
        description: `Changed status of API key ${apiKey.name} from ${apiKey.status} to ${newStatus}`,
        metadata: {
          keyId: id,
          keyName: apiKey.name,
          previousStatus: apiKey.status,
          newStatus
        }
      });

      return updatedKey;
    },
    updateBalance: async (_, { input }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      const userDoc = await User.findById(user.id);
      await userDoc.updateBalance(input.amount);

      return userDoc.balance;
    },
    createSlot: async (_, { input }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      if (user.role !== 'admin') throw new AuthenticationError('Not authorized');

      return await SlotMachine.create(input);
    },
    updateSlotMetrics: async (_, { id, input }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      const slot = await SlotMachine.findById(id);
      if (!slot) throw new UserInputError('Slot machine not found');

      slot.metrics.totalBets++;
      slot.metrics.totalWins += input.win > 0 ? 1 : 0;
      slot.metrics.rtp = ((slot.metrics.totalWins / slot.metrics.totalBets) * 100) || 0;
      slot.metrics.hitFrequency = (slot.metrics.totalWins / slot.metrics.totalBets) || 0;
      slot.metrics.maxWin = Math.max(slot.metrics.maxWin, input.win);

      await slot.save();
      return slot.metrics;
    },
    createAgent: async (_, { input }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');

      try {
        const agent = new User({
          ...input,
          parentAgent: user.role !== 'admin' ? user.id : null
        });
        await agent.save();

        // Log activity
        await ActivityLog.create({
          userId: user.id,
          username: user.username,
          activityType: 'AGENT_CREATED',
          description: `Created new agent: ${agent.username}`,
          metadata: {
            agentId: agent.id,
            agentUsername: agent.username,
            agentEmail: agent.email
          }
        });

        return {
          success: true,
          agent,
          error: null
        };
      } catch (error) {
        return {
          success: false,
          agent: null,
          error: error.message
        };
      }
    },
    updateAgent: async (_, { id, input }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      if (user.role !== 'admin') throw new AuthenticationError('Not authorized');

      const agent = await User.findOneAndUpdate(
        { _id: id, role: 'agent' },
        { $set: input },
        { new: true }
      );

      if (!agent) throw new UserInputError('Agent not found');

      return {
        success: true,
        agent
      };
    },
    suspendAgent: async (_, { id }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      if (user.role !== 'admin') throw new AuthenticationError('Not authorized');

      const agent = await User.findOneAndUpdate(
        { _id: id, role: 'agent' },
        { status: 'suspended' }
      );

      return !!agent;
    },
    activateAgent: async (_, { id }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      if (user.role !== 'admin') throw new AuthenticationError('Not authorized');

      const agent = await User.findOneAndUpdate(
        { _id: id, role: 'agent' },
        { status: 'active' }
      );

      return !!agent;
    },
    updateAgentBalance: async (_, { agentId, amount }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');

      const agent = await User.findById(agentId);
      if (!agent) throw new Error('Agent not found');

      // Check if user has enough balance when adding to agent's balance
      if (amount > 0) {
        const currentUser = await User.findById(user.id);
        if (currentUser.balance < amount) {
          throw new Error('Insufficient balance');
        }
        
        // Deduct from user's balance
        await User.findByIdAndUpdate(user.id, {
          $inc: { balance: -amount }
        });
      } else {
        // When withdrawing from agent, add to user's balance
        await User.findByIdAndUpdate(user.id, {
          $inc: { balance: Math.abs(amount) }
        });
      }

      // Update agent's balance
      const newBalance = agent.balance + amount;
      await User.findByIdAndUpdate(agentId, { balance: newBalance });

      // Log activity
      await ActivityLog.create({
        userId: user.id,
        username: user.username,
        activityType: 'BALANCE_UPDATE',
        description: `Updated balance for agent ${agent.username} by ${amount}`,
        metadata: {
          agentId,
          amount,
          previousBalance: agent.balance,
          newBalance,
          type: amount > 0 ? 'deposit' : 'withdrawal'
        }
      });

      return newBalance;
    },
    toggleAgentStatus: async (_, { agentId }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');

      const agent = await User.findById(agentId);
      if (!agent) throw new Error('Agent not found');

      const newStatus = agent.status === 'active' ? 'suspended' : 'active';
      const updatedAgent = await User.findByIdAndUpdate(
        agentId,
        { status: newStatus },
        { new: true }
      );

      // Log activity
      await ActivityLog.create({
        userId: user.id,
        username: user.username,
        activityType: 'AGENT_STATUS_CHANGED',
        description: `Changed status of agent ${agent.username} from ${agent.status} to ${newStatus}`,
        metadata: {
          agentId,
          previousStatus: agent.status,
          newStatus
        }
      });

      return updatedAgent;
    },
    createActivityLog: async (_, { activityType, description, metadata }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');

      const log = await ActivityLog.create({
        userId: user.id,
        username: user.username,
        activityType,
        description,
        metadata
      });

      return log;
    },
    updateUserCallbackUrl: async (_, { url }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');

      try {
        // Validate URL format
        if (url && !isValidUrl(url)) {
          throw new UserInputError('Invalid URL format');
        }

        // Get current user data for logging
        const currentUser = await User.findById(user.id);
        const oldUrl = currentUser.callbackUrl;

        // Update user's callback URL
        const updatedUser = await User.findByIdAndUpdate(
          user.id,
          { callbackUrl: url },
          { new: true, runValidators: true }
        );

        if (!updatedUser) {
          throw new Error('User not found');
        }

        // Log the activity
        await ActivityLog.create({
          userId: user.id,
          username: user.username,
          activityType: 'CALLBACK_URL_UPDATED',
          description: `Callback URL updated from "${oldUrl}" to "${url}"`,
          metadata: { oldUrl, newUrl: url }
        });

        console.log('Updated user data:', updatedUser); // Debug log

        return updatedUser;
      } catch (error) {
        console.error('Error updating callback URL:', error);
        throw new Error(error.message || 'Failed to update callback URL');
      }
    },
    updateEmailNotifications: async (_, { enabled }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');

      try {
        const updatedUser = await User.findByIdAndUpdate(
          user.id,
          { emailNotifications: enabled },
          { new: true }
        );

        if (!updatedUser) {
          throw new Error('User not found');
        }

        // Log the activity
        await ActivityLog.create({
          userId: user.id,
          username: user.username,
          activityType: 'EMAIL_NOTIFICATIONS_UPDATED',
          description: `Email notifications ${enabled ? 'enabled' : 'disabled'}`,
          metadata: { enabled }
        });

        return updatedUser;
      } catch (error) {
        console.error('Error updating email notifications:', error);
        throw new Error('Failed to update email notifications');
      }
    },
    launchGame: async (_, { gameId }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');

      try {
        const game = await Game.findById(gameId);
        if (!game) {
          throw new Error('Game not found');
        }

        // Determine which game ID to use based on provider
        const gameIdentifier = game.provider === 'spingate' ? game.id_hash : game.gameId;

        // Construct base URL for the application
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

        // Format demo player username with demo_ prefix
        const demoUsername = `demo_${user.username}`;
        const formattedUsername = `${demoUsername}_USD_${demoUsername}`;

        // First create the demo player
        const createPlayerResponse = await axios.post(SPINGATE_API_URL, {
          ...SPINGATE_CONFIG,
          method: 'createPlayer',
          user_username: formattedUsername,
          user_password: formattedUsername,
          currency: 'USD'
        });

        console.log('Create Player Response:', createPlayerResponse.data); // Debug log

        // Now launch the game with the demo player credentials
        const response = await axios.post(SPINGATE_API_URL, {
          ...SPINGATE_CONFIG,
          method: 'getGame',
          user_username: formattedUsername,
          user_password: formattedUsername,
          gameid: gameIdentifier,
          homeurl: `${baseUrl}/dashboard`,
          cashierurl: `${baseUrl}/dashboard/wallet`,
          play_for_fun: 0,
          currency: 'USD',
          lang: 'en'
        });

        console.log('Spingate API Response:', response.data); // Debug log

        // Log the activity
        await ActivityLog.create({
          userId: user.id,
          username: user.username,
          activityType: 'GAME_LAUNCHED',
          description: `Launched game ${game.name} (${gameIdentifier})`,
          metadata: { gameId: game.id, provider: game.provider }
        });

        if (response.data.error !== 0) {
          return {
            url: `${baseUrl}/error?message=${encodeURIComponent(response.data.message || 'Failed to launch game')}`,
            success: false,
            error: response.data.message || 'Failed to launch game'
          };
        }

        // Return the direct game URL from Spingate
        return {
          url: response.data.response,
          success: true,
          error: null
        };

      } catch (error) {
        console.error('Error launching game:', error);
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        return {
          url: `${baseUrl}/error?message=${encodeURIComponent(error.message)}`,
          success: false,
          error: error.message
        };
      }
    }
  }
};

// URL validation helper
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (err) {
    return false;
  }
}

module.exports = resolvers; 