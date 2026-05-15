const Result = require("../../models/resultModel");
const Exam = require("../../models/examModel");
const Submission = require("../../models/submissionModel");

const computeResultsForClass = async (classId, term, session) => {
  return { message: "Results computed" };
};

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
  results.sort((a, b) => b.overallPercentage - a.overallPercentage);
  results.forEach((r, index) => { r.positionInClass = index + 1; });
  return results;
};

module.exports = { computeResultsForClass, applyGradingScale, computePositions };
