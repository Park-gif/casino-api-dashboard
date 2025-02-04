const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiKey = require('../models/ApiKey');
const SlotMachine = require('../models/SlotMachine');
const { generateAccessToken, generateRefreshToken } = require('../utils/auth');
const { AuthenticationError, UserInputError } = require('apollo-server-express');
const ActivityLog = require('../models/ActivityLog');
const { GraphQLJSON } = require('graphql-type-json');
const Game = require('../models/Game');
const MerchantDeposit = require('../models/MerchantDeposit');
const DepositAddress = require('../models/DepositAddress');
const { tatumService, TatumError } = require('../services/tatum');

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
    getDepositAddresses: async (_, { userId }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      // Only allow users to get their own deposit addresses or admins to view any
      if (user.role !== 'admin' && user.id !== userId) {
        throw new AuthenticationError('Not authorized');
      }

      return await DepositAddress.find({ userId });
    },
    getDepositAddress: async (_, { userId, chain }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      // Only allow users to get their own deposit addresses or admins to view any
      if (user.role !== 'admin' && user.id !== userId) {
        throw new AuthenticationError('Not authorized');
      }

      return await DepositAddress.findOne({ userId, chain });
    }
  },
  Mutation: {
    register: async (_, { input }) => {
      const { username, email, password } = input;
      
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        throw new UserInputError('User already exists');
      }

      const user = await User.create({
        username,
        email,
        password,
        role: 'user'
      });

      console.log('Created user:', user);

      // Create deposit addresses for each supported chain
      try {
        console.log('Creating deposit addresses for chains:', SUPPORTED_CHAINS);
        
        for (const chain of SUPPORTED_CHAINS) {
          console.log(`Creating deposit address for chain: ${chain}`);
          
          try {
            const addressData = await tatumService.createDepositAddress({
              chain: chain.toString(),
              userId: user.id
            });

            console.log(`Created address for ${chain}:`, addressData);

            // Extract address and privateKey from the response object
            const address = addressData.address;
            const privateKey = addressData.privateKey || addressData.key; // Handle different response formats

            // Save deposit address to MongoDB with the correct string values
            const depositAddress = await DepositAddress.create({
              userId: user.id,
              chain,
              address: address, // Use the string address value
              privateKey: privateKey, // Use the string privateKey value
              isActive: true
            });

            console.log(`Saved deposit address to MongoDB:`, depositAddress);

            // Log activity
            await ActivityLog.create({
              userId: user.id,
              username: user.username,
              activityType: 'DEPOSIT_ADDRESS_CREATED',
              description: `Created ${chain} deposit address`,
              metadata: {
                chain,
                address,
                depositAddressId: depositAddress.id
              }
            });

            console.log(`Created activity log for ${chain} address`);
          } catch (error) {
            // TatumError is already logged in the service
            if (!(error instanceof TatumError)) {
              console.error(`Failed to create deposit address: ${error.message}`);
            }
          }
        }
      } catch (error) {
        console.error('Failed to create deposit addresses:', error);
        // Don't throw error here, let user register even if address creation fails
      }

      const token = generateAccessToken(user);

      return {
        success: true,
        accessToken: token,
        user
      };
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