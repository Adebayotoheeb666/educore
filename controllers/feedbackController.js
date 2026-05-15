const Feedback = require("../models/feedbackModel");

// @desc    Create new feedback
// @route   POST /api/feedback
// @access  Protected
const createFeedback = async (req, res) => {
    try {
        const { targetType, schoolId, category, subject, content, rating } = req.body;
        
        const feedback = await Feedback.create({
            sender: req.user._id,
            targetType,
            schoolId: targetType === 'school' ? schoolId : (req.user.schoolId || schoolId),
            category,
            subject,
            content,
            rating,
            status: 'pending'
        });

        res.status(201).json(feedback);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get feedbacks
// @route   GET /api/feedback
// @access  Protected
const getFeedbacks = async (req, res) => {
    try {
        let query = {};

        // Super Admin sees everything
        if (req.user.role === 'super_admin') {
            query = {};
        } else {
            // Schools see:
            // 1. Feedback they sent (sender = user)
            // 2. Feedback sent TO their school (targetType = school AND schoolId = user.schoolId)
            query = {
                $or: [
                    { sender: req.user._id },
                    { $and: [{ targetType: 'school' }, { schoolId: req.user.schoolId }] }
                ]
            };
        }

        const feedbacks = await Feedback.find(query)
            .populate('sender', 'name email role')
            .populate('schoolId', 'name')
            .populate('respondedBy', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json(feedbacks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single feedback
// @route   GET /api/feedback/:id
// @access  Protected
const getFeedbackById = async (req, res) => {
    try {
        const feedback = await Feedback.findById(req.params.id)
            .populate('sender', 'name email role')
            .populate('schoolId', 'name')
            .populate('respondedBy', 'name');

        if (!feedback) {
            return res.status(404).json({ message: "Feedback not found" });
        }

        // Permission check
        if (req.user.role !== 'super_admin' && 
            feedback.sender.toString() !== req.user._id.toString() && 
            !(feedback.targetType === 'school' && feedback.schoolId?.toString() === req.user.schoolId?.toString())) {
            return res.status(403).json({ message: "Not authorized to view this feedback" });
        }

        res.status(200).json(feedback);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update feedback (respond or change status)
// @route   PATCH /api/feedback/:id
// @access  Protected (Super Admin or School Admin)
const updateFeedback = async (req, res) => {
    try {
        const { status, response } = req.body;
        const feedback = await Feedback.findById(req.params.id);

        if (!feedback) {
            return res.status(404).json({ message: "Feedback not found" });
        }

        // Only super admin or the target (if school admin) can respond
        const isSuperAdmin = req.user.role === 'super_admin';
        const isTargetSchoolAdmin = feedback.targetType === 'school' && 
                                   feedback.schoolId?.toString() === req.user.schoolId?.toString() &&
                                   ['school_owner', 'principal'].includes(req.user.role);

        if (!isSuperAdmin && !isTargetSchoolAdmin) {
            return res.status(403).json({ message: "Not authorized to update this feedback" });
        }

        if (status) feedback.status = status;
        if (response) {
            feedback.response = response;
            feedback.responseDate = Date.now();
            feedback.respondedBy = req.user._id;
            if (feedback.status === 'pending') feedback.status = 'reviewed';
        }

        await feedback.save();
        res.status(200).json(feedback);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createFeedback,
    getFeedbacks,
    getFeedbackById,
    updateFeedback
};
