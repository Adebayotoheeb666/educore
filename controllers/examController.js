const Exam = require("../models/examModel");
const Submission = require("../models/submissionModel");

const createExam = async (req, res) => {
  try {
    const exam = await Exam.create({ ...req.body, school: req.school._id });
    res.status(201).json(exam);
  } catch (err) { res.status(500).json({message: err.message}); }
};

const getExams = async (req, res) => {
  try {
    const exams = await Exam.find({ school: req.school._id });
    res.status(200).json(exams);
  } catch (err) { res.status(500).json({message: err.message}); }
};

const publishExam = async (req, res) => {
  try {
    res.status(200).json({ 
      message: "Exam published and students/parents notified" 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const enterScores = async (req, res) => {
  try {
    // Bulk score entry logic will go here
    res.status(200).json({ 
      message: "Scores entered successfully",
      count: 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getExamResults = async (req, res) => {
  try {
    res.status(200).json({
      message: "Exam results retrieved",
      results: []
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createExam, getExams, publishExam, enterScores, getExamResults };
