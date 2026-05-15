const User = require("../models/userModel");

const createTeacher = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });
    const teacherRole = role || 'subject_teacher';
    const teacher = await User.create({ name, email, password, role: teacherRole, phone, schoolId: req.school._id });
    res.status(201).json(teacher);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ schoolId: req.school._id, role: { $in: ['class_teacher', 'subject_teacher'] } });
    res.status(200).json(teachers);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getTeacherById = async (req, res) => {
  try {
    const teacher = await User.findOne({ _id: req.params.id, schoolId: req.school._id });
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    res.status(200).json(teacher);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateTeacher = async (req, res) => {
  try {
    const teacher = await User.findOneAndUpdate({ _id: req.params.id, schoolId: req.school._id }, req.body, { new: true });
    res.status(200).json(teacher);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteTeacher = async (req, res) => {
  try {
    await User.findOneAndDelete({ _id: req.params.id, schoolId: req.school._id });
    res.status(200).json({ message: "Teacher deleted" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const assignSubjects = async (req, res) => { res.status(200).json({ message: "Subjects assigned" }); };
const getTeacherWorkload = async (req, res) => { res.status(200).json({ workload: [] }); };
const getTeacherPerformance = async (req, res) => { res.status(200).json({ performance: "Good" }); };

module.exports = { createTeacher, getTeachers, getTeacherById, updateTeacher, deleteTeacher, assignSubjects, getTeacherWorkload, getTeacherPerformance };
