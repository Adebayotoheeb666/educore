const express = require('express');
const router = express.Router();
const { createParent, getParents, getParentById, updateParent, deleteParent, assignChild, getChildren } = require('../controllers/parentController');
const { protect } = require("../middleWare/authMiddleware");
const requireRole = require("../middleWare/requireRole");
const requireSchool = require("../middleWare/requireSchool");

router.use(protect, requireSchool);

router.post("/", requireRole(['principal','vp_admin','admin_staff']), createParent);
router.get("/", getParents);
router.get("/:id", getParentById);
router.patch("/:id", requireRole(['principal','admin_staff']), updateParent);
router.delete("/:id", requireRole(['principal']), deleteParent);
router.post("/assign-child", requireRole(['principal','admin_staff']), assignChild);
router.get("/:id/children", getChildren);

module.exports = router;