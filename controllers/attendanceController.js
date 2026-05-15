const Attendance = require("../models/attendanceModel");
const { sendSMS } = require("../utils/sendSMS");
const User = require("../models/userModel");

const markAttendance = async (req, res) => {
  try {
    const { classId, date, term, session, records } = req.body;
    let attendance = await Attendance.findOne({ class: classId, date: new Date(date), school: req.school._id });
    
    if (attendance) {
      attendance.records = records;
      await attendance.save();
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
    }

    res.status(200).json(attendance);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getAttendanceByDate = async (req, res) => {
  try {
    const attendance = await Attendance.findOne({ class: req.params.classId, date: new Date(req.query.date), school: req.school._id });
    res.status(200).json(attendance || null);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getAttendanceSummary = async (req, res) => {
  res.status(200).json({ summary: "Summary here" });
};

const getClassAttendanceReport = async (req, res) => {
  res.status(200).json({ report: "Report here" });
};

const getStudentAttendance = async (req, res) => {
  try {
    const attendances = await Attendance.find({ "records.student": req.params.id, school: req.school._id });
    res.status(200).json(attendances);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const notifyAbsentParents = async (req, res) => {
  res.status(200).json({ message: "Parents notified" });
};

module.exports = { markAttendance, getAttendanceByDate, getAttendanceSummary, getClassAttendanceReport, getStudentAttendance, notifyAbsentParents };
