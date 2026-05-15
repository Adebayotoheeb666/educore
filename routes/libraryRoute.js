const express = require('express');
const router = express.Router();
const { addBook, getBooks, borrowBook, returnBook, getOverdueBooks, getActiveBorrows } = require('../controllers/libraryController');
const { protect } = require("../middleWare/authMiddleware");
const requireSchool = require("../middleWare/requireSchool");
const requireRole = require("../middleWare/requireRole");

router.use(protect, requireSchool);
router.post("/", requireRole(['admin_staff','principal']), addBook);
router.get("/", getBooks);
router.post("/borrow", borrowBook);
router.post("/return/:id", returnBook);
router.get("/overdue", requireRole(['admin_staff','principal']), getOverdueBooks);
router.get("/borrows", getActiveBorrows);

module.exports = router;
