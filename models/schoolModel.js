const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            unique: true,
            sparse: true,
        },
        phone: {
            type: String,
        },
        state: {
            type: String,
        },
        type: {
            type: String,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        subDomain: {
            type: String,
            unique: true,
            sparse: true,
        },
        address: {
            type: String,
        },
        subscription: {
            status: {
                type: String,
                enum: ['active', 'inactive', 'trial'],
                default: 'trial',
            },
            plan: {
                type: String,
                default: 'basic',
            },
            aiTokenBudget: {
                type: Number,
                default: 100000,
            },
            usedAiTokens: {
                type: Number,
                default: 0,
            },
            expiresAt: {
                type: Date,
            },
            lastPaidAt: {
                type: Date,
            },
            billingCycle: {
                type: String,
                enum: ['monthly', 'yearly'],
            },
        },
        settings: {
            academicSession: {
                type: String,
                default: '2023/2024',
            },
            currentTerm: {
                type: String,
                enum: ['first', 'second', 'third'],
                default: 'first',
            },
        },
    },
    {
        timestamps: true,
    }
);

const School = mongoose.model('School', schoolSchema);
module.exports = School;
