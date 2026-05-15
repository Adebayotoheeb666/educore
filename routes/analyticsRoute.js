const express = require('express');
const router = express.Router();
const {
  getSchoolDashboard, getStudentDashboard, getParentDashboard, getTeacherDashboard,
  getSubjectPerformance, getAttendanceAnalytics, getFeeAnalytics,
  getTeacherEffectiveness, generateEMISReport, generateNEMISReport,
  getStudentProgressReport, getStudentResults
} = require('../controllers/analyticsController');
const { protect } = require("../middleWare/authMiddleware");
const requireRole = require("../middleWare/requireRole");
const requireSchool = require("../middleWare/requireSchool");

router.use(protect, requireSchool);
router.get("/dashboard", requireRole(['principal','school_owner','super_admin']), getSchoolDashboard);
router.get("/student-dashboard", requireRole(['student']), getStudentDashboard);
router.get("/parent-dashboard", requireRole(['parent']), getParentDashboard);
router.get("/teacher-dashboard", requireRole(['class_teacher','subject_teacher']), getTeacherDashboard);
router.get("/subject-performance", getSubjectPerformance);
router.get("/attendance", getAttendanceAnalytics);
router.get("/fees", requireRole(['principal','bursar']), getFeeAnalytics);
router.get("/teacher-effectiveness", requireRole(['principal','vp_academics']), getTeacherEffectiveness);
router.get("/emis", requireRole(['principal','school_owner']), generateEMISReport);
router.get("/nemis", requireRole(['principal','school_owner']), generateNEMISReport);
router.get("/student-progress/:id", getStudentProgressReport);
router.get("/student-results/:id", getStudentResults);

module.exports = router;
