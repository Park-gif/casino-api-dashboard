const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    provider: {
        type: String,
        required: true,
        enum: ['tbs2', 'spingate']
    },
    gameId: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    type: String,
    category: String,
    subcategory: String,
    provider_name: String,
    image: String,
    image_square: String,
    image_portrait: String,
    image_long: String,
    mobile: {
        type: Boolean,
        default: true
    },
    new: {
        type: Boolean,
        default: false
    },
    id_hash: String,
    freerounds_supported: {
        type: Boolean,
        default: false
    },
    featurebuy_supported: {
        type: Boolean,
        default: false
    },
    has_jackpot: {
        type: Boolean,
        default: false
    },
    play_for_fun_supported: {
        type: Boolean,
        default: true
    },
    currency: {
        type: String,
        default: 'USD'
    },
    status: {
        type: String,
        enum: ['active', 'disabled'],
        default: 'active'
    },
    last_updated: {
        type: Date,
        default: Date.now
    },
    // TBS2-specific fields
    demo: {
        type: Boolean,
        default: false
    },
    exitButton: {
        type: Boolean,
        default: true
    },
    rewriterule: {
        type: Boolean,
        default: false
    },
    bm: {
        type: Boolean,
        default: false
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index for provider and gameId to ensure uniqueness
gameSchema.index({ provider: 1, gameId: 1 }, { unique: true });

module.exports = mongoose.model('Game', gameSchema); 