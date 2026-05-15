const User = require("../models/userModel");

const createParent = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });
    const parent = await User.create({ name, email, password, role: 'parent', phone, schoolId: req.school._id });
    res.status(201).json(parent);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getParents = async (req, res) => {
  try {
    const parents = await User.find({ schoolId: req.school._id, role: 'parent' }).populate('children');
    res.status(200).json(parents);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getParentById = async (req, res) => {
  try {
    const parent = await User.findOne({ _id: req.params.id, schoolId: req.school._id, role: 'parent' }).populate('children');
    if (!parent) return res.status(404).json({ message: "Parent not found" });
    res.status(200).json(parent);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateParent = async (req, res) => {
  try {
    const parent = await User.findOneAndUpdate({ _id: req.params.id, schoolId: req.school._id, role: 'parent' }, req.body, { new: true }).populate('children');
    res.status(200).json(parent);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteParent = async (req, res) => {
  try {
    await User.findOneAndDelete({ _id: req.params.id, schoolId: req.school._id, role: 'parent' });
    res.status(200).json({ message: "Parent deleted" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const assignChild = async (req, res) => {
  try {
    const { parentId, studentId } = req.body;
    const parent = await User.findOne({ _id: parentId, schoolId: req.school._id, role: 'parent' });
    const student = await User.findOne({ _id: studentId, schoolId: req.school._id, role: 'student' });
    if (!parent || !student) return res.status(404).json({ message: "Parent or student not found" });

    // Add to parent's children if not already
    if (!parent.children.includes(studentId)) {
      parent.children.push(studentId);
      await parent.save();
    }

    // Set student's parentId
    student.parentId = parentId;
    await student.save();

    res.status(200).json({ message: "Child assigned to parent" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getChildren = async (req, res) => {
  try {
    const parent = await User.findOne({ _id: req.params.id, schoolId: req.school._id, role: 'parent' }).populate('children');
    if (!parent) return res.status(404).json({ message: "Parent not found" });
    res.status(200).json(parent.children);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { createParent, getParents, getParentById, updateParent, deleteParent, assignChild, getChildren };