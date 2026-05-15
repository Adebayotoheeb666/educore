const AcademicCalendar = require('../models/academicCalendarModel');

// Derive current session string, e.g. "2025/2026"
const currentSession = () => {
  const now = new Date();
  const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}/${year + 1}`;
};

const createEvent = async (req, res) => {
  try {
    const { title, date, type, description, term = 'first', session } = req.body;
    if (!title || !date) return res.status(400).json({ message: 'Title and date are required' });

    const sess = session || currentSession();
    let calendar = await AcademicCalendar.findOne({ school: req.school._id, session: sess });

    if (!calendar) {
      calendar = await AcademicCalendar.create({
        school: req.school._id,
        session: sess,
        terms: [
          { term: 'first',  name: 'First Term',  events: [] },
          { term: 'second', name: 'Second Term', events: [] },
          { term: 'third',  name: 'Third Term',  events: [] },
        ],
      });
    }

    const termObj = calendar.terms.find((t) => t.term === term) || calendar.terms[0];
    termObj.events.push({ title, date, type: type || 'other', description });
    await calendar.save();

    res.status(201).json(calendar);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getEvents = async (req, res) => {
  try {
    const { session } = req.query;
    const sess = session || currentSession();
    const calendar = await AcademicCalendar.findOne({ school: req.school._id, session: sess });

    if (!calendar) return res.status(200).json([]);

    // Flatten all events across all terms, attach term context
    const events = calendar.terms.flatMap((term) =>
      (term.events || []).map((ev) => ({
        ...ev.toObject(),
        term: term.term,
        termName: term.name,
        session: calendar.session,
      }))
    );

    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, type, description } = req.body;

    const calendar = await AcademicCalendar.findOne({ school: req.school._id });
    if (!calendar) return res.status(404).json({ message: 'Calendar not found' });

    let updated = false;
    for (const term of calendar.terms) {
      const ev = term.events.id(id);
      if (ev) {
        if (title)       ev.title       = title;
        if (date)        ev.date        = date;
        if (type)        ev.type        = type;
        if (description !== undefined) ev.description = description;
        updated = true;
        break;
      }
    }

    if (!updated) return res.status(404).json({ message: 'Event not found' });
    await calendar.save();
    res.status(200).json({ message: 'Event updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const calendar = await AcademicCalendar.findOne({ school: req.school._id });
    if (!calendar) return res.status(404).json({ message: 'Calendar not found' });

    let deleted = false;
    for (const term of calendar.terms) {
      const ev = term.events.id(id);
      if (ev) {
        ev.deleteOne();
        deleted = true;
        break;
      }
    }

    if (!deleted) return res.status(404).json({ message: 'Event not found' });
    await calendar.save();
    res.status(200).json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createEvent, getEvents, updateEvent, deleteEvent };
