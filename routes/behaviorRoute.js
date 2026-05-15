const express = require('express');
const router = express.Router();
const { logBehavior, getBehaviorLogs, updateBehaviorLog, deleteBehaviorLog } = require('../controllers/behaviorController');
const { protect } = require('../middleWare/authMiddleware');
const requireRole = require('../middleWare/requireRole');
const requireSchool = require('../middleWare/requireSchool');

router.use(protect, requireSchool);

router.post('/', requireRole(['class_teacher', 'subject_teacher', 'vp_academics', 'principal']), logBehavior);
router.get('/', requireRole(['class_teacher', 'vp_academics', 'principal', 'school_owner']), getBehaviorLogs);
router.patch('/:id', requireRole(['class_teacher', 'vp_academics', 'principal']), updateBehaviorLog);
router.delete('/:id', requireRole(['principal', 'vp_academics']), deleteBehaviorLog);

module.exports = router;
