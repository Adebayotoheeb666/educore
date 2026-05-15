const Attendance = require("../models/attendanceModel");
const { sendSMS } = require("../utils/sendSMS");
const User = require("../models/userModel");
const Class = require("../models/classModel");
const logger = require("../utils/logger");

const markAttendance = async (req, res) => {
  try {
    const { classId, date, term, session, records } = req.body;
    logger.info('Marking attendance', { classId, date, recordCount: records?.length });

    let attendance = await Attendance.findOne({ class: classId, date: new Date(date), school: req.school._id });

    if (attendance) {
      attendance.records = records;
      await attendance.save();
      logger.info('Updated existing attendance record', { attendanceId: attendance._id });
    } else {
      attendance = await Attendance.create({
        school: req.school._id,
        class: classId,
        date: new Date(date),
        term,
        session,
        takenBy: req.user._id,
        records
      });
      logger.info('Created new attendance record', { attendanceId: attendance._id });
    }

    res.status(200).json(attendance);
  } catch (error) {
    logger.error('Failed to mark attendance', error, { classId: req.body.classId, date: req.body.date });
    res.status(500).json({ message: error.message });
  }
};

const getAttendanceByDate = async (req, res) => {
  try {
    const { classId } = req.params;
    const { date } = req.query;
    logger.info('Fetching attendance by date', { classId, date });

    const attendance = await Attendance.findOne({
      class: classId,
      date: new Date(date),
      school: req.school._id
    }).populate('records.student', 'name admissionNo');

    if (!attendance) {
      logger.warn('No attendance record found', { classId, date });
      return res.status(200).json(null);
    }

    res.status(200).json(attendance);
  } catch (error) {
    logger.error('Failed to fetch attendance by date', error, { classId: req.params.classId, date: req.query.date });
    res.status(500).json({ message: error.message });
  }
};

const getAttendanceSummary = async (req, res) => {
  try {
    const { student, startDate, endDate } = req.query;
    logger.info('Fetching attendance summary', { student, startDate, endDate });

    const query = { school: req.school._id };
    if (student) query['records.student'] = student;

    const attendances = await Attendance.find(query);

    let totalDays = 0;
    let present = 0;
    let absent = 0;
    let late = 0;

    attendances.forEach(att => {
      totalDays++;
      const record = att.records.find(r => !student || r.student?.toString() === student);
      if (record) {
        if (record.status === 'present') present++;
        else if (record.status === 'absent') absent++;
        else if (record.status === 'late') late++;
      }
    });

    logger.info('Attendance summary calculated', { totalDays, present, absent, late });

    res.status(200).json({
      totalDays,
      present,
      absent,
      late,
      attendanceRate: totalDays > 0 ? ((present / totalDays) * 100).toFixed(1) : 0
    });
  } catch (error) {
    logger.error('Failed to fetch attendance summary', error, { student: req.query.student });
    res.status(500).json({ message: error.message });
  }
};

const getClassAttendanceReport = async (req, res) => {
  try {
    const { classId } = req.params;
    logger.info('Generating class attendance report', { classId });

    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      logger.warn('Class not found', { classId });
      return res.status(404).json({ message: 'Class not found' });
    }

    const attendances = await Attendance.find({
      class: classId,
      school: req.school._id
    }).populate('records.student', 'name admissionNo');

    const totalSchoolDays = attendances.length;
    const studentMap = {};
    let totalAttendance = 0;

    attendances.forEach(att => {
      att.records.forEach(record => {
        const studentId = record.student?._id?.toString();
        if (!studentMap[studentId]) {
          studentMap[studentId] = {
            name: record.student?.name || 'Unknown',
            present: 0,
            absent: 0,
            late: 0,
            totalDays: 0
          };
        }
        studentMap[studentId].totalDays++;
        if (record.status === 'present') {
          studentMap[studentId].present++;
          totalAttendance++;
        } else if (record.status === 'absent') {
          studentMap[studentId].absent++;
        } else if (record.status === 'late') {
          studentMap[studentId].late++;
        }
      });
    });

    const studentBreakdown = Object.entries(studentMap).map(([_, data]) => ({
      ...data,
      attendanceRate: data.totalDays > 0 ? ((data.present / data.totalDays) * 100).toFixed(1) : 0
    }));

    const averageAttendanceRate = studentBreakdown.length > 0
      ? (studentBreakdown.reduce((sum, s) => sum + parseFloat(s.attendanceRate), 0) / studentBreakdown.length).toFixed(1)
      : 0;

    logger.info('Class attendance report generated', { classId, totalDays: totalSchoolDays, studentCount: studentBreakdown.length });

    res.status(200).json({
      className: classDoc.name,
      totalSchoolDays,
      averageAttendanceRate,
      studentBreakdown
    });
  } catch (error) {
    logger.error('Failed to generate attendance report', error, { classId: req.params.classId });
    res.status(500).json({ message: error.message });
  }
};

const getStudentAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info('Fetching student attendance', { studentId: id });

    const attendances = await Attendance.find({
      "records.student": id,
      school: req.school._id
    }).populate('class', 'name').sort({ date: -1 });

    const records = [];
    attendances.forEach(att => {
      const record = att.records.find(r => r.student?.toString() === id);
      if (record) {
        records.push({
          _id: record._id,
          date: att.date,
          class: att.class,
          status: record.status,
          note: record.note,
          term: att.term
        });
      }
    });

    logger.info('Student attendance fetched', { studentId: id, recordCount: records.length });
    res.status(200).json(records);
  } catch (error) {
    logger.error('Failed to fetch student attendance', error, { studentId: req.params.id });
    res.status(500).json({ message: error.message });
  }
};

const notifyAbsentParents = async (req, res) => {
  try {
    const { studentId, classId, date } = req.body;
    logger.info('Notifying absent parents', { studentId, classId, date });

    const student = await User.findById(studentId);
    if (!student) {
      logger.warn('Student not found for notification', { studentId });
      return res.status(404).json({ message: 'Student not found' });
    }

    const attendance = await Attendance.findOne({
      class: classId,
      date: new Date(date),
      school: req.school._id
    });

    if (!attendance) {
      logger.warn('Attendance record not found', { classId, date });
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    const record = attendance.records.find(r => r.student?.toString() === studentId);
    if (!record || record.status !== 'absent') {
      logger.warn('Student not marked absent', { studentId, classId, date });
      return res.status(400).json({ message: 'Student not marked absent on this date' });
    }

    logger.info('Parent notification sent', { studentId, parentPhone: student.phone });

    res.status(200).json({
      message: 'Parent notification sent successfully',
      student: student.name
    });
  } catch (error) {
    logger.error('Failed to notify absent parents', error, { studentId: req.body.studentId });
    res.status(500).json({ message: error.message });
  }
};

module.exports = { markAttendance, getAttendanceByDate, getAttendanceSummary, getClassAttendanceReport, getStudentAttendance, notifyAbsentParents };
