const express = require('express');
const router = express.Router();
const { protect } = require('../middleWare/authMiddleware');
const requireRole = require('../middleWare/requireRole');
const requireSchool = require('../middleWare/requireSchool');
const LessonPlan = require('../models/lessonPlanModel');
const SchemeOfWork = require('../models/schemeOfWorkModel');
const { generateLessonPlan, generateSchemeOfWork, suggestTeachingAids } = require('../ai/lessonPlanGenerator');
const { checkTokenBudget, trackTokenUsage } = require('../ai/aiClient');

router.use(protect, requireSchool);

const TEACHER_ROLES = ['subject_teacher', 'class_teacher', 'vp_academics', 'principal'];

// Generate lesson plan via AI
router.post('/generate', requireRole(TEACHER_ROLES), async (req, res) => {
  try {
    if (!checkTokenBudget(req.school)) {
      return res.status(503).json({ message: 'AI token budget exceeded for this month', offlineMode: true });
    }
    const plan = await generateLessonPlan({ ...req.body, schoolName: req.school.name }, req.school._id);
    res.status(200).json(plan);
  } catch (err) {
    if (err.message === 'AI_UNAVAILABLE') {
      return res.status(503).json({ message: 'AI service unavailable', offlineMode: true, templateFallback: {} });
    }
    res.status(500).json({ message: err.message });
  }
});

// Save a lesson plan
router.post('/', requireRole(TEACHER_ROLES), async (req, res) => {
  try {
    const plan = await LessonPlan.create({ ...req.body, school: req.school._id, teacher: req.user._id });
    res.status(201).json(plan);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get all lesson plans for school
router.get('/', async (req, res) => {
  try {
    const { classId, subjectId, status } = req.query;
    const query = { school: req.school._id };
    if (classId) query.class = classId;
    if (subjectId) query.subject = subjectId;
    if (status) query.status = status;
    if (!['principal', 'vp_academics', 'school_owner'].includes(req.user.role)) {
      query.teacher = req.user._id;
    }
    const plans = await LessonPlan.find(query)
      .populate('teacher', 'firstName lastName')
      .populate('subject', 'name')
      .populate('class', 'name arm')
      .sort({ createdAt: -1 });
    res.status(200).json(plans);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const plan = await LessonPlan.findOne({ _id: req.params.id, school: req.school._id })
      .populate('teacher', 'firstName lastName')
      .populate('subject', 'name code')
      .populate('class', 'name arm level');
    if (!plan) return res.status(404).json({ message: 'Lesson plan not found' });
    res.status(200).json(plan);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/:id', requireRole(TEACHER_ROLES), async (req, res) => {
  try {
    const plan = await LessonPlan.findOneAndUpdate(
      { _id: req.params.id, school: req.school._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!plan) return res.status(404).json({ message: 'Lesson plan not found' });
    res.status(200).json(plan);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', requireRole(['principal', 'vp_academics']), async (req, res) => {
  try {
    await LessonPlan.findOneAndDelete({ _id: req.params.id, school: req.school._id });
    res.status(200).json({ message: 'Lesson plan deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Scheme of Work routes
router.post('/schemes/generate', requireRole(TEACHER_ROLES), async (req, res) => {
  try {
    if (!checkTokenBudget(req.school)) {
      return res.status(503).json({ message: 'AI token budget exceeded', offlineMode: true });
    }
    const scheme = await generateSchemeOfWork(req.body, req.school._id);
    res.status(200).json(scheme);
  } catch (err) {
    if (err.message === 'AI_UNAVAILABLE') {
      return res.status(503).json({ message: 'AI service unavailable', offlineMode: true });
    }
    res.status(500).json({ message: err.message });
  }
});

router.post('/schemes', requireRole(TEACHER_ROLES), async (req, res) => {
  try {
    const scheme = await SchemeOfWork.create({ ...req.body, school: req.school._id, teacher: req.user._id });
    res.status(201).json(scheme);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/schemes/list', async (req, res) => {
  try {
    const { classId, subjectId, term } = req.query;
    const query = { school: req.school._id };
    if (classId) query.class = classId;
    if (subjectId) query.subject = subjectId;
    if (term) query.term = term;
    const schemes = await SchemeOfWork.find(query)
      .populate('teacher', 'firstName lastName')
      .populate('subject', 'name')
      .populate('class', 'name arm')
      .sort({ createdAt: -1 });
    res.status(200).json(schemes);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Teaching aids suggestion
router.post('/teaching-aids', requireRole(TEACHER_ROLES), async (req, res) => {
  try {
    const aids = await suggestTeachingAids(req.body, req.school._id);
    res.status(200).json({ aids });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
