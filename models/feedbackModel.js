const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        targetType: {
            type: String,
            enum: ['platform', 'school'],
            required: true,
            comment: 'platform = feedback to super admin, school = feedback to a specific school',
        },
        schoolId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'School',
            required: function () {
                return this.targetType === 'school' || (this.senderRole && this.senderRole !== 'super_admin');
            },
        },
        category: {
            type: String,
            enum: ['bug', 'feature_request', 'complaint', 'suggestion', 'kudos', 'general'],
            default: 'general',
        },
        subject: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
        },
        status: {
            type: String,
            enum: ['pending', 'reviewed', 'resolved'],
            default: 'pending',
        },
        response: {
            type: String,
        },
        responseDate: {
            type: Date,
        },
        respondedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

const Feedback = mongoose.model('Feedback', feedbackSchema);
module.exports = Feedback;
