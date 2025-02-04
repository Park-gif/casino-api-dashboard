const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const generateRefreshToken = () => {
    return crypto.randomBytes(40).toString('hex');
};

const generateAccessToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            balance: user.balance,
            tokenVersion: user.tokenVersion
        },
        process.env.JWT_SECRET,
        { expiresIn: '180d' }
    );
};

const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch (error) {
        return null;
    }
};

const authMiddleware = async (req) => {
    try {
        // Get token from header
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return { user: null };
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from token
        const user = await User.findById(decoded.id);
        if (!user) {
            return { user: null };
        }

        // Check token version
        if (user.tokenVersion !== decoded.tokenVersion) {
            return { user: null };
        }

        return { user };
    } catch (error) {
        return { user: null };
    }
};

module.exports = {
    generateRefreshToken,
    generateAccessToken,
    verifyToken,
    authMiddleware
}; 