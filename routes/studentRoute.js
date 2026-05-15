const express = require('express');
const router = express.Router();
const { createStudent, bulkImportStudents, getStudents, getStudentById, updateStudent, deleteStudent, promoteStudents, getStudentAcademicHistory } = require('../controllers/studentController');
const { protect } = require("../middleWare/authMiddleware");
const requireRole = require("../middleWare/requireRole");
const requireSchool = require("../middleWare/requireSchool");
const { uploadMemory } = require("../utils/fileUpload");

router.use(protect, requireSchool);

router.post("/", requireRole(['principal','vp_admin','admin_staff','school_owner']), createStudent);
router.post("/bulk-import", requireRole(['principal','admin_staff','school_owner']), uploadMemory.single('file'), bulkImportStudents);
router.get("/", getStudents);
router.get("/:id", getStudentById);
router.patch("/:id", requireRole(['principal','admin_staff','school_owner','vp_admin']), updateStudent);
router.delete("/:id", requireRole(['principal','school_owner']), deleteStudent);
router.post("/promote", requireRole(['principal','vp_academics','school_owner']), promoteStudents);
router.get("/:id/history", getStudentAcademicHistory);

module.exports = router;
