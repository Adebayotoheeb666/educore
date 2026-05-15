const express = require('express');
const router = express.Router();
const { protect } = require('../middleWare/authMiddleware');
const requireRole = require('../middleWare/requireRole');
const requireSchool = require('../middleWare/requireSchool');
const LessonPlan = require('../models/lessonPlanModel');
const SchemeOfWork = require('../models/schemeOfWorkModel');
const { generateLessonPlan, generateSchemeOfWork, suggestTeachingAids } = require('../ai/lessonPlanGenerator');
const { checkTokenBudget, trackTokenUsage } = require('../ai/aiClient');
const logger = require('../utils/logger');

router.use(protect, requireSchool);

const TEACHER_ROLES = ['subject_teacher', 'class_teacher', 'vp_academics', 'principal'];

// Generate lesson plan via AI
router.post('/generate', requireRole(TEACHER_ROLES), async (req, res) => {
  try {
    logger.info('Generating lesson plan via AI', { teacherId: req.user._id, topic: req.body.topic });

    if (!checkTokenBudget(req.school)) {
      logger.warn('AI token budget exceeded', { schoolId: req.school._id });
      return res.status(503).json({ message: 'AI token budget exceeded for this month' });
    }

    const plan = await generateLessonPlan({ ...req.body, schoolName: req.school.name }, req.school._id);
    logger.info('Lesson plan generated successfully', { planId: plan._id });
    res.status(200).json(plan);
  } catch (err) {
    logger.error('Failed to generate lesson plan', err, { teacherId: req.user._id, topic: req.body.topic });

    if (err.message === 'AI_UNAVAILABLE') {
      return res.status(503).json({ message: 'AI service unavailable. Please try again shortly.' });
    }

    res.status(500).json({ message: err.message });
  }
});

// Save a lesson plan
router.post('/', requireRole(TEACHER_ROLES), async (req, res) => {
  try {
    logger.info('Saving lesson plan', { teacherId: req.user._id, topic: req.body.topic });

    const plan = await LessonPlan.create({ ...req.body, school: req.school._id, teacher: req.user._id });

    logger.info('Lesson plan saved successfully', { planId: plan._id });
    res.status(201).json(plan);
  } catch (err) {
    logger.error('Failed to save lesson plan', err, { teacherId: req.user._id });
    res.status(500).json({ message: err.message });
  }
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

    logger.debug('Fetching lesson plans', { filters: query });

    const plans = await LessonPlan.find(query)
      .populate('teacher', 'firstName lastName')
      .populate('subject', 'name')
      .populate('class', 'name arm')
      .sort({ createdAt: -1 });

    logger.info('Lesson plans fetched', { count: plans.length });
    res.status(200).json(plans);
  } catch (err) {
    logger.error('Failed to fetch lesson plans', err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    logger.debug('Fetching lesson plan by id', { planId: req.params.id });

    const plan = await LessonPlan.findOne({ _id: req.params.id, school: req.school._id })
      .populate('teacher', 'firstName lastName')
      .populate('subject', 'name code')
      .populate('class', 'name arm level');

    if (!plan) {
      logger.warn('Lesson plan not found', { planId: req.params.id });
      return res.status(404).json({ message: 'Lesson plan not found' });
    }

    res.status(200).json(plan);
  } catch (err) {
    logger.error('Failed to fetch lesson plan', err, { planId: req.params.id });
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id', requireRole(TEACHER_ROLES), async (req, res) => {
  try {
    logger.info('Updating lesson plan', { planId: req.params.id, teacherId: req.user._id });

    const plan = await LessonPlan.findOneAndUpdate(
      { _id: req.params.id, school: req.school._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!plan) {
      logger.warn('Lesson plan not found for update', { planId: req.params.id });
      return res.status(404).json({ message: 'Lesson plan not found' });
    }

    logger.info('Lesson plan updated successfully', { planId: plan._id });
    res.status(200).json(plan);
  } catch (err) {
    logger.error('Failed to update lesson plan', err, { planId: req.params.id });
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', requireRole(['principal', 'vp_academics']), async (req, res) => {
  try {
    logger.info('Deleting lesson plan', { planId: req.params.id, userId: req.user._id });

    const plan = await LessonPlan.findOneAndDelete({ _id: req.params.id, school: req.school._id });

    if (!plan) {
      logger.warn('Lesson plan not found for deletion', { planId: req.params.id });
      return res.status(404).json({ message: 'Lesson plan not found' });
    }

    logger.info('Lesson plan deleted successfully', { planId: req.params.id });
    res.status(200).json({ message: 'Lesson plan deleted successfully' });
  } catch (err) {
    logger.error('Failed to delete lesson plan', err, { planId: req.params.id });
    res.status(500).json({ message: err.message });
  }
});

// Scheme of Work routes
router.post('/schemes/generate', requireRole(TEACHER_ROLES), async (req, res) => {
  try {
    logger.info('Generating scheme of work via AI', { teacherId: req.user._id });

    if (!checkTokenBudget(req.school)) {
      logger.warn('AI token budget exceeded for scheme generation', { schoolId: req.school._id });
      return res.status(503).json({ message: 'AI token budget exceeded for this month. Please try again next month.' });
    }

    const scheme = await generateSchemeOfWork(req.body, req.school._id);
    logger.info('Scheme of work generated successfully', { schemeId: scheme._id });
    res.status(200).json(scheme);
  } catch (err) {
    logger.error('Failed to generate scheme of work', err, { teacherId: req.user._id });

    if (err.message === 'AI_UNAVAILABLE') {
      return res.status(503).json({ message: 'AI service unavailable. Please try again shortly.' });
    }

    res.status(500).json({ message: err.message });
  }
});

router.post('/schemes', requireRole(TEACHER_ROLES), async (req, res) => {
  try {
    logger.info('Saving scheme of work', { teacherId: req.user._id });

    const scheme = await SchemeOfWork.create({ ...req.body, school: req.school._id, teacher: req.user._id });

    logger.info('Scheme of work saved successfully', { schemeId: scheme._id });
    res.status(201).json(scheme);
  } catch (err) {
    logger.error('Failed to save scheme of work', err, { teacherId: req.user._id });
    res.status(500).json({ message: err.message });
  }
});

router.get('/schemes/list', async (req, res) => {
  try {
    const { classId, subjectId, term } = req.query;
    const query = { school: req.school._id };
    if (classId) query.class = classId;
    if (subjectId) query.subject = subjectId;
    if (term) query.term = term;

    logger.debug('Fetching schemes of work', { filters: query });

    const schemes = await SchemeOfWork.find(query)
      .populate('teacher', 'firstName lastName')
      .populate('subject', 'name')
      .populate('class', 'name arm')
      .sort({ createdAt: -1 });

    logger.info('Schemes of work fetched', { count: schemes.length });
    res.status(200).json(schemes);
  } catch (err) {
    logger.error('Failed to fetch schemes of work', err);
    res.status(500).json({ message: err.message });
  }
});

// Teaching aids suggestion
router.post('/teaching-aids', requireRole(TEACHER_ROLES), async (req, res) => {
  try {
    logger.info('Suggesting teaching aids', { teacherId: req.user._id });

    const aids = await suggestTeachingAids(req.body, req.school._id);

    logger.info('Teaching aids suggested', { aiCount: aids?.length });
    res.status(200).json({ aids });
  } catch (err) {
    logger.error('Failed to suggest teaching aids', err, { teacherId: req.user._id });
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
