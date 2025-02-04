const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please add a username'],
        unique: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'agent', 'admin'],
        default: 'user'
    },
    balance: {
        type: Number,
        default: 1000,
        min: 0
    },
    currency: {
        type: String,
        enum: ['USD', 'EUR', 'TRY'],
        default: 'USD'
    },
    callbackUrl: {
        type: String,
        trim: true,
        default: '',
        validate: {
            validator: function(v) {
                if (!v) return true; // Allow empty string
                try {
                    new URL(v);
                    return true;
                } catch (err) {
                    return false;
                }
            },
            message: 'Please provide a valid URL'
        }
    },
    ggrPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    parentAgent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    agentSettings: {
        profitShare: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        }
    },
    billingCycle: {
        current: {
            type: Number,
            default: 0
        },
        limit: {
            type: Number,
            default: 10 // Default $10 limit
        },
        lastReset: {
            type: Date,
            default: Date.now
        }
    },
    status: {
        type: String,
        enum: ['active', 'suspended', 'blocked'],
        default: 'active'
    },
    lastLogin: {
        type: Date,
        default: null
    },
    tokenVersion: {
        type: Number,
        default: 0
    },
    refreshToken: {
        type: String,
        select: false
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    emailNotifications: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function(doc, ret) {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
            delete ret.password;
            return ret;
        }
    }
});

// Encrypt password
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match password
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Reset billing cycle if a month has passed
userSchema.methods.checkAndResetBillingCycle = async function() {
    const now = new Date();
    const lastReset = new Date(this.billingCycle.lastReset);
    const monthDiff = (now.getFullYear() - lastReset.getFullYear()) * 12 + now.getMonth() - lastReset.getMonth();
    
    if (monthDiff >= 1) {
        this.billingCycle.current = 0;
        this.billingCycle.lastReset = now;
        await this.save();
    }
};

// Update billing cycle
userSchema.methods.updateBillingCycle = async function(amount) {
    await this.checkAndResetBillingCycle();
    
    const newCurrent = this.billingCycle.current + Math.abs(amount);
    if (newCurrent > this.billingCycle.limit) {
        throw new Error('Billing cycle limit reached');
    }
    
    this.billingCycle.current = newCurrent;
    await this.save();
};

// Method to check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

// Method to update balance
userSchema.methods.updateBalance = async function(amount) {
    const newBalance = this.balance + amount;
    if (newBalance < 0) {
        throw new Error('Insufficient balance');
    }
    this.balance = newBalance;
    await this.save();
    return this.balance;
};

// Create password reset token
userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User; 