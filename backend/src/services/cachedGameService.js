const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const { SPINGATE_API_URL, SPINGATE_CONFIG } = require('../config/spingate');

const GAMES_FILE_PATH = path.join(__dirname, '../data/games.json');
const UPDATE_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

class CachedGameService {
    constructor() {
        this.updateGames();
        setInterval(() => this.updateGames(), UPDATE_INTERVAL);
    }

    async updateGames() {
        try {
            const response = await axios.post(SPINGATE_API_URL, {
                ...SPINGATE_CONFIG,
                method: 'getGameList',
                show_additional: true,
                show_systems: 0,
                list_type: 1,
                currency: 'USD'
            });

            if (response.data && response.data.error === 0 && response.data.response) {
                const gamesData = {
                    lastUpdated: new Date().toISOString(),
                    games: response.data.response
                };

                await fs.mkdir(path.dirname(GAMES_FILE_PATH), { recursive: true });
                await fs.writeFile(GAMES_FILE_PATH, JSON.stringify(gamesData, null, 2), { flag: 'w' });
            }
        } catch (error) {
            // Silent fail
        }
    }

    async getGames() {
        try {
            const data = await fs.readFile(GAMES_FILE_PATH, 'utf8');
            const gamesData = JSON.parse(data);
            return gamesData.games || [];
        } catch (error) {
            return [];
        }
    }
}

module.exports = new CachedGameService(); 
