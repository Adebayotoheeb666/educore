const express = require('express');
const router = express.Router();
const { generateLessonPlan, generateQuestions, gradeSubmission } = require('../controllers/aiController');
const { protect } = require("../middleWare/authMiddleware");
const requireRole = require("../middleWare/requireRole");
const requireSchool = require("../middleWare/requireSchool");

router.use(protect, requireSchool);
router.post("/lesson-plan", requireRole(['subject_teacher','class_teacher']), generateLessonPlan);
router.post("/generate-questions", requireRole(['subject_teacher','class_teacher']), generateQuestions);
router.post("/grade", requireRole(['subject_teacher','class_teacher']), gradeSubmission);

module.exports = router;
