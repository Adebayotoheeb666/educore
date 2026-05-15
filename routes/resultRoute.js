const express = require('express');
const router = express.Router();
const { computeTermResults, getResults, approveResults, releaseResults, getParentResults, generateReportCard, generateBroadsheet } = require('../controllers/resultController');
const { protect } = require("../middleWare/authMiddleware");
const requireRole = require("../middleWare/requireRole");
const requireSchool = require("../middleWare/requireSchool");

router.use(protect, requireSchool);

router.post("/compute", requireRole(['principal','vp_academics']), computeTermResults);
router.get("/", getResults);
router.post("/:id/approve", requireRole(['principal']), approveResults);
router.post("/release", requireRole(['principal']), releaseResults);
router.get("/:studentId/report-card", generateReportCard);
router.get("/broadsheet/:classId", requireRole(['principal','vp_academics']), generateBroadsheet);
router.get("/parent/:studentId", requireRole(['parent','student']), getParentResults);

module.exports = router;
