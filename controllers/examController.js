const Exam = require("../models/examModel");
const Submission = require("../models/submissionModel");

const createExam = async (req, res) => {
  try {
    const exam = await Exam.create({ ...req.body, school: req.school._id });
    res.status(201).json(exam);
  } catch (err) { res.status(500).json({message: err.message}); }
};

const getExam = async (req, res) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, school: req.school._id })
      .populate('subject', 'name code')
      .populate('class', 'name arm');
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.status(200).json(exam);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getExams = async (req, res) => {
  try {
    const exams = await Exam.find({ school: req.school._id })
      .populate('subject', 'name code')
      .populate('class', 'name arm')
      .sort({ scheduledDate: -1 });
    res.status(200).json(exams);
  } catch (err) { res.status(500).json({message: err.message}); }
};

const publishExam = async (req, res) => {
  try {
    const exam = await Exam.findOneAndUpdate(
      { _id: req.params.id, school: req.school._id },
      { status: 'published' },
      { new: true }
    );
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.status(200).json(exam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const enterScores = async (req, res) => {
  try {
    const { scores } = req.body;
    if (!Array.isArray(scores)) return res.status(400).json({ message: 'scores array required' });
    const exam = await Exam.findOne({ _id: req.params.id, school: req.school._id });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    let count = 0;
    for (const row of scores) {
      if (!row.student) continue;
      await Submission.findOneAndUpdate(
        { exam: exam._id, student: row.student, school: req.school._id },
        { totalScore: row.score, status: 'graded' },
        { upsert: true, new: true }
      );
      count += 1;
    }
    res.status(200).json({ message: 'Scores entered successfully', count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getExamResults = async (req, res) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, school: req.school._id });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const submissions = await Submission.find({ exam: exam._id, school: req.school._id })
      .populate('student', 'firstName lastName name admissionNo')
      .sort({ totalScore: -1 });

    res.status(200).json({
      exam,
      results: submissions.map((s) => ({
        student: s.student,
        totalScore: s.totalScore,
        grade: s.grade,
        status: s.status,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createExam, getExam, getExams, publishExam, enterScores, getExamResults };
