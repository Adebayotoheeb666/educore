const express = require('express');
const router = express.Router();
const { syncOfflineData } = require('../controllers/syncController');
const { protect } = require("../middleWare/authMiddleware");
const requireSchool = require("../middleWare/requireSchool");

router.use(protect, requireSchool);
router.post("/", syncOfflineData);

module.exports = router;
