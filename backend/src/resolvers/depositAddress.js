const { tatumService, TatumError } = require('../services/tatum');
const DepositAddress = require('../models/DepositAddress');
const ActivityLog = require('../models/ActivityLog');

const depositAddressResolvers = {
  Query: {
    getDepositAddresses: async (_, { userId }) => {
      return await DepositAddress.find({ userId });
    },
    getDepositAddress: async (_, { userId, chain }) => {
      return await DepositAddress.findOne({ userId, chain });
    }
  },
  Mutation: {
    createDepositAddress: async (_, { userId, chain }) => {
      try {
        // Check if address already exists
        const existingAddress = await DepositAddress.findOne({ userId, chain });
        if (existingAddress) {
          return existingAddress;
        }

        // Create new address using Tatum
        const tatumResult = await tatumService.createDepositAddress({ chain, userId });
        console.log('Tatum service returned:', {
          address: tatumResult.address,
          hasPrivateKey: !!tatumResult.privateKey,
          hasXpub: !!tatumResult.xpub
        });

        // Validate required fields and ensure they are strings
        if (!tatumResult.address || !tatumResult.privateKey) {
          throw new Error('Missing required fields from Tatum service');
        }

        const addressStr = typeof tatumResult.address === 'object' ? tatumResult.address.address : String(tatumResult.address);
        const privateKeyStr = typeof tatumResult.privateKey === 'object' ? tatumResult.privateKey.privateKey : String(tatumResult.privateKey);

        // Create the deposit address
        const depositAddress = await DepositAddress.create({
          userId,
          chain,
          address: addressStr,
          privateKey: privateKeyStr,
          xpub: tatumResult.xpub ? String(tatumResult.xpub) : undefined,
          balance: 0,
          isActive: true,
          transactions: [],
          lastChecked: new Date()
        });

        console.log('Successfully created deposit address:', {
          id: depositAddress._id,
          chain,
          address: depositAddress.address
        });

        // Create activity log
        await ActivityLog.create({
          userId,
          username: userId,
          activityType: 'DEPOSIT_ADDRESS_CREATED',
          description: `Created ${chain} deposit address`,
          metadata: {
            chain,
            address: depositAddress.address
          }
        });

        // Return the saved address (without private key)
        return await DepositAddress.findById(depositAddress._id);
      } catch (error) {
        console.error('Failed to create deposit address:', error);
        if (error instanceof TatumError) {
          error.log();
        }
        throw error;
      }
    },
    updateDepositAddressBalance: async (_, { id, balance }) => {
      return await DepositAddress.findByIdAndUpdate(
        id,
        { 
          $set: { 
            balance,
            lastChecked: new Date()
          }
        },
        { new: true }
      );
    },
    addTransaction: async (_, { addressId, transaction }) => {
      return await DepositAddress.findByIdAndUpdate(
        addressId,
        {
          $push: { transactions: transaction },
          $set: { lastChecked: new Date() }
        },
        { new: true }
      );
    }
  }
};

module.exports = depositAddressResolvers; 