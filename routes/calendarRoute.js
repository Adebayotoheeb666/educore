const express = require('express');
const router = express.Router();
const { createEvent, getEvents, updateEvent, deleteEvent } = require('../controllers/calendarController');
const { protect } = require("../middleWare/authMiddleware");
const requireSchool = require("../middleWare/requireSchool");
const requireRole = require("../middleWare/requireRole");

router.use(protect, requireSchool);
router.post("/", requireRole(['principal','vp_admin']), createEvent);
router.get("/", getEvents);
router.patch("/:id", requireRole(['principal','vp_admin']), updateEvent);
router.delete("/:id", requireRole(['principal']), deleteEvent);

module.exports = router;
