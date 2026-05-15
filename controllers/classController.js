const Class = require("../models/classModel");

const createClass = async (req, res) => {
  try {
    const { name, arm, level, classTeacher } = req.body;
    const newClass = await Class.create({
      school: req.school._id, name, arm, level, classTeacher, session: req.school.settings.academicSession
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
    const c = await Class.findOne({ _id: req.params.id, school: req.school._id }).populate("classTeacher students subjects");
    if (!c) return res.status(404).json({ message: "Class not found" });
    res.status(200).json(c);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateClass = async (req, res) => {
  try {
    const updated = await Class.findOneAndUpdate({ _id: req.params.id, school: req.school._id }, req.body, { new: true });
    res.status(200).json(updated);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteClass = async (req, res) => {
  try {
    await Class.findOneAndDelete({ _id: req.params.id, school: req.school._id });
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
