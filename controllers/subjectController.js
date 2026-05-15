const Subject = require("../models/subjectModel");

const TEACHER_FIELDS = "name email";

const createSubject = async (req, res) => {
  try {
    const { name, code, nerdcCode, category } = req.body;
    const subject = await Subject.create({
      school: req.school._id, name, code, nerdcCode, category
    });
    res.status(201).json(subject);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ school: req.school._id }).populate("teachers", TEACHER_FIELDS);
    res.status(200).json(subjects);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getSubject = async (req, res) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, school: req.school._id }).populate("teachers", TEACHER_FIELDS);
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    res.status(200).json(subject);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateSubject = async (req, res) => {
  try {
    const { school, _id, ...updates } = req.body;
    const updated = await Subject.findOneAndUpdate(
      { _id: req.params.id, school: req.school._id },
      updates,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: "Subject not found" });
    res.status(200).json(updated);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteSubject = async (req, res) => {
  try {
    const deleted = await Subject.findOneAndDelete({ _id: req.params.id, school: req.school._id });
    if (!deleted) return res.status(404).json({ message: "Subject not found" });
    res.status(200).json({ message: "Subject deleted" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const assignTeacher = async (req, res) => {
  try {
    const { teacherId } = req.body;
    if (!teacherId) return res.status(400).json({ message: "teacherId is required" });
    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, school: req.school._id },
      { $addToSet: { teachers: teacherId } },
      { new: true }
    ).populate("teachers", TEACHER_FIELDS);
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    res.status(200).json(subject);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const unassignTeacher = async (req, res) => {
  try {
    const { teacherId } = req.body;
    if (!teacherId) return res.status(400).json({ message: "teacherId is required" });
    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, school: req.school._id },
      { $pull: { teachers: teacherId } },
      { new: true }
    ).populate("teachers", TEACHER_FIELDS);
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    res.status(200).json(subject);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { createSubject, getSubjects, getSubject, updateSubject, deleteSubject, assignTeacher, unassignTeacher };
