const Result = require("../models/resultModel");
const Class = require("../models/classModel");
const { computeResultsForClass } = require("../services/result/resultComputationService");
const {
  generateReportCardPDF,
  generateBroadsheetXLSX,
  termsMatch,
} = require("../services/result/reportCardGenerator");

const computeTermResults = async (req, res) => {
  try {
    const { classId, term, session } = req.body;
    if (!classId || !term || !session) {
      return res.status(400).json({ message: 'classId, term, and session are required' });
    }
    const outcome = await computeResultsForClass(req.school._id, classId, term, session);
    res.status(200).json({
      message: `Results computed for ${outcome.count} students`,
      status: 'completed',
      count: outcome.count,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getResults = async (req, res) => {
  try {
    const filter = { school: req.school._id };
    if (req.query.classId) filter.class = req.query.classId;
    if (req.query.term) filter.term = req.query.term;
    const results = await Result.find(filter)
      .populate('student', 'firstName lastName name admissionNumber')
      .populate('class', 'name arm')
      .sort({ createdAt: -1 });
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveResults = async (req, res) => {
  try {
    const { classId, term, session } = req.body;
    const filter = { school: req.school._id, status: 'draft' };
    if (classId) filter.class = classId;
    if (term) filter.term = term;
    if (session) filter.session = session;

    const { modifiedCount } = await Result.updateMany(filter, { status: 'approved' });
    res.status(200).json({
      message: `Approved ${modifiedCount} result record(s)`,
      modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const releaseResults = async (req, res) => {
  try {
    const { classId, term, session } = req.body;
    const filter = { school: req.school._id, status: 'approved' };
    if (classId) filter.class = classId;
    if (term) filter.term = term;
    if (session) filter.session = session;

    const { modifiedCount } = await Result.updateMany(filter, { status: 'released' });
    res.status(200).json({
      message: `Released ${modifiedCount} result record(s) to parents and students`,
      modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getParentResults = async (req, res) => {
  try {
    const { studentId } = req.params;
    const parent = await require('../models/userModel').findById(req.user._id);
    const childIds = (parent?.children || []).map((id) => id.toString());

    if (studentId && !childIds.includes(studentId)) {
      return res.status(403).json({ message: 'Not authorized to view this student' });
    }

    const query = { school: req.school._id };
    if (studentId) {
      query.student = studentId;
    } else if (childIds.length) {
      query.student = { $in: parent.children };
    } else {
      return res.status(200).json({ results: [] });
    }

    const results = await Result.find(query)
      .populate('student', 'firstName lastName name')
      .populate('class', 'name arm')
      .sort({ createdAt: -1 });

    res.status(200).json({ results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const generateReportCard = async (req, res) => {
  try {
    const result = await Result.findOne({
      student: req.params.studentId,
      school: req.school._id,
      ...(req.query.term && { term: req.query.term }),
    })
      .populate('student', 'firstName lastName name')
      .populate('class', 'name arm')
      .populate({ path: 'subjects.subject', select: 'name code' });
    if (!result) return res.status(404).json({ message: 'Result not found' });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const generateBroadsheet = async (req, res) => {
  try {
    const { classId } = req.params;
    const { term, session } = req.query;
    if (!term) {
      return res.status(400).json({ message: 'term query parameter is required' });
    }

    const classDoc = await Class.findOne({ _id: classId, school: req.school._id })
      .populate('subjects', 'name code');
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const query = { school: req.school._id, class: classId };
    if (session) query.session = session;

    let results = await Result.find(query)
      .populate('student', 'firstName lastName name admissionNumber')
      .populate({ path: 'subjects.subject', select: 'name code' });

    results = results.filter((r) => termsMatch(r.term, term));

    if (!results.length) {
      return res.status(404).json({
        message: 'No results found for this class, term, and session. Compute or enter results first.',
      });
    }

    const buffer = generateBroadsheetXLSX(results, classDoc, req.school, {
      term,
      session: session || results[0]?.session,
    });

    const className = `${classDoc.name}${classDoc.arm ? ` ${classDoc.arm}` : ''}`.trim();
    const safeClass = className.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    const safeTerm = String(term).replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    const filename = `broadsheet-${safeClass}-${safeTerm}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { computeTermResults, getResults, approveResults, releaseResults, getParentResults, generateReportCard, generateBroadsheet };
