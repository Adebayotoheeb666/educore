const express = require('express');
const router = express.Router();
const { createAnnouncement, getAnnouncements, deleteAnnouncement } = require('../controllers/announcementController');
const { protect } = require("../middleWare/authMiddleware");
const requireSchool = require("../middleWare/requireSchool");
const requireRole = require("../middleWare/requireRole");

router.use(protect, requireSchool);
router.post("/", requireRole(['principal','vp_admin']), createAnnouncement);
router.get("/", getAnnouncements);
router.delete("/:id", requireRole(['principal']), deleteAnnouncement);

module.exports = router;
