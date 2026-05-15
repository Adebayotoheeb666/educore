const express = require('express');
const router = express.Router();
const { markAttendance, getAttendanceByDate, getAttendanceSummary, getClassAttendanceReport, getStudentAttendance, notifyAbsentParents } = require('../controllers/attendanceController');
const { protect } = require("../middleWare/authMiddleware");
const requireRole = require("../middleWare/requireRole");
const requireSchool = require("../middleWare/requireSchool");

router.use(protect, requireSchool);

router.post("/", requireRole(['class_teacher','subject_teacher']), markAttendance);
router.get("/:classId", getAttendanceByDate);
router.get("/student/:id", getStudentAttendance);
router.get("/report/:classId", getClassAttendanceReport);
router.get("/summary", getAttendanceSummary);
router.post("/notify-absent", notifyAbsentParents);

module.exports = router;
