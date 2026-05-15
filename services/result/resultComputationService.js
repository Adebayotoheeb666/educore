const Result = require('../../models/resultModel');
const Exam = require('../../models/examModel');
const Submission = require('../../models/submissionModel');
const User = require('../../models/userModel');
const Class = require('../../models/classModel');

const applyGradingScale = (score) => {
  if (score >= 75) return 'A1';
  if (score >= 70) return 'B2';
  if (score >= 65) return 'B3';
  if (score >= 60) return 'C4';
  if (score >= 55) return 'C5';
  if (score >= 50) return 'C6';
  if (score >= 45) return 'D7';
  if (score >= 40) return 'E8';
  return 'F9';
};

const computePositions = (results) => {
  const sorted = [...results].sort((a, b) => (b.overallPercentage || 0) - (a.overallPercentage || 0));
  sorted.forEach((r, index) => {
    r.positionInClass = index + 1;
  });
  return sorted;
};

const computeResultsForClass = async (schoolId, classId, term, session) => {
  const classDoc = await Class.findOne({ _id: classId, school: schoolId }).populate('subjects');
  if (!classDoc) throw new Error('Class not found');

  const studentIds = classDoc.students?.length
    ? classDoc.students
    : (await User.find({ schoolId, role: 'student' }).select('_id')).map((s) => s._id);

  const exams = await Exam.find({ school: schoolId, class: classId, term });
  const updated = [];

  for (const studentId of studentIds) {
    const subjects = [];
    for (const subject of classDoc.subjects || []) {
      const subjectExams = exams.filter((e) => e.subject?.toString() === subject._id.toString());
      const caExam = subjectExams.find((e) => e.type === 'ca');
      const terminalExam = subjectExams.find((e) => e.type === 'exam') || subjectExams[0];

      let caScore = 0;
      let examScore = 0;

      if (caExam) {
        const caSub = await Submission.findOne({ exam: caExam._id, student: studentId, school: schoolId });
        caScore = caSub?.totalScore ?? 0;
      }
      if (terminalExam) {
        const examSub = await Submission.findOne({ exam: terminalExam._id, student: studentId, school: schoolId });
        examScore = examSub?.totalScore ?? 0;
      }

      const totalScore = caScore + examScore;
      subjects.push({
        subject: subject._id,
        caScore,
        examScore,
        totalScore,
        grade: applyGradingScale(totalScore),
      });
    }

    const overallPercentage = subjects.length
      ? Math.round(subjects.reduce((sum, s) => sum + (s.totalScore || 0), 0) / subjects.length)
      : 0;

    const result = await Result.findOneAndUpdate(
      { school: schoolId, student: studentId, term, session },
      {
        class: classId,
        subjects,
        overallPercentage,
        status: 'draft',
      },
      { upsert: true, new: true }
    );
    updated.push(result);
  }

  const withPositions = computePositions(updated);
  await Promise.all(
    withPositions.map((r) =>
      Result.findByIdAndUpdate(r._id, { positionInClass: r.positionInClass })
    )
  );

  return { count: withPositions.length, results: withPositions };
};

module.exports = { computeResultsForClass, applyGradingScale, computePositions };
