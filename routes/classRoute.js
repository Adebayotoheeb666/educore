const express = require('express');
const router = express.Router();
const { createClass, getClasses, getClass, updateClass, deleteClass, getClassStudents } = require('../controllers/classController');
const { protect } = require("../middleWare/authMiddleware");
const requireSchool = require("../middleWare/requireSchool");

router.use(protect, requireSchool);

router.post("/", createClass);
router.get("/", getClasses);
router.get("/:id", getClass);
router.patch("/:id", updateClass);
router.delete("/:id", deleteClass);
router.get("/:id/students", getClassStudents);

module.exports = router;
