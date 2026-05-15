const express = require('express');
const router = express.Router();
const { getTimetable, generateAITimetable, updateTimetableSlot, publishTimetable, deleteTimetable } = require('../controllers/timetableController');
const { protect } = require('../middleWare/authMiddleware');
const requireRole = require('../middleWare/requireRole');
const requireSchool = require('../middleWare/requireSchool');

router.use(protect, requireSchool);

router.get('/', getTimetable);
router.post('/generate', requireRole(['principal', 'vp_academics', 'school_owner']), generateAITimetable);
router.patch('/:id/slot', requireRole(['principal', 'vp_academics', 'class_teacher']), updateTimetableSlot);
router.patch('/:id/publish', requireRole(['principal', 'vp_academics']), publishTimetable);
router.delete('/:id', requireRole(['principal']), deleteTimetable);

module.exports = router;
