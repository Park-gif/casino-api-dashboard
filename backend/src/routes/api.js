const express = require('express');
const router = express.Router();
const { authenticateApiKey } = require('../middleware/auth');
const axios = require('axios');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const crypto = require('crypto');
const { SPINGATE_API_URL, SPINGATE_CONFIG } = require('../config/spingate');
const gameService = require('../services/gameService');
const cachedGameService = require('../services/cachedGameService');
const SlotTransaction = require('../models/SlotTransaction');

// Spingate Player Creation endpoint
router.post('/v1/player/create', authenticateApiKey, async (req, res) => {
  try {
    const { username, secret } = req.body;

    if (!username || !secret) {
      return res.status(400).json({
        success: false,
        error: 'Username and secret are required'
      });
    }

    // Check if we have user information from API key authentication
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key or missing user information'
      });
    }

    // Format username as username_{currency}_{username}
    const formattedUsername = `${username}_${req.user.currency}_${req.user.username}`;

    console.log('Sending request to Spingate:', {
      url: SPINGATE_API_URL,
      method: 'createPlayer',
      username: formattedUsername,
      currency: req.user.currency
    });

    // Forward request to Spingate
    const response = await axios.post(SPINGATE_API_URL, {
      ...SPINGATE_CONFIG,
      method: 'createPlayer',
      user_username: formattedUsername,
      user_password: secret,
      currency: req.user.currency
    });

    console.log('Spingate response:', response.data);

    // Save player information to User model
    const user = await User.findById(req.user.id);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if player already exists
    const existingPlayer = user.players.find(p => p.username === username || p.formattedUsername === formattedUsername);
    if (!existingPlayer) {
      user.players.push({
        username,
        formattedUsername,
        currency: req.user.currency,
        createdAt: new Date(),
        lastLogin: null,
        status: 'active'
      });
      await user.save();
    }

    // Log the activity
    await ActivityLog.create({
      userId: req.user.id,
      username: req.user.username,
      activityType: 'PLAYER_CREATED',
      description: `Created player ${formattedUsername} on Spingate`,
      metadata: {
        originalUsername: username,
        formattedUsername,
        currency: req.user.currency,
        spingate_response: response.data
      }
    });

    // Return success response
    res.json({
      success: true,
      data: {
        ...response.data,
        player: {
          username,
          formattedUsername,
          currency: req.user.currency,
          createdAt: new Date(),
          status: 'active'
        }
      }
    });

  } catch (error) {
    console.error('Spingate player creation error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: JSON.parse(error.config?.data || '{}')
      }
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || error.message,
      details: error.response?.data || 'No additional details available',
      requestData: JSON.parse(error.config?.data || '{}')
    });
  }
});

// Get Game endpoint
router.post('/v1/game/launch', authenticateApiKey, async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    
    const {
      username,
      secret,
      gameid,
      homeurl,
      cashierurl,
      play_for_fun = 0,
      currency = 'USD',
      lang = 'en'
    } = req.body;

    console.log('Destructured values:', {
      username,
      secret,
      gameid,
      homeurl,
      cashierurl,
      play_for_fun,
      currency,
      lang
    });

    // Validate required fields
    if (!username || !secret || !gameid || !homeurl || !cashierurl) {
      console.log('Missing fields check:', {
        hasUsername: !!username,
        hasSecret: !!secret,
        hasGameId: !!gameid,
        hasHomeUrl: !!homeurl,
        hasCashierUrl: !!cashierurl
      });
      
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        details: 'username, secret, gameid, homeurl, and cashierurl are required'
      });
    }

    // Validate URLs are HTTPS
    if (!homeurl.startsWith('https://') || !cashierurl.startsWith('https://')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URLs',
        details: 'homeurl and cashierurl must use HTTPS protocol'
      });
    }

    // Format username as username_{currency}_{username}
    const formattedUsername = `${username}_${req.user.currency}_${req.user.username}`;

    // Forward request to Spingate
    const response = await axios.post(SPINGATE_API_URL, {
      ...SPINGATE_CONFIG,
      method: 'getGame',
      user_username: formattedUsername,
      user_password: secret,
      gameid,
      homeurl,
      cashierurl,
      play_for_fun,
      currency,
      lang
    });

    // Log the activity
    await ActivityLog.create({
      userId: req.user.id,
      username: req.user.username,
      activityType: 'GAME_LAUNCHED',
      description: `Launched game ${gameid} for player ${username}`,
      metadata: {
        gameid,
        username,
        play_for_fun,
        currency,
        spingateResponse: response.data
      }
    });

    // Return success response
    res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('Spingate game launch error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: JSON.parse(error.config?.data || '{}')
      }
    });
    
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || error.message,
      details: error.response?.data || 'No additional details available',
      requestData: JSON.parse(error.config?.data || '{}')
    });
  }
});

