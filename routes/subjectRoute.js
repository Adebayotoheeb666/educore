const express = require('express');
const router = express.Router();
const { createSubject, getSubjects, getSubject, updateSubject, deleteSubject, assignTeacher } = require('../controllers/subjectController');
const { protect } = require("../middleWare/authMiddleware");
const requireSchool = require("../middleWare/requireSchool");

router.use(protect, requireSchool);
router.post("/", createSubject);
router.get("/", getSubjects);
router.get("/:id", getSubject);
router.patch("/:id", updateSubject);
router.delete("/:id", deleteSubject);
router.post("/:id/assign", assignTeacher);

module.exports = router;
