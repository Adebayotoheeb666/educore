const School = require("../models/schoolModel");

const getSchool = async (req, res) => {
    try {
        const school = await School.findById(req.school._id);
        if (!school) {
            return res.status(404).json({ message: "School not found" });
        }
        res.status(200).json(school);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateSchool = async (req, res) => {
    try {
        const { name, address, phone, state, type, lga } = req.body;
        const school = await School.findByIdAndUpdate(
            req.school._id, 
            { name, address, phone, state, type, lga }, 
            { new: true, runValidators: true }
        );
        res.status(200).json(school);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateSettings = async (req, res) => {
    try {
        const { academicSession, currentTerm } = req.body;
        const school = await School.findById(req.school._id);
        if (academicSession) school.settings.academicSession = academicSession;
        if (currentTerm) school.settings.currentTerm = currentTerm;

        await school.save();
        res.status(200).json(school);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getSchoolStats = async (req, res) => {
    res.status(200).json({ studentCount: 0, teacherCount: 0 });
};

const getAllSchools = async (req, res) => {
    try {
        const schools = await School.find();
        res.status(200).json(schools);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateSubscription = async (req, res) => {
    try {
        const { status, plan, aiTokenBudget, usedAiTokens, expiresAt } = req.body;
        const school = await School.findByIdAndUpdate(req.params.id,
            { subscription: { status, plan, aiTokenBudget, usedAiTokens, expiresAt } },
            { new: true }
        );
        res.status(200).json(school);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    getSchool,
    updateSchool,
    updateSettings,
    getSchoolStats,
    getAllSchools,
    updateSubscription
};
