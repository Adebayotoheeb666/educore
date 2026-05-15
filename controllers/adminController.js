const School = require('../models/schoolModel');
const User = require('../models/userModel');
const Payment = require('../models/paymentModel');
const Announcement = require('../models/announcementModel');
const Attendance = require('../models/attendanceModel');
const Exam = require('../models/examModel');
const Result = require('../models/resultModel');
const Class = require('../models/classModel');

const schoolStatus = (school) => {
  const sub = school.subscription?.status;
  if (sub === 'inactive') return 'suspended';
  if (sub === 'trial') return 'trial';
  return 'active';
};

const enrichSchool = async (school) => {
  const schoolId = school._id;
  const [studentCount, teacherCount, classCount, staffCount] = await Promise.all([
    User.countDocuments({ schoolId, role: 'student' }),
    User.countDocuments({ schoolId, role: { $in: ['class_teacher', 'subject_teacher'] } }),
    Class.countDocuments({ school: schoolId }),
    User.countDocuments({
      schoolId,
      role: { $in: ['principal', 'vp_admin', 'vp_academics', 'admin_staff', 'bursar', 'school_owner'] },
    }),
  ]);

  return {
    ...school.toObject(),
    status: schoolStatus(school),
    studentCount,
    teacherCount,
    classCount,
    staffCount,
  };
};

const getPlatformDashboard = async (req, res) => {
  try {
    const [
      totalSchools,
      schools,
      totalUsers,
      students,
      teachers,
      parents,
      recentPayments,
      recentAnnouncements,
    ] = await Promise.all([
      School.countDocuments(),
      School.find().sort({ createdAt: -1 }).limit(5),
      User.countDocuments({ role: { $ne: 'super_admin' } }),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: { $in: ['class_teacher', 'subject_teacher'] } }),
      User.countDocuments({ role: 'parent' }),
      Payment.find().sort({ updatedAt: -1 }).limit(8).populate('student', 'firstName lastName name').populate('fee', 'title'),
      Announcement.find().sort({ createdAt: -1 }).limit(8).populate('school', 'name'),
    ]);

    const activeSchools = await School.countDocuments({
      'subscription.status': { $in: ['active', 'trial'] },
    });

    const usersByRole = await User.aggregate([
      { $match: { role: { $ne: 'super_admin' } } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const enrichedRecent = await Promise.all(schools.map((s) => enrichSchool(s)));

    res.status(200).json({
      totals: {
        schools: totalSchools,
        activeSchools,
        users: totalUsers,
        students,
        teachers,
        parents,
      },
      usersByRole: usersByRole.map((r) => ({ role: r._id, count: r.count })),
      recentSchools: enrichedRecent,
      recentPayments: recentPayments.map((p) => ({
        id: p._id,
        amount: p.amountPaid,
        status: p.status,
        studentName: p.student?.name || `${p.student?.firstName || ''} ${p.student?.lastName || ''}`.trim(),
        feeTitle: p.fee?.title,
        schoolId: p.school,
        at: p.updatedAt,
      })),
      recentAnnouncements: recentAnnouncements.map((a) => ({
        id: a._id,
        title: a.title,
        schoolName: a.school?.name || '—',
        priority: a.priority,
        at: a.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllSchools = async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const schools = await School.find(filter).sort({ createdAt: -1 });
    const enriched = await Promise.all(schools.map((s) => enrichSchool(s)));

    res.status(200).json({ schools: enriched, total: enriched.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSchoolById = async (req, res) => {
  try {
    const school = await School.findById(req.params.id).populate('owner', 'name email firstName lastName');
    if (!school) return res.status(404).json({ message: 'School not found' });

    const schoolId = school._id;
    const [users, recentAnnouncements, recentPayments, serviceUsage] = await Promise.all([
      User.find({ schoolId })
        .select('name firstName lastName email role isActive phone createdAt')
        .sort({ role: 1, createdAt: -1 })
        .limit(200),
      Announcement.find({ school: schoolId }).sort({ createdAt: -1 }).limit(10),
      Payment.find({ school: schoolId }).sort({ updatedAt: -1 }).limit(10)
        .populate('student', 'firstName lastName name')
        .populate('fee', 'title'),
      Promise.all([
        Attendance.countDocuments({ school: schoolId }),
        Exam.countDocuments({ school: schoolId }),
        Result.countDocuments({ school: schoolId }),
        Payment.countDocuments({ school: schoolId }),
        Announcement.countDocuments({ school: schoolId }),
      ]),
    ]);

    const [attendanceCount, examCount, resultCount, paymentCount, announcementCount] = serviceUsage;

    const enriched = await enrichSchool(school);

    res.status(200).json({
      school: enriched,
      owner: school.owner,
      users: users.map((u) => ({
        id: u._id,
        name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim(),
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        phone: u.phone,
        joinedAt: u.createdAt,
      })),
      services: {
        attendanceRecords: attendanceCount,
        exams: examCount,
        results: resultCount,
        payments: paymentCount,
        announcements: announcementCount,
      },
      activity: {
        announcements: recentAnnouncements.map((a) => ({
          id: a._id,
          title: a.title,
          type: 'announcement',
          at: a.createdAt,
        })),
        payments: recentPayments.map((p) => ({
          id: p._id,
          title: `${p.fee?.title || 'Fee'} — ₦${(p.amountPaid || 0).toLocaleString()}`,
          type: 'payment',
          status: p.status,
          at: p.updatedAt,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSchoolAdmin = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) return res.status(404).json({ message: 'School not found' });

    const { status, plan, aiTokenBudget, expiresAt } = req.body;
    const sub = req.body.subscription || {};

    if (plan || sub.plan) school.subscription.plan = plan || sub.plan;
    if (aiTokenBudget != null || sub.aiTokenBudget != null) {
      school.subscription.aiTokenBudget = aiTokenBudget ?? sub.aiTokenBudget;
    }
    if (expiresAt || sub.expiresAt) school.subscription.expiresAt = expiresAt || sub.expiresAt;

    if (status) {
      const map = { active: 'active', suspended: 'inactive', trial: 'trial' };
      school.subscription.status = map[status] || status;
    } else if (sub.status) {
      school.subscription.status = sub.status;
    }

    if (req.body.name) school.name = req.body.name;
    if (req.body.phone) school.phone = req.body.phone;
    if (req.body.address) school.address = req.body.address;

    await school.save();
    const enriched = await enrichSchool(school);
    res.status(200).json({ school: enriched });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPlatformUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const role = req.query.role;
    const schoolId = req.query.schoolId;
    const search = (req.query.search || '').trim();

    const filter = { role: { $ne: 'super_admin' } };
    if (role) filter.role = role;
    if (schoolId) filter.schoolId = schoolId;
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
      ];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select('name firstName lastName email role schoolId isActive createdAt')
        .populate('schoolId', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    res.status(200).json({
      users: users.map((u) => ({
        id: u._id,
        name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim(),
        email: u.email,
        role: u.role,
        schoolId: u.schoolId?._id,
        schoolName: u.schoolId?.name || '—',
        isActive: u.isActive,
        joinedAt: u.createdAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePlatformUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'super_admin') {
      return res.status(403).json({ message: 'Cannot modify super admin accounts' });
    }

    if (req.body.isActive !== undefined) user.isActive = req.body.isActive === true || req.body.isActive === 'true';
    await user.save();

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPlatformDashboard,
  getAllSchools,
  getSchoolById,
  updateSchoolAdmin,
  getPlatformUsers,
  updatePlatformUser,
};
