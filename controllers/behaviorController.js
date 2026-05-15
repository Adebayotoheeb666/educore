const BehaviorLog = require('../models/behaviorLogModel');
const { sendSMS } = require('../utils/sendSMS');
const User = require('../models/userModel');

const logBehavior = async (req, res) => {
  try {
    const { studentId, type, description, notifyParent } = req.body;
    if (!studentId || !type || !description) {
      return res.status(400).json({ message: 'studentId, type, and description are required' });
    }

    const log = await BehaviorLog.create({
      school: req.school._id,
      student: studentId,
      recordedBy: req.user._id,
      type,
      description,
      parentNotified: false,
    });

    if (notifyParent) {
      try {
        const student = await User.findById(studentId).select('firstName lastName parentPhone');
        if (student?.parentPhone) {
          const typeLabel = { commendation: 'commendation', warning: 'warning notice', suspension: 'suspension notice' }[type] || type;
          await sendSMS(
            student.parentPhone,
            `EduCore School: A ${typeLabel} has been recorded for ${student.firstName} ${student.lastName}. ${description.substring(0, 80)}. Please contact the school for more details.`
          );
          log.parentNotified = true;
          await log.save();
        }
      } catch (smsErr) {
        console.warn('[BehaviorController] Parent SMS failed:', smsErr.message);
      }
    }

    await log.populate([
      { path: 'student', select: 'firstName lastName admissionNumber' },
      { path: 'recordedBy', select: 'firstName lastName role' },
    ]);

    res.status(201).json(log);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getBehaviorLogs = async (req, res) => {
  try {
    const { studentId, type, page = 1, limit = 20 } = req.query;
    const query = { school: req.school._id };
    if (studentId) query.student = studentId;
    if (type) query.type = type;

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      BehaviorLog.find(query)
        .populate('student', 'firstName lastName admissionNumber class')
        .populate('recordedBy', 'firstName lastName role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      BehaviorLog.countDocuments(query),
    ]);

    res.status(200).json({ logs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateBehaviorLog = async (req, res) => {
  try {
    const log = await BehaviorLog.findOneAndUpdate(
      { _id: req.params.id, school: req.school._id },
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('student', 'firstName lastName').populate('recordedBy', 'firstName lastName');

    if (!log) return res.status(404).json({ message: 'Behavior log not found' });
    res.status(200).json(log);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteBehaviorLog = async (req, res) => {
  try {
    const log = await BehaviorLog.findOneAndDelete({ _id: req.params.id, school: req.school._id });
    if (!log) return res.status(404).json({ message: 'Behavior log not found' });
    res.status(200).json({ message: 'Log deleted' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { logBehavior, getBehaviorLogs, updateBehaviorLog, deleteBehaviorLog };
