const XLSX = require('xlsx');
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
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    const year = new Date().getFullYear();
    let successful = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;
      const fullName = String(row.FULL_NAME || row.full_name || row.Name || '').trim();
      const parts = fullName.split(/\s+/).filter(Boolean);
      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ') || parts[0];
      const email = String(row.EMAIL || row.email || `${(row.STUDENT_ID || row.student_id || `row${rowNum}`).toString().toLowerCase()}@import.local`).trim();
      const parentPhone = String(row.PARENT_PHONE || row.parent_phone || '').trim();
      const gender = String(row.GENDER || row.gender || '').trim();
      const classLabel = String(row.CLASS_GRADE || row.class_grade || row.Class || '').trim();

      if (!firstName) {
        errors.push({ row: rowNum, message: 'FULL_NAME is required' });
        continue;
      }

      const existing = await User.findOne({ email });
      if (existing) {
        errors.push({ row: rowNum, message: `Email already exists: ${email}` });
        continue;
      }

      let classDoc = null;
      if (classLabel) {
        classDoc = await Class.findOne({
          school: req.school._id,
          name: new RegExp(`^${classLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
        });
        if (!classDoc) {
          errors.push({ row: rowNum, message: `Class not found: ${classLabel}` });
          continue;
        }
      }

      const count = await User.countDocuments({ schoolId: req.school._id, role: 'student' });
      const admissionNo = String(row.STUDENT_ID || row.student_id || `SC-${year}-${String(count + 1).padStart(4, '0')}`).trim();
      const defaultPassword = `EduCore@${year}`;

      const student = await User.create({
        name: fullName || `${firstName} ${lastName}`,
        firstName,
        lastName,
        email,
        password: defaultPassword,
        role: 'student',
        schoolId: req.school._id,
        admissionNo,
        gender: gender || undefined,
        parentPhone: parentPhone || undefined,
      });

      if (classDoc) {
        await Class.findByIdAndUpdate(classDoc._id, { $addToSet: { students: student._id } });
      }
      successful += 1;
    }

    res.status(200).json({ successful, created: successful, errors, failed: errors.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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
  try {
    const { fromClassId, toClassId, studentIds } = req.body;
    if (!fromClassId || !toClassId || !Array.isArray(studentIds) || !studentIds.length) {
      return res.status(400).json({ message: 'fromClassId, toClassId, and studentIds are required' });
    }

    await Class.findByIdAndUpdate(fromClassId, { $pull: { students: { $in: studentIds } } });
    await Class.findByIdAndUpdate(toClassId, { $addToSet: { students: { $each: studentIds } } });

    res.status(200).json({ message: `Promoted ${studentIds.length} student(s)`, count: studentIds.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStudentAcademicHistory = async (req, res) => {
  try {
    const Result = require('../models/resultModel');
    const history = await Result.find({
      school: req.school._id,
      student: req.params.id,
    })
      .populate('class', 'name arm')
      .sort({ createdAt: -1 });
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createStudent, bulkImportStudents, getStudents, getStudentById, updateStudent, deleteStudent, promoteStudents, getStudentAcademicHistory };
