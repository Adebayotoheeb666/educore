const LibraryBook = require('../models/libraryBookModel');
const BookBorrow  = require('../models/bookBorrowModel');

const addBook = async (req, res) => {
  try {
    const { title, author, isbn, subject, classLevel, quantity } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const qty = quantity || 1;
    const book = await LibraryBook.create({
      school: req.school._id,
      title,
      author,
      isbn,
      subject,
      classLevel,
      quantity: qty,
      available: qty,
    });
    res.status(201).json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getBooks = async (req, res) => {
  try {
    const { search, subject, available } = req.query;
    const filter = { school: req.school._id };

    if (search) filter.title = { $regex: search, $options: 'i' };
    if (subject) filter.subject = subject;
    if (available === 'true') filter.available = { $gt: 0 };

    const books = await LibraryBook.find(filter)
      .populate('subject', 'name')
      .sort({ title: 1 });
    res.status(200).json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const borrowBook = async (req, res) => {
  try {
    const { bookId, studentId, dueDate } = req.body;
    if (!bookId || !studentId || !dueDate) {
      return res.status(400).json({ message: 'bookId, studentId, and dueDate are required' });
    }

    const book = await LibraryBook.findOne({ _id: bookId, school: req.school._id });
    if (!book) return res.status(404).json({ message: 'Book not found' });
    if (book.available < 1) return res.status(400).json({ message: 'No copies available' });

    // Check if student already has this book borrowed
    const existing = await BookBorrow.findOne({
      school: req.school._id,
      book: bookId,
      borrowedBy: studentId,
      status: 'borrowed',
    });
    if (existing) return res.status(400).json({ message: 'Student already has this book borrowed' });

    const borrow = await BookBorrow.create({
      school: req.school._id,
      book: bookId,
      borrowedBy: studentId,
      dueDate,
      status: 'borrowed',
    });

    book.available -= 1;
    await book.save();

    await borrow.populate([
      { path: 'book', select: 'title author isbn' },
      { path: 'borrowedBy', select: 'name email' },
    ]);
    res.status(201).json(borrow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const returnBook = async (req, res) => {
  try {
    const borrow = await BookBorrow.findOne({
      _id: req.params.id,
      school: req.school._id,
      status: 'borrowed',
    });
    if (!borrow) return res.status(404).json({ message: 'Active borrow record not found' });

    borrow.status = 'returned';
    borrow.returnedAt = new Date();
    await borrow.save();

    await LibraryBook.findByIdAndUpdate(borrow.book, { $inc: { available: 1 } });

    res.status(200).json({ message: 'Book returned successfully', borrow });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getOverdueBooks = async (req, res) => {
  try {
    // Mark overdue in DB first
    await BookBorrow.updateMany(
      { school: req.school._id, status: 'borrowed', dueDate: { $lt: new Date() } },
      { $set: { status: 'overdue' } }
    );

    const overdue = await BookBorrow.find({ school: req.school._id, status: 'overdue' })
      .populate('book', 'title author isbn')
      .populate('borrowedBy', 'name email phone')
      .sort({ dueDate: 1 });

    res.status(200).json(overdue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/library/borrows — active borrows (used by BorrowReturn page)
const getActiveBorrows = async (req, res) => {
  try {
    const borrows = await BookBorrow.find({
      school: req.school._id,
      status: { $in: ['borrowed', 'overdue'] },
    })
      .populate('book', 'title author')
      .populate('borrowedBy', 'name email')
      .sort({ borrowedAt: -1 });
    res.status(200).json(borrows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { addBook, getBooks, borrowBook, returnBook, getOverdueBooks, getActiveBorrows };