// Balance Callback endpoint
router.get('/slots/softswiss', async (req, res) => {
  try {
    console.log('Received balance callback:', req.query);

    const {
      username,
      currency,
      action,
      call_id,
      timestamp,
      key
    } = req.query;

    // Validate required fields
    if (!username || !currency || !action || !call_id || !timestamp || !key) {
      console.log('Missing required fields:', {
        hasUsername: !!username,
        hasCurrency: !!currency,
        hasAction: !!action,
        hasCallId: !!call_id,
        hasTimestamp: !!timestamp,
        hasKey: !!key
      });

      return res.json({
        error: 2,
        balance: 0
      });
    }

    // Validate action type
    if (!['balance', 'debit', 'credit'].includes(action)) {
      console.log('Invalid action type:', action);
      return res.json({
        error: 2,
        balance: 0
      });
    }

    // Get user and their callback URL
    const user = await User.findOne({
      'players.formattedUsername': username
    });
    if (!user || !user.callbackUrl) {
      console.log('User not found or callback URL not set:', username);
      return res.json({
        error: 2,
        balance: 0
      });
    }

    // Find the specific player from user's players array
    const player = user.players.find(p => p.formattedUsername === username);
    if (!player) {
      console.log('Player not found:', username);
      return res.json({
        error: 2,
        balance: 0
      });
    }

    console.log('Forwarding request to callback URL:', user.callbackUrl);

    // Forward request to user's callback URL with all original parameters
    const callbackResponse = await axios.get(user.callbackUrl, {
      params: req.query // Forward all received parameters
    });

    console.log('Callback response:', callbackResponse.data);

    // Validate response format
    if (!callbackResponse.data || typeof callbackResponse.data.error === 'undefined' || typeof callbackResponse.data.balance === 'undefined') {
      console.log('Invalid response format');
      return res.json({
        error: 2,
        balance: 0
      });
    }

    // Log the activity
    await ActivityLog.create({
      userId: user._id,
      username: user.username,
      activityType: 'BALANCE_CHECK',
      description: `Balance check for player ${username}`,
      metadata: {
        call_id,
        currency,
        response: callbackResponse.data,
        timestamp
      }
    });

    // Log transaction if it's a debit or credit action
    if (req.query.action === 'debit' || req.query.action === 'credit') {
      const amount = parseFloat(req.query.amount || '0');
      await SlotTransaction.create({
        playerId: user._id,
        username: player.username, // Original username without currency and email
        formattedUsername: player.formattedUsername, // Full formatted username
        operator: req.query.operator_id,
        roundId: req.query.round_id,
        gameId: req.query.game_id,
        type: req.query.type || 'spin',
        credit: req.query.action === 'credit' ? amount : null,
        debit: req.query.action === 'debit' ? amount : null,
        currency: req.query.currency,
        callId: req.query.call_id,
        sessionId: req.query.session_id,
        gameplayFinal: req.query.gameplay_final === '1',
        status: 'completed',
        metadata: {
          timestamp: req.query.timestamp,
          balanceBefore: callbackResponse.data.balance / 100, // Convert cents to dollars
          balanceAfter: callbackResponse.data.balance / 100
        }
      });
    }

    // Return response
    return res.json(callbackResponse.data);

  } catch (error) {
    console.error('Balance callback error:', error);
    if (error.response) {
      console.error('Callback error response:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    return res.json({
      error: 2,
      balance: 0
    });
  }
});

// Helper function to generate callback signature
function generateCallbackSignature(username, currency, action, call_id, timestamp) {
  const data = `${username}${currency}${action}${call_id}${timestamp}${SPINGATE_CONFIG.api_password}`;
  return crypto.createHash('md5').update(data).digest('hex');
}

// Get Game List endpoint
router.get('/v1/games', authenticateApiKey, async (req, res) => {
  try {
    // Get games from cache
    const games = await cachedGameService.getGames();

    // Log activity
    await ActivityLog.create({
      userId: req.user.id,
      username: req.user.username,
      activityType: 'BALANCE_CHECK',
      description: 'Fetched game list from cache',
      metadata: {
        total_games: games.length
      }
    });

    // Return success response with games
    res.json({
      success: true,
      data: games
    });

  } catch (error) {
    console.error('Game list fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch games list'
    });
  }
});

module.exports = router; 