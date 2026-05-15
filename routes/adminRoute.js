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
const {
  getAdminPosts,
  getAdminPost,
  createPost,
  updatePost,
  deletePost,
} = require('../controllers/blogController');
const { protect } = require('../middleWare/authMiddleware');
const requireRole = require('../middleWare/requireRole');
const { upload } = require('../utils/fileUpload');
const { getPlatformTransactions } = require('../controllers/paymentController');

router.use(protect, requireRole(['super_admin']));

router.get('/dashboard', getPlatformDashboard);
router.get('/schools', getAllSchools);
router.get('/schools/:id', getSchoolById);
router.patch('/schools/:id', updateSchoolAdmin);
router.get('/users', getPlatformUsers);
router.patch('/users/:id', updatePlatformUser);

router.get('/blog', getAdminPosts);
router.get('/blog/:id', getAdminPost);
router.post('/blog', upload.single('coverImage'), createPost);
router.patch('/blog/:id', upload.single('coverImage'), updatePost);
router.delete('/blog/:id', deletePost);

router.get('/payments/transactions', getPlatformTransactions);

module.exports = router;
