const User = require("../models/userModel");
const Attendance = require("../models/attendanceModel");
const Fee = require("../models/feeModel");
const Result = require("../models/resultModel");
const Payment = require("../models/paymentModel");
const Announcement = require("../models/announcementModel");
const LessonPlan = require("../models/lessonPlanModel");
const Timetable = require("../models/timetableModel");
const Submission = require("../models/submissionModel");
const Subject = require("../models/subjectModel");
const BookBorrow = require("../models/bookBorrowModel");
const Exam = require("../models/examModel");
const { studentAttendanceRate, formatRelativeTime } = require("../services/analytics/helpers");

const ADMIN_STAFF_ROLES = ['school_owner', 'principal', 'vp_academics', 'vp_admin', 'admin_staff', 'bursar'];

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
      { $unwind: '$subjects' },
      { $group: {
          _id: '$class',
          average: { $avg: '$subjects.totalScore' },
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

    const totalLessonPlans = await LessonPlan.countDocuments({ school: schoolId });
    const approvedLessonPlans = await LessonPlan.countDocuments({ school: schoolId, status: 'approved' });
    const curriculumProgress = totalLessonPlans > 0
      ? Math.round((approvedLessonPlans / totalLessonPlans) * 100)
      : 0;

    const recentAnnouncements = await Announcement.find({ school: schoolId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title body priority createdAt');

    const [
      totalParents,
      totalSubjects,
      staffCount,
      pendingLessonPlans,
      overdueLibrary,
      upcomingExams,
      recentPaymentsRaw,
    ] = await Promise.all([
      User.countDocuments({ schoolId, role: 'parent' }),
      Subject.countDocuments({ school: schoolId }),
      User.countDocuments({ schoolId, role: { $in: ADMIN_STAFF_ROLES } }),
      LessonPlan.countDocuments({ school: schoolId, status: 'submitted' }),
      BookBorrow.countDocuments({
        school: schoolId,
        returnedAt: null,
        dueDate: { $lt: new Date() },
        status: { $in: ['borrowed', 'overdue'] },
      }),
      Exam.countDocuments({
        school: schoolId,
        status: 'published',
        scheduledDate: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      }),
      Payment.find({ school: schoolId })
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate('student', 'firstName lastName name'),
    ]);

    const paidTotal = payments
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    const pendingBalance = payments
      .filter((p) => p.status !== 'paid')
      .reduce((sum, p) => sum + (p.balance || 0), 0);
    const totalDue = payments.reduce((sum, p) => sum + (p.amountDue || 0), 0);
    const collectionRate = totalDue > 0 ? Math.round((paidTotal / totalDue) * 100) : 0;

    const studentName = (s) => {
      if (!s) return 'Student';
      if (s.name) return s.name;
      return `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student';
    };

    res.status(200).json({
      totalStudents,
      totalTeachers,
      totalClasses,
      totalParents,
      totalSubjects,
      staffCount,
      feeDefaulters: feeDefaulters.length,
      avgAttendance: Math.round(avgAttendance),
      feeCollected: feeCollected || paidTotal,
      feePending: pendingBalance,
      collectionRate,
      curriculumProgress,
      pendingLessonPlans,
      overdueLibrary,
      upcomingExams,
      classPerformance,
      recentPayments: recentPaymentsRaw.map((p) => ({
        id: p._id,
        studentName: studentName(p.student),
        amount: p.amountPaid || 0,
        status: p.status,
        time: formatRelativeTime(p.updatedAt || p.createdAt),
      })),
      recentAnnouncements: recentAnnouncements.map((a) => ({
        id: a._id,
        title: a.title,
        body: a.body,
        priority: a.priority,
        time: formatRelativeTime(a.createdAt),
      })),
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
    const lastTermAvg = latestResult?.overallPercentage
      ?? (latestResult?.subjects?.length
        ? Math.round(latestResult.subjects.reduce((acc, s) => acc + (s.totalScore || 0), 0) / latestResult.subjects.length)
        : 0);

    const classPosition = latestResult?.positionInClass ?? '—';

    // Outstanding fees
    const payments = await Payment.find({
      school: req.school._id,
      student: userId,
      status: { $ne: 'paid' },
    });
    const outstandingFees = payments.reduce((acc, p) => acc + (p.balance || 0), 0);

    res.status(200).json({
      welcomeMessage: `Welcome back, ${displayName}!`,
      currentClass: studentClass?.name || 'N/A',
      performanceSnapshot: {
        attendance: attendanceRate,
        attendanceTrend: attendanceRate > 80 ? 'On Track' : 'Action Needed',
        lastTermAvg,
        outstandingFees,
        classPosition,
        positionTrend: latestResult?.term ? `${latestResult.term} • ${latestResult.session || ''}`.trim() : 'No results yet',
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
      
      const unpaidPayments = await Payment.countDocuments({
        school: req.school._id,
        student: child._id,
        status: { $ne: 'paid' },
        balance: { $gt: 0 },
      });
      const unpaid = unpaidPayments > 0;

      const attendance = await studentAttendanceRate(req.school._id, child._id);

      return {
        id: child._id,
        name: child.name,
        class: child.classId?.name || "N/A",
        tag: child.classId?.name?.split(' ')[0] || "N/A",
        avatar: child.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(child.name || 'Student')}&background=6A5ACD&color=fff`,
        attendance,
        avg,
        avgTrend: '',
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
    const schoolId = req.school._id;
    const Class = require("../models/classModel");
    const classes = await Class.find({
      school: schoolId,
      $or: [{ classTeacher: teacherId }],
    });

    const totalStudents = classes.reduce((acc, c) => acc + (c.students?.length || 0), 0);

    const classIds = classes.map((c) => c._id);
    const classResults = classIds.length
      ? await Result.find({ school: schoolId, class: { $in: classIds } })
      : [];
    const avgPerformance = classResults.length
      ? Math.round(
          classResults.reduce((sum, r) => sum + (r.overallPercentage || 0), 0) / classResults.length
        )
      : 0;

    const attendanceMarked = await Attendance.countDocuments({
      school: schoolId,
      takenBy: teacherId,
    });
    const attendanceTotal = await Attendance.countDocuments({ school: schoolId });
    const attendanceLogged = attendanceTotal > 0
      ? Math.round((attendanceMarked / attendanceTotal) * 100)
      : 0;

    const todayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
      new Date().getDay()
    ];
    const timetables = await Timetable.find({ school: schoolId, class: { $in: classIds } })
      .populate('class', 'name arm')
      .populate({ path: 'slots.subject', select: 'name' });

    const schedule = [];
    for (const tt of timetables) {
      for (const slot of tt.slots || []) {
        if (slot.day !== todayName || slot.teacher?.toString() !== teacherId.toString()) continue;
        schedule.push({
          time: slot.startTime || '—',
          subject: slot.subject?.name || '—',
          class: `${tt.class?.name || ''}${tt.class?.arm ? ` ${tt.class.arm}` : ''}`.trim(),
          room: slot.room || '',
        });
      }
    }
    schedule.sort((a, b) => String(a.time).localeCompare(String(b.time)));

    const performance = await Result.aggregate([
      { $match: { school: schoolId, class: { $in: classIds } } },
      { $group: { _id: '$class', avg: { $avg: '$overallPercentage' } } },
      { $lookup: { from: 'classes', localField: '_id', foreignField: '_id', as: 'classInfo' } },
      { $unwind: { path: '$classInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $concat: ['$classInfo.name', ' ', { $ifNull: ['$classInfo.arm', ''] }] },
          avg: { $round: ['$avg', 1] },
        },
      },
    ]);

    const recentSubmissions = await Submission.find({ school: schoolId })
      .populate('student', 'firstName lastName name')
      .populate({ path: 'exam', populate: { path: 'subject', select: 'name' } })
      .sort({ updatedAt: -1 })
      .limit(5);

    const formattedSubmissions = recentSubmissions.map((s) => ({
      name: s.student?.name || `${s.student?.firstName || ''} ${s.student?.lastName || ''}`.trim(),
      subject: s.exam?.subject?.name || '—',
      time: formatRelativeTime(s.updatedAt),
    }));

    res.status(200).json({
      classesToday: schedule.length,
      totalStudents,
      avgPerformance,
      attendanceLogged,
      schedule,
      performance,
      recentSubmissions: formattedSubmissions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStudentResults = async (req, res) => {
  try {
    const studentId = req.params.id;
    const latestResult = await Result.findOne({ student: studentId, school: req.school._id })
      .populate({ path: 'subjects.subject', select: 'name' })
      .populate('class', 'name arm')
      .sort({ createdAt: -1 });

    const student = await User.findById(studentId);

    const formattedResults = (latestResult?.subjects || []).map((entry) => ({
      subject: entry.subject?.name || 'Unknown',
      ca: entry.caScore,
      exam: entry.examScore,
      total: entry.totalScore,
      grade: entry.grade,
    }));

    const avg = formattedResults.length > 0
      ? (
          formattedResults.reduce((acc, curr) => acc + (curr.total || 0), 0) / formattedResults.length
        ).toFixed(1)
      : 0;

    let position = '—';
    let totalInClass = 0;
    if (latestResult?.class) {
      const classResults = await Result.find({
        school: req.school._id,
        class: latestResult.class,
        term: latestResult.term,
        session: latestResult.session,
      }).sort({ overallPercentage: -1 });
      totalInClass = classResults.length;
      const idx = classResults.findIndex((r) => r.student.toString() === studentId.toString());
      if (idx >= 0) position = `${idx + 1}`;
    }

    res.status(200).json({
      results: formattedResults,
      student,
      stats: {
        avg,
        position,
        totalInClass,
        standing: avg >= 70 ? 'Distinction' : avg >= 60 ? 'Credit' : 'Pass',
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSubjectPerformance = async (req, res) => {
  try {
    const { term, session, classId } = req.query;
    const match = { school: req.school._id };
    if (term) match.term = term;
    if (session) match.session = session;
    if (classId) match.class = classId;

    const results = await Result.find(match);
    const subjectMap = new Map();

    for (const result of results) {
      for (const entry of result.subjects || []) {
        const id = entry.subject?.toString();
        if (!id) continue;
        if (!subjectMap.has(id)) {
          subjectMap.set(id, { scores: [], name: entry.subject?.name });
        }
        subjectMap.get(id).scores.push(entry.totalScore || 0);
      }
    }

    const Subject = require('../models/subjectModel');
    const subjects = await Promise.all(
      Array.from(subjectMap.entries()).map(async ([id, data]) => {
        const sub = data.name ? { name: data.name } : await Subject.findById(id).select('name');
        const average = data.scores.length
          ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length
          : 0;
        const passCount = data.scores.filter((s) => s >= 50).length;
        const passRate = data.scores.length
          ? Math.round((passCount / data.scores.length) * 100)
          : 0;
        return {
          subjectName: sub?.name || 'Subject',
          average: Math.round(average * 10) / 10,
          studentCount: data.scores.length,
          passRate,
          status: average >= 50 ? 'Optimal' : 'Critical',
        };
      })
    );

    res.status(200).json({ subjects, topStudents: [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAttendanceAnalytics = async (req, res) => {
  try {
    const schoolId = req.school._id;
    const since = new Date();
    since.setDate(since.getDate() - 6);

    const records = await Attendance.find({
      school: schoolId,
      date: { $gte: since },
    }).sort({ date: 1 });

    const weekly = records.map((att) => {
      const total = (att.records || []).length;
      const present = (att.records || []).filter(
        (r) => r.status === 'present' || r.status === 'late'
      ).length;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;
      return {
        name: new Date(att.date).toLocaleDateString('en-GB', { weekday: 'short' }),
        rate,
      };
    });

    res.status(200).json({ weekly });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFeeAnalytics = async (req, res) => {
  try {
    const schoolId = req.school._id;
    const payments = await Payment.find({ school: schoolId });

    const paid = payments
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    const pending = payments
      .filter((p) => p.status === 'pending')
      .reduce((sum, p) => sum + (p.balance || 0), 0);
    const partial = payments
      .filter((p) => p.status === 'partial')
      .reduce((sum, p) => sum + (p.balance || 0), 0);
    const totalDue = payments.reduce((sum, p) => sum + (p.amountDue || 0), 0);
    const percent = totalDue > 0 ? Math.round((paid / totalDue) * 100) : 0;

    res.status(200).json({
      paid,
      pending: pending + partial,
      overdue: 0,
      percent,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTeacherEffectiveness = async (req, res) => {
  try {
    const schoolId = req.school._id;
    const teachers = await User.find({
      schoolId,
      role: { $in: ['class_teacher', 'subject_teacher'] },
    });

    const data = await Promise.all(
      teachers.map(async (t) => {
        const totalPlans = await LessonPlan.countDocuments({ school: schoolId, teacher: t._id });
        const approvedPlans = await LessonPlan.countDocuments({
          school: schoolId,
          teacher: t._id,
          status: 'approved',
        });
        const lessonPlanRate = totalPlans > 0 ? Math.round((approvedPlans / totalPlans) * 100) : 0;
        const attendanceMarked = await Attendance.countDocuments({
          school: schoolId,
          takenBy: t._id,
        });

        const classes = await require('../models/classModel').find({
          school: schoolId,
          classTeacher: t._id,
        });
        const classIds = classes.map((c) => c._id);
        const results = classIds.length
          ? await Result.find({ school: schoolId, class: { $in: classIds } })
          : [];
        const avgClassScore = results.length
          ? Math.round(
              results.reduce((sum, r) => sum + (r.overallPercentage || 0), 0) / results.length
            )
          : 0;

        return {
          teacherName: t.name || `${t.firstName || ''} ${t.lastName || ''}`.trim(),
          email: t.email,
          lessonPlanRate,
          attendanceMarked,
          avgClassScore,
        };
      })
    );

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
