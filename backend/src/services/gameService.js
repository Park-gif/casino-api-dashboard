const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const Game = require('../models/Game');

const TBS2_API_URL = 'https://tbs2api.lvslot.net/API/';
const SPINGATE_API_URL = 'https://gs.aggregtr.com/api/system/operator';

const TBS2_CONFIG = {
    hall: '3206344',
    key: '123456'
};

const SPINGATE_CONFIG = {
    api_login: '0047cd0d-5a40-48a9-a6bc-cb8a615f0690-578867',
    api_password: 'tfonhVGglLFJ'
};

const GAMES_FILE_PATH = path.join(__dirname, '../data/games.json');
const UPDATE_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

let isInitialFetchDone = false;

async function shouldUpdateGames() {
  try {
    if (isInitialFetchDone) {
      const lastGame = await Game.findOne().sort({ updatedAt: -1 });
      if (!lastGame) return true;
      const timeSinceLastUpdate = Date.now() - lastGame.updatedAt.getTime();
      return timeSinceLastUpdate >= UPDATE_INTERVAL;
    }

    const gamesCount = await Game.countDocuments();
    if (gamesCount === 0) return true;

    const lastGame = await Game.findOne().sort({ updatedAt: -1 });
    if (!lastGame) return true;

    const timeSinceLastUpdate = Date.now() - lastGame.updatedAt.getTime();
    return timeSinceLastUpdate >= UPDATE_INTERVAL;
  } catch (error) {
    return false;
  }
}

async function fetchAndSaveGames(silent = true) {
  try {
    const shouldUpdate = await shouldUpdateGames();
    if (!shouldUpdate) return;

    // Fetch games from both providers
    const [tbs2Games, spingateGames] = await Promise.all([
      fetchTBS2Games(),
      fetchSpingateGames()
    ]);

    const allGames = [...tbs2Games, ...spingateGames];

    // Save to games.json for caching
    await fs.writeFile(GAMES_FILE_PATH, JSON.stringify({ games: allGames }, null, 2), { flag: 'w' });

    // Prepare bulk operations
    const operations = allGames.map(game => ({
      updateOne: {
        filter: { provider: game.provider, gameId: game.gameId },
        update: { 
          $set: {
            ...game,
            updatedAt: new Date()
          }
        },
        upsert: true
      }
    }));

    if (operations.length > 0) {
      await Game.bulkWrite(operations, { ordered: false });
    }

    isInitialFetchDone = true;

    if (!silent) {
      console.log(`Successfully updated ${operations.length} games`);
    }
  } catch (error) {
    console.error('Error updating games:', error);
    if (!silent) {
      console.error('Game update failed:', error.message);
    }
  }
}

async function fetchTBS2Games() {
    try {
        const response = await axios.post(TBS2_API_URL, {
            ...TBS2_CONFIG,
            cmd: 'getGamesList',
            img: 'game_img_2'
        });

        if (!response.data || !response.data.content) {
            throw new Error('Invalid TBS2 response format');
        }

        const selectedProviders = [
            'rubyplay', 'pragmatic', 'novomatic', 'apollo',
            'playngo', 'scientific_games', 'kajot', 'microgaming',
            'ainsworth', 'quickspin', 'habanero', 'apex',
            'merkur', 'wazdan', 'igt', 'roulette', 'bingo', 'keno', 'egt', 'booming'
        ];

        const games = [];
        for (const provider of selectedProviders) {
            if (response.data.content[provider]) {
                const providerGames = response.data.content[provider].map(game => ({
                    provider: 'tbs2',
                    gameId: game.id.toString(),
                    name: game.name,
                    type: game.categories || 'slots',
                    category: provider,
                    provider_name: game.title || provider,
                    image: game.img || '',
                    mobile: game.device === '2',
                    status: 'active',
                    last_updated: new Date(),
                    demo: game.demo === '1',
                    exitButton: game.exitButton === '1',
                    rewriterule: game.rewriterule === '1',
                    bm: game.bm === '1'
                }));
                games.push(...providerGames);
            }
        }
        return games;
    } catch (error) {
        return [];
    }
}

async function fetchSpingateGames() {
    try {
        const response = await axios.post(SPINGATE_API_URL, {
            ...SPINGATE_CONFIG,
            method: 'getGameList',
            show_additional: true,
            show_systems: 0,
            list_type: 1,
            currency: 'USD'
        });

        if (!response.data) return [];

        if (response.data.response && typeof response.data.response === 'object') {
            const gamesList = Object.entries(response.data.response)
                .filter(([key, game]) => 
                    !isNaN(key) && 
                    game && 
                    typeof game === 'object' &&
                    game.id &&
                    game.name
                )
                .map(([_, game]) => game);
            
            return gamesList.map(game => ({
                provider: 'spingate',
                gameId: game.id.toString(),
                name: game.name,
                type: game.type || 'video-slots',
                category: game.category || 'spingate',
                subcategory: game.subcategory || '',
                mobile: game.mobile !== false,
                new: game.new || false,
                id_hash: game.id_hash || '',
                freerounds_supported: game.freerounds_supported || false,
                featurebuy_supported: game.featurebuy_supported || false,
                has_jackpot: game.has_jackpot || false,
                play_for_fun_supported: game.play_for_fun_supported || false,
                image: game.image || '',
                image_square: game.image_square || game.image || '',
                image_portrait: game.image_portrait || '',
                image_long: game.image_long || '',
                currency: game.currency || 'USD',
                status: 'active',
                last_updated: new Date()
            }));
        }
        return [];
    } catch (error) {
        return [];
    }
}

async function startDailyUpdates() {
  try {
    await fetchAndSaveGames(true);
    setInterval(() => fetchAndSaveGames(true), UPDATE_INTERVAL);
  } catch (error) {
    // Silent fail
  }
}

module.exports = {
  fetchAndSaveGames,
  startDailyUpdates,
  fetchTBS2Games,
  fetchSpingateGames
}; 