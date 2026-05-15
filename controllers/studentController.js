const User = require("../models/userModel");
const Class = require("../models/classModel");

const createStudent = async (req, res) => {
  try {
    const { firstName, lastName, email, dob, gender, classId, parentPhone, parentEmail, parentId } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ message: "First name, last name, and email are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    // Auto-generate admission number: SC-YYYY-XXXX
    const year = new Date().getFullYear();
    const count = await User.countDocuments({ schoolId: req.school._id, role: 'student' });
    const admissionNo = `SC-${year}-${String(count + 1).padStart(4, '0')}`;

    // Default password the admin can share with the student/parent
    const defaultPassword = `EduCore@${year}`;

    const student = await User.create({
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      email,
      password: defaultPassword,
      role: 'student',
      schoolId: req.school._id,
      admissionNo,
      dob: dob || undefined,
      gender: gender || undefined,
      parentPhone: parentPhone || undefined,
      parentId: parentId || undefined,
    });

    if (classId) await Class.findByIdAndUpdate(classId, { $addToSet: { students: student._id } });
    if (parentId) await User.findByIdAndUpdate(parentId, { $addToSet: { children: student._id } });

    res.status(201).json({ student, defaultPassword, admissionNo });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const bulkImportStudents = async (req, res) => {
  res.status(200).json({ message: "Bulk import successful (stub)" });
};

const getStudents = async (req, res) => {
  try {
    const students = await User.find({ schoolId: req.school._id, role: 'student' });
    res.status(200).json(students);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getStudentById = async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, schoolId: req.school._id, role: 'student' });
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.status(200).json(student);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateStudent = async (req, res) => {
  try {
    const existing = await User.findOne({ _id: req.params.id, schoolId: req.school._id, role: 'student' });
    if (!existing) return res.status(404).json({ message: 'Student not found' });

    const ALLOWED = ['firstName', 'lastName', 'dob', 'gender', 'parentPhone', 'isActive', 'classId'];
    const update = {};
    ALLOWED.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });

    if (update.firstName !== undefined || update.lastName !== undefined) {
      update.name = `${update.firstName ?? existing.firstName ?? ''} ${update.lastName ?? existing.lastName ?? ''}`.trim();
    }

    const classId = update.classId;
    delete update.classId;
    if (classId) {
      await Class.updateMany({ students: existing._id }, { $pull: { students: existing._id } });
      await Class.findByIdAndUpdate(classId, { $addToSet: { students: existing._id } });
    }

    const student = await User.findByIdAndUpdate(existing._id, update, { new: true });
    res.status(200).json(student);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteStudent = async (req, res) => {
  try {
    const student = await User.findOneAndDelete({ _id: req.params.id, schoolId: req.school._id, role: 'student' });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    await Class.updateMany({ students: student._id }, { $pull: { students: student._id } });
    await User.updateMany({ role: 'parent', children: student._id }, { $pull: { children: student._id } });
    res.status(200).json({ message: 'Student deleted' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const promoteStudents = async (req, res) => {
  res.status(200).json({ message: "Students promoted" });
};

const getStudentAcademicHistory = async (req, res) => {
  res.status(200).json([]);
};

module.exports = { createStudent, bulkImportStudents, getStudents, getStudentById, updateStudent, deleteStudent, promoteStudents, getStudentAcademicHistory };
