const express = require('express');
const router = express.Router();
const { createTeacher, getTeachers, getTeacherById, updateTeacher, deleteTeacher, assignSubjects, getTeacherWorkload, getTeacherPerformance } = require('../controllers/teacherController');
const { protect } = require("../middleWare/authMiddleware");
const requireRole = require("../middleWare/requireRole");
const requireSchool = require("../middleWare/requireSchool");

router.use(protect, requireSchool);

router.post("/", requireRole(['principal','vp_admin']), createTeacher);
router.get("/", getTeachers);
router.get("/:id", getTeacherById);
router.patch("/:id", requireRole(['principal','vp_admin']), updateTeacher);
router.delete("/:id", requireRole(['principal']), deleteTeacher);
router.post("/:id/assign", requireRole(['principal','vp_academics']), assignSubjects);
router.get("/:id/workload", getTeacherWorkload);
router.get("/:id/performance", getTeacherPerformance);

module.exports = router;
