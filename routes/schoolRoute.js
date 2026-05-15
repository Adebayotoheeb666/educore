const express = require("express");
const router = express.Router();
const {
    getSchool,
    updateSchool,
    updateSettings,
    getSchoolStats,
    getAllSchools,
    updateSubscription
} = require("../controllers/schoolController");
const { protect } = require("../middleWare/authMiddleware");
const requireRole = require("../middleWare/requireRole");
const requireSchool = require("../middleWare/requireSchool");

router.get("/", protect, requireSchool, getSchool);
router.patch("/", protect, requireSchool, requireRole(['school_owner', 'principal']), updateSchool);
router.patch("/settings", protect, requireSchool, requireRole(['school_owner', 'principal']), updateSettings);
router.get("/stats", protect, requireSchool, getSchoolStats);
router.get("/admin/schools", protect, requireRole(['super_admin']), getAllSchools);
router.patch("/admin/schools/:id/subscription", protect, requireRole(['super_admin']), updateSubscription);

module.exports = router;
