const User = require("../models/userModel");

const TEACHER_ROLES = ['class_teacher', 'subject_teacher'];

const createTeacher = async (req, res) => {
  try {
    const { name, firstName, lastName, email, password, phone, role } = req.body;
    const fullName = name || `${firstName ?? ''} ${lastName ?? ''}`.trim();

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const teacherRole = TEACHER_ROLES.includes(role) ? role : 'subject_teacher';
    const teacher = await User.create({
      name: fullName,
      firstName: firstName || fullName.split(' ')[0],
      lastName: lastName || fullName.split(' ').slice(1).join(' '),
      email,
      password,
      phone: phone || undefined,
      role: teacherRole,
      schoolId: req.school._id,
    });

    res.status(201).json(teacher);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ schoolId: req.school._id, role: { $in: TEACHER_ROLES } });
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
    const existing = await User.findOne({ _id: req.params.id, schoolId: req.school._id });
    if (!existing) return res.status(404).json({ message: "Teacher not found" });

    const ALLOWED = ['firstName', 'lastName', 'name', 'phone', 'role', 'isActive'];
    const update = {};
    ALLOWED.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });

    if (update.role && !TEACHER_ROLES.includes(update.role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (update.firstName !== undefined || update.lastName !== undefined) {
      update.name = `${update.firstName ?? existing.firstName ?? ''} ${update.lastName ?? existing.lastName ?? ''}`.trim();
    }

    const teacher = await User.findByIdAndUpdate(existing._id, update, { new: true });
    res.status(200).json(teacher);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteTeacher = async (req, res) => {
  try {
    const teacher = await User.findOneAndDelete({ _id: req.params.id, schoolId: req.school._id });
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    res.status(200).json({ message: "Teacher deleted" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const assignSubjects = async (req, res) => { res.status(200).json({ message: "Subjects assigned" }); };
const getTeacherWorkload = async (req, res) => { res.status(200).json({ workload: [] }); };
const getTeacherPerformance = async (req, res) => { res.status(200).json({ performance: "Good" }); };

module.exports = { createTeacher, getTeachers, getTeacherById, updateTeacher, deleteTeacher, assignSubjects, getTeacherWorkload, getTeacherPerformance };
