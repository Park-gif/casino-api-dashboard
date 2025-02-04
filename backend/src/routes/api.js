const express = require('express');
const router = express.Router();
const { authenticateApiKey } = require('../middleware/auth');
const axios = require('axios');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const crypto = require('crypto');

const SPINGATE_CONFIG = {
  api_login: '0047cd0d-5a40-48a9-a6bc-cb8a615f0690-578867',
  api_password: 'tfonhVGglLFJ'
};

const SPINGATE_API_URL = 'https://gs.aggregtr.com/api/system/operator';

// Sample game list data
const games = [
  {
    id: "1",
    name: "Book of Ra",
    provider: "Novomatic",
    thumbnail: "https://example.com/book-of-ra.jpg",
    type: "Slot",
    status: "active"
  },
  {
    id: "2",
    name: "Starburst",
    provider: "NetEnt",
    thumbnail: "https://example.com/starburst.jpg",
    type: "Slot",
    status: "active"
  },
  {
    id: "3",
    name: "Gonzo's Quest",
    provider: "NetEnt",
    thumbnail: "https://example.com/gonzos-quest.jpg",
    type: "Slot",
    status: "active"
  }
];

// Game List endpoint
router.get('/v1/gamelist', authenticateApiKey, (req, res) => {
  try {
    res.json({
      success: true,
      games: games
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

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
        spingateResponse: response.data
      }
    });

    // Return success response
    res.json({
      success: true,
      data: response.data
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
router.get('/v1/callback/balance', async (req, res) => {
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
    if (action !== 'balance') {
      console.log('Invalid action type:', action);
      return res.json({
        error: 2,
        balance: 0
      });
    }

    // Format username to match our format: username_{currency}_{merchantusername}
    const [playerUsername, playerCurrency, merchantUsername] = username.split('_');
    if (!playerUsername || !playerCurrency || !merchantUsername) {
      console.log('Invalid username format:', username);
      return res.json({
        error: 2,
        balance: 0
      });
    }

    // Find merchant by username
    const merchant = await User.findOne({ username: merchantUsername });
    if (!merchant || !merchant.callbackUrl) {
      console.log('Merchant not found or callback URL not set:', merchantUsername);
      return res.json({
        error: 2,
        balance: 0
      });
    }

    // Forward request to merchant's callback URL
    console.log('Forwarding request to merchant callback:', merchant.callbackUrl);
    
    const callbackResponse = await axios.get(merchant.callbackUrl, {
      params: {
        username: playerUsername,
        currency,
        action,
        call_id,
        timestamp,
        key
      }
    });

    console.log('Merchant callback response:', callbackResponse.data);

    // Validate merchant response format
    if (!callbackResponse.data || typeof callbackResponse.data.error === 'undefined' || typeof callbackResponse.data.balance === 'undefined') {
      console.log('Invalid merchant response format');
      return res.json({
        error: 2,
        balance: 0
      });
    }

    // Log the activity
    await ActivityLog.create({
      userId: merchant.id,
      username: merchant.username,
      activityType: 'BALANCE_CHECK',
      description: `Balance check for player ${playerUsername}`,
      metadata: {
        call_id,
        currency,
        merchantResponse: callbackResponse.data,
        timestamp
      }
    });

    // Return merchant's response
    return res.json(callbackResponse.data);

  } catch (error) {
    console.error('Balance callback error:', error);
    if (error.response) {
      console.error('Merchant callback error response:', {
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

module.exports = router; 