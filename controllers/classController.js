const Class = require("../models/classModel");
const User = require("../models/userModel");

const createClass = async (req, res) => {
  try {
    const { name, arm, level, classTeacher } = req.body;
    if (!name || !level) {
      return res.status(400).json({ message: "Class name and level are required" });
    }
    const session = req.school.settings?.academicSession || new Date().getFullYear().toString();
    const newClass = await Class.create({
      school: req.school._id, name, arm: arm || undefined, level,
      classTeacher: classTeacher || undefined, session,
    });
    res.status(201).json(newClass);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getClasses = async (req, res) => {
  try {
    const classes = await Class.find({ school: req.school._id }).populate("classTeacher");
    res.status(200).json(classes);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getClass = async (req, res) => {
  try {
    const c = await Class.findOne({ _id: req.params.id, school: req.school._id })
      .populate("classTeacher students subjects");
    if (!c) return res.status(404).json({ message: "Class not found" });
    res.status(200).json(c);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateClass = async (req, res) => {
  try {
    const existing = await Class.findOne({ _id: req.params.id, school: req.school._id });
    if (!existing) return res.status(404).json({ message: "Class not found" });

    const ALLOWED = ['name', 'arm', 'level', 'classTeacher'];
    const update = {};
    ALLOWED.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });

    const updated = await Class.findByIdAndUpdate(existing._id, update, { new: true })
      .populate("classTeacher");
    res.status(200).json(updated);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteClass = async (req, res) => {
  try {
    const deleted = await Class.findOneAndDelete({ _id: req.params.id, school: req.school._id });
    if (!deleted) return res.status(404).json({ message: "Class not found" });
    await User.updateMany(
      { role: 'student', _id: { $in: deleted.students } },
      { $unset: { classId: '' } }
    );
    res.status(200).json({ message: "Class deleted" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getClassStudents = async (req, res) => {
  try {
    const c = await Class.findOne({ _id: req.params.id, school: req.school._id }).populate("students");
    if (!c) return res.status(404).json({ message: "Class not found" });
    res.status(200).json(c.students);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { createClass, getClasses, getClass, updateClass, deleteClass, getClassStudents };
