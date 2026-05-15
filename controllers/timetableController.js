const Timetable = require('../models/timetableModel');
const Subject = require('../models/subjectModel');
const { generateTimetable, detectClashes } = require('../ai/timetableGenerator');

const getTimetable = async (req, res) => {
  try {
    const { classId, term } = req.query;
    const query = { school: req.school._id };
    if (classId) query.class = classId;
    if (term) query.term = term;

    const timetable = await Timetable.findOne(query)
      .populate('class', 'name arm level')
      .populate('slots.subject', 'name code')
      .populate('slots.teacher', 'firstName lastName');
    res.status(200).json(timetable || null);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const generateAITimetable = async (req, res) => {
  try {
    const { classId, term } = req.body;
    if (!classId || !term) return res.status(400).json({ message: 'classId and term are required' });

    const Class = require('../models/classModel');
    const classDoc = await Class.findOne({ _id: classId, school: req.school._id })
      .populate({ path: 'subjects', populate: { path: 'teachers', select: 'firstName lastName' } });

    if (!classDoc) return res.status(404).json({ message: 'Class not found' });

    const subjects = (classDoc.subjects || []).map(sub => ({
      _id: sub._id,
      id: sub._id.toString(),
      name: sub.name,
      teacherId: sub.teachers?.[0]?._id?.toString(),
      teacherName: sub.teachers?.[0] ? `${sub.teachers[0].firstName} ${sub.teachers[0].lastName}` : 'TBD',
      periodsPerWeek: sub.periodsPerWeek || 4,
    }));

    const result = await generateTimetable({
      classId,
      className: `${classDoc.name} ${classDoc.arm || ''}`.trim(),
      term,
      subjects,
      schoolName: req.school.name,
    }, req.school._id);

    let timetable = await Timetable.findOne({ school: req.school._id, class: classId, term });
    if (timetable) {
      timetable.slots = result.slots;
      timetable.aiGenerated = true;
      timetable.status = 'draft';
      await timetable.save();
    } else {
      timetable = await Timetable.create({
        school: req.school._id,
        class: classId,
        term,
        slots: result.slots,
        aiGenerated: true,
        status: 'draft',
      });
    }

    res.status(200).json({ timetable, clashes: result.clashes });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateTimetableSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { slotIndex, slot } = req.body;

    const timetable = await Timetable.findOne({ _id: id, school: req.school._id });
    if (!timetable) return res.status(404).json({ message: 'Timetable not found' });

    if (slotIndex >= 0 && slotIndex < timetable.slots.length) {
      timetable.slots[slotIndex] = { ...timetable.slots[slotIndex].toObject(), ...slot };
    }

    const clashes = detectClashes(timetable.slots);
    await timetable.save();
    res.status(200).json({ timetable, clashes });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const publishTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findOneAndUpdate(
      { _id: req.params.id, school: req.school._id },
      { status: 'published' },
      { new: true }
    );
    if (!timetable) return res.status(404).json({ message: 'Timetable not found' });
    res.status(200).json(timetable);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteTimetable = async (req, res) => {
  try {
    await Timetable.findOneAndDelete({ _id: req.params.id, school: req.school._id });
    res.status(200).json({ message: 'Timetable deleted' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { getTimetable, generateAITimetable, updateTimetableSlot, publishTimetable, deleteTimetable };
