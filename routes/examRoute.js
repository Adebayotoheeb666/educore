const express = require('express');
const router = express.Router();
const { createExam, getExams, publishExam, enterScores, getExamResults } = require('../controllers/examController');
const { protect } = require("../middleWare/authMiddleware");
const requireRole = require("../middleWare/requireRole");
const requireSchool = require("../middleWare/requireSchool");

router.use(protect, requireSchool);
router.post("/", requireRole(['subject_teacher','class_teacher','vp_academics']), createExam);
router.get("/", getExams);
router.patch("/:id/publish", requireRole(['principal','vp_academics']), publishExam);
router.post("/:id/scores", requireRole(['subject_teacher','class_teacher']), enterScores);
router.get("/:id/results", getExamResults);

module.exports = router;
