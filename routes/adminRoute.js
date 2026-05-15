const express = require('express');
const router = express.Router();
const {
  getPlatformDashboard,
  getAllSchools,
  getSchoolById,
  updateSchoolAdmin,
  getPlatformUsers,
  updatePlatformUser,
} = require('../controllers/adminController');
const { protect } = require('../middleWare/authMiddleware');
const requireRole = require('../middleWare/requireRole');

router.use(protect, requireRole(['super_admin']));

router.get('/dashboard', getPlatformDashboard);
router.get('/schools', getAllSchools);
router.get('/schools/:id', getSchoolById);
router.patch('/schools/:id', updateSchoolAdmin);
router.get('/users', getPlatformUsers);
router.patch('/users/:id', updatePlatformUser);

module.exports = router;
