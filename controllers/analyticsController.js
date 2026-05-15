const User = require("../models/userModel");
const Attendance = require("../models/attendanceModel");
const Fee = require("../models/feeModel");
const Result = require("../models/resultModel");
const Payment = require("../models/paymentModel");

const getSchoolDashboard = async (req, res) => {
  try {
    const schoolId = req.school._id;
    const totalStudents = await User.countDocuments({ schoolId, role: 'student' });
    const totalTeachers = await User.countDocuments({ schoolId, role: { $in: ['class_teacher', 'subject_teacher'] } });

    // Count total classes
    const Class = require("../models/classModel");
    const totalClasses = await Class.countDocuments({ school: schoolId });

    // Get average attendance
    const attendanceRecords = await Attendance.find({ school: schoolId });
    let avgAttendance = 0;
    if (attendanceRecords.length > 0) {
      const totalRecords = attendanceRecords.reduce((acc, curr) => acc + curr.records.length, 0);
      const presentRecords = attendanceRecords.reduce((acc, curr) => 
        acc + curr.records.filter(r => r.status === 'present').length, 0);
      avgAttendance = totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0;
    }

    // Get fee collection
    const payments = await Payment.find({ school: schoolId });
    const feeCollected = payments.reduce((acc, p) => acc + p.amountPaid, 0);

    // Count fee defaulters (students with at least one payment not fully paid)
    const feeDefaulters = await Payment.distinct('student', { school: schoolId, status: { $ne: 'paid' } });

    // Get real class performance from results
    const classPerformance = await Result.aggregate([
      { $match: { school: schoolId } },
      { $group: {
          _id: "$class",
          average: { $avg: "$subjects.totalScore" }
      }},
      { $lookup: {
          from: "classes",
          localField: "_id",
          foreignField: "_id",
          as: "classInfo"
      }},
      { $unwind: "$classInfo" },
      { $project: {
          className: "$classInfo.name",
          average: { $round: ["$average", 1] },
          color: { $cond: [{ $gte: ["$average", 70] }, "#047857", "#0f172a"] }
      }},
      { $sort: { average: -1 } }
    ]);

    res.status(200).json({ 
      totalStudents, 
      totalTeachers, 
      totalClasses,
      feeDefaulters: feeDefaulters.length,
      avgAttendance: Math.round(avgAttendance), 
      feeCollected,
      classPerformance: classPerformance.length > 0 ? classPerformance : [
        { className: 'No Data', average: 0, color: '#94a3b8' }
      ]
    });
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};

const getStudentDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const Class = require("../models/classModel");

    const [user, studentClass, announcements] = await Promise.all([
      User.findById(userId),
      Class.findOne({ students: userId, school: req.school._id }),
      require("./announcementController").getLatestAnnouncements(req.school._id),
    ]);

    const displayName = user.firstName || user.name?.split(' ')[0] || 'Student';

    // Attendance stats
    const attendance = await Attendance.find({ school: req.school._id });
    const totalDays = attendance.length;
    const presentDays = attendance.filter(a =>
      a.records?.find(r => r.student?.toString() === userId.toString() && r.status === 'present')
    ).length;
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    // Last term average
    const latestResult = await Result.findOne({ student: userId }).sort({ createdAt: -1 });
    const lastTermAvg = latestResult?.subjects?.length
      ? Math.round(latestResult.subjects.reduce((acc, s) => acc + (s.totalScore || 0), 0) / latestResult.subjects.length)
      : 0;

    // Outstanding fees
    const fees = await Fee.find({ student: userId, status: { $ne: 'paid' } });
    const outstandingFees = fees.reduce((acc, f) => acc + ((f.totalAmount || 0) - (f.amountPaid || 0)), 0);

    res.status(200).json({
      welcomeMessage: `Welcome back, ${displayName}!`,
      currentClass: studentClass?.name || 'N/A',
      performanceSnapshot: {
        attendance: attendanceRate,
        attendanceTrend: attendanceRate > 80 ? 'On Track' : 'Action Needed',
        lastTermAvg,
        outstandingFees,
        classPosition: 'Pending',
        positionTrend: 'Steady progress',
      },
      announcements: (announcements || []).slice(0, 3).map(a => ({
        id: a._id,
        title: a.title,
        time: 'RECENT',
        body: (a.body || '').substring(0, 150),
        tags: [{ label: a.audience, type: a.priority }],
        type: a.priority === 'urgent' ? 'red' : 'green',
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getParentDashboard = async (req, res) => {
  try {
    const parent = await User.findById(req.user._id).populate({
      path: 'children',
      populate: { path: 'classId' }
    });
    
    const announcements = await require("./announcementController").getLatestAnnouncements(req.school._id);

    const childrenData = await Promise.all(parent.children.map(async (child) => {
      const results = await Result.find({ student: child._id });
      const avg = results.length > 0 ? Math.round(results[0].subjects.reduce((acc, s) => acc + s.totalScore, 0) / results[0].subjects.length) : 0;
      
      const fees = await Fee.find({ student: child._id });
      const unpaid = fees.some(f => f.status !== 'paid');

      return {
        id: child._id,
        name: child.name,
        class: child.classId?.name || "N/A",
        tag: child.classId?.name?.split(' ')[0] || "N/A",
        avatar: `https://ui-avatars.com/api/?name=${child.firstName}+${child.lastName}&background=random`,
        attendance: 95, // Placeholder for aggregation
        avg,
        avgTrend: "+0%",
        feeStatus: unpaid ? "BALANCE DUE" : "PAID",
        feeClass: unpaid ? "due" : "paid"
      };
    }));

    res.status(200).json({
      children: childrenData,
      announcements: announcements.slice(0, 3).map(a => ({
        id: a._id,
        type: a.audience.toUpperCase(),
        title: a.title,
        body: a.body.substring(0, 80) + "...",
        time: "RECENT"
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTeacherDashboard = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const classes = await require("../models/classModel").find({ 
      $or: [{ teacher: teacherId }, { subjects: { $elemMatch: { teacher: teacherId } } }]
    });

    const totalStudents = classes.reduce((acc, c) => acc + (c.students?.length || 0), 0);
    
    const submissions = await Result.find({ teacher: teacherId })
      .populate('student', 'firstName lastName')
      .populate('subject', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const formattedSubmissions = submissions.map(s => ({
      name: `${s.student?.firstName} ${s.student?.lastName}`,
      subject: s.subject?.name,
      time: 'Just now' // Simplified time for now
    }));
    
    res.status(200).json({
      classesToday: classes.length,
      totalStudents,
      avgPerformance: 72, // Aggregate from results of their subjects
      attendanceLogged: 85,
      recentSubmissions: formattedSubmissions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStudentResults = async (req, res) => {
  try {
    const studentId = req.params.id;
    const results = await Result.find({ student: studentId })
      .populate('subject', 'name')
      .sort({ createdAt: -1 });

    const student = await User.findById(studentId).populate('class', 'name');

    const formattedResults = results.map(r => ({
      subject: r.subject?.name || 'Unknown',
      ca: r.caScore,
      exam: r.examScore,
      total: r.totalScore,
      grade: r.grade
    }));

    // Calculate stats
    const avg = formattedResults.length > 0 
      ? (formattedResults.reduce((acc, curr) => acc + curr.total, 0) / formattedResults.length).toFixed(1)
      : 0;

    res.status(200).json({
      results: formattedResults,
      student,
      stats: {
        avg,
        position: '2nd', // Mocking position for now as it requires complex aggregation
        totalInClass: 32,
        standing: avg >= 70 ? 'Distinction' : avg >= 60 ? 'Credit' : 'Pass'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSubjectPerformance = async (req, res) => {
  try {
    const { term, session, classId } = req.query;
    // Real aggregation logic would go here
    // For now, returning formatted data structure matching the UI needs
    const subjects = await Result.aggregate([
      { $match: { term, session } },
      { $group: {
          _id: "$subject",
          average: { $avg: "$totalScore" },
          studentCount: { $sum: 1 }
      }},
      { $lookup: { from: 'subjects', localField: '_id', foreignField: '_id', as: 'subInfo' } },
      { $unwind: '$subInfo' },
      { $project: {
          subjectName: '$subInfo.name',
          average: { $round: ['$average', 1] },
          studentCount: 1,
          passRate: { $literal: 85 }, // Placeholder
          status: { $cond: [{ $gte: ['$average', 50] }, 'Optimal', 'Critical'] }
      }}
    ]);

    res.status(200).json({ 
      subjects: subjects.length > 0 ? subjects : [],
      topStudents: [] // Would require more complex aggregation
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAttendanceAnalytics = async (req, res) => {
  try {
    const data = await Attendance.aggregate([
      { $unwind: "$records" },
      { $group: {
          _id: "$date",
          present: { $sum: { $cond: [{ $eq: ["$records.status", "present"] }, 1, 0] } },
          total: { $sum: 1 }
      }},
      { $project: {
          date: "$_id",
          rate: { $multiply: [{ $divide: ["$present", "$total"] }, 100] }
      }},
      { $sort: { date: 1 } }
    ]);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFeeAnalytics = async (req, res) => {
  try {
    const data = await Payment.aggregate([
      { $group: {
          _id: { $month: "$date" },
          amount: { $sum: "$amountPaid" }
      }},
      { $project: { month: "$_id", amount: 1 } },
      { $sort: { month: 1 } }
    ]);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTeacherEffectiveness = async (req, res) => {
  try {
    const teachers = await User.find({ role: { $in: ['class_teacher', 'subject_teacher'] } });
    const data = await Promise.all(teachers.map(async (t) => {
      return {
        teacherName: `${t.firstName} ${t.lastName}`,
        email: t.email,
        lessonPlanRate: 85, // Mocked metrics
        attendanceMarked: 18,
        avgClassScore: 72
      };
    }));
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const generateEMISReport = async (req, res) => {
  res.status(200).json({ message: "EMIS Report Generated" });
};

const generateNEMISReport = async (req, res) => {
  res.status(200).json({ message: "NEMIS Report Generated" });
};

const getStudentProgressReport = async (req, res) => {
  res.status(200).json({ message: "Progress Report Generated" });
};

module.exports = {
  getSchoolDashboard,
  getStudentDashboard,
  getParentDashboard,
  getTeacherDashboard,
  getSubjectPerformance,
  getAttendanceAnalytics,
  getFeeAnalytics,
  getTeacherEffectiveness,
  generateEMISReport,
  generateNEMISReport,
  getStudentProgressReport,
  getStudentResults
};
