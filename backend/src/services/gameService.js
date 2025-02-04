const axios = require('axios');
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
                    mobile: game.device === '2', // device: 2 means mobile compatible
                    status: 'active',
                    last_updated: new Date(),
                    // Additional TBS2-specific fields
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
        console.error('Error fetching TBS2 games:', error.message);
        throw error;
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

        // Debug logging
        console.log('Spingate Response Type:', typeof response.data);
        console.log('Response Keys:', Object.keys(response.data));
        
        // Check if response exists
        if (!response.data) {
            throw new Error('Invalid Spingate response: No data received');
        }

        // Check if response.data.response exists (common API pattern)
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

            console.log('Found Spingate games in response:', gamesList.length);
            
            const games = gamesList.map(game => ({
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

            return games;
        }

        console.error('Unexpected Spingate response structure:', 
            JSON.stringify(response.data, null, 2).substring(0, 1000) + '...');
        return [];

    } catch (error) {
        console.error('Error fetching Spingate games:', error.message);
        if (error.response) {
            console.error('API Error Response:', error.response.data);
        }
        return []; // Return empty array instead of throwing
    }
}

async function updateGames() {
    try {
        console.log('Starting game list update check...');

        // Check when games were last updated
        const lastUpdatedGame = await Game.findOne().sort({ last_updated: -1 });
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        if (lastUpdatedGame && lastUpdatedGame.last_updated > oneDayAgo) {
            console.log('Games were updated less than 24 hours ago. Next update scheduled for:', 
                new Date(lastUpdatedGame.last_updated.getTime() + 24 * 60 * 60 * 1000));
            return;
        }
        
        // Fetch games from both providers
        const [tbs2Games, spingateGames] = await Promise.all([
            fetchTBS2Games(),
            fetchSpingateGames()
        ]);

        const allGames = [...tbs2Games, ...spingateGames];
        const updateTime = new Date();

        // Update or insert games
        for (const game of allGames) {
            game.last_updated = updateTime; // Use same timestamp for all games in this update
            await Game.findOneAndUpdate(
                { provider: game.provider, gameId: game.gameId },
                game,
                { upsert: true, new: true }
            );
        }

        console.log(`Successfully updated games. Total: ${allGames.length}`);
        console.log(`TBS2: ${tbs2Games.length}, Spingate: ${spingateGames.length}`);
        console.log('Next update scheduled for:', new Date(updateTime.getTime() + 24 * 60 * 60 * 1000));

    } catch (error) {
        console.error('Error updating games:', error);
        throw error;
    }
}

// Function to start daily updates
function startDailyUpdates() {
    // Update immediately on start if needed
    updateGames().catch(console.error);

    // Schedule daily updates
    setInterval(() => {
        updateGames().catch(console.error);
    }, 6 * 60 * 60 * 1000); // Check every 6 hours, but update only if 24 hours have passed
}

module.exports = {
    updateGames,
    startDailyUpdates,
    fetchTBS2Games,
    fetchSpingateGames
}; 