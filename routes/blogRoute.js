const express = require('express');
const router = express.Router();
const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  canManageBlog,
} = require('../controllers/blogController');
const { protect } = require('../middleWare/authMiddleware');
const { upload } = require('../utils/fileUpload');

router.get('/', getPosts);
router.get('/:id', getPost);

router.post('/', protect, canManageBlog, upload.single('coverImage'), createPost);
router.patch('/:id', protect, canManageBlog, upload.single('coverImage'), updatePost);
router.delete('/:id', protect, canManageBlog, deletePost);

module.exports = router;
