const { callAIStructured, trackTokenUsage } = require('./aiClient');

const gradeMCQ = (question, studentAnswer) => {
  if (!question?.answer || !studentAnswer) return { score: 0, maxScore: question?.marks || 1, correct: false };
  const correct = studentAnswer.trim().toLowerCase() === question.answer.trim().toLowerCase();
  return { score: correct ? (question.marks || 1) : 0, maxScore: question.marks || 1, correct };
};

const gradeFillBlank = (question, studentAnswer) => {
  if (!question?.answer || !studentAnswer) return { score: 0, maxScore: question?.marks || 2, correct: false };
  const normalize = (s) => s.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const correct = normalize(studentAnswer) === normalize(question.answer);
  return { score: correct ? (question.marks || 2) : 0, maxScore: question.marks || 2, correct };
};

const gradeTrueFalse = (question, studentAnswer) => {
  if (!question?.answer || !studentAnswer) return { score: 0, maxScore: question?.marks || 1, correct: false };
  const correct = studentAnswer.trim().toLowerCase() === question.answer.toLowerCase();
  return { score: correct ? (question.marks || 1) : 0, maxScore: question.marks || 1, correct };
};

const gradeShortAnswer = async (question, studentAnswer, schoolId) => {
  if (!studentAnswer?.trim()) return { score: 0, maxScore: question.marks || 5, feedback: 'No answer provided', aiGraded: false };

  const keywordsMatch = question.markingGuide
    ? question.markingGuide.toLowerCase().split(/[,.\n]/).filter(Boolean)
        .filter(kw => studentAnswer.toLowerCase().includes(kw.trim())).length
    : 0;
  const keywordsTotal = question.markingGuide
    ? question.markingGuide.toLowerCase().split(/[,.\n]/).filter(Boolean).length
    : 1;

  const keywordScore = Math.round((keywordsMatch / Math.max(keywordsTotal, 1)) * (question.marks || 5));

  try {
    const prompt = `Grade this short-answer response. Return JSON: {"score": number, "maxScore": number, "feedback": "string", "keyPointsHit": ["string"]}
Question: ${question.question}
Marking Guide: ${question.markingGuide || 'Award marks for accurate, relevant content'}
Student Answer: ${studentAnswer}
Maximum Marks: ${question.marks || 5}
Award marks proportionally based on accuracy and relevance to the marking guide.`;

    const result = await callAIStructured(null, prompt, { maxTokens: 400 });
    await trackTokenUsage(schoolId, result.tokens);
    return { ...result.data, aiGraded: true };
  } catch {
    return {
      score: keywordScore,
      maxScore: question.marks || 5,
      feedback: 'Auto-graded based on keyword matching',
      aiGraded: false
    };
  }
};

const gradeEssay = async (question, studentAnswer, schoolId) => {
  if (!studentAnswer?.trim()) {
    return { score: 0, maxScore: question.marks || 20, feedback: 'No answer provided', aiGraded: false };
  }

  const rubric = Array.isArray(question.rubric)
    ? question.rubric.join('\n')
    : 'Content relevance, Organisation, Language use, Depth of analysis';

  try {
    const prompt = `You are a Nigerian secondary school examiner. Grade this essay response.
Return JSON: {"score": number, "maxScore": number, "feedback": "string (2-3 sentences)", "rubricScores": {"content": number, "organisation": number, "language": number}, "suggestions": ["string"]}

Question: ${question.question}
Rubric criteria:
${rubric}
Student Essay: ${studentAnswer}
Total marks: ${question.marks || 20}

Be fair but firm. Use the rubric strictly. Provide actionable feedback in Nigerian academic English.`;

    const result = await callAIStructured(null, prompt, { maxTokens: 600 });
    await trackTokenUsage(schoolId, result.tokens);
    return { ...result.data, aiGraded: true };
  } catch {
    const wordCount = studentAnswer.trim().split(/\s+/).length;
    const rawScore = Math.min(Math.round((wordCount / 300) * (question.marks || 20)), question.marks || 20);
    return {
      score: rawScore,
      maxScore: question.marks || 20,
      feedback: 'Preliminary score based on response length. Requires teacher review.',
      aiGraded: false
    };
  }
};

const gradeSubmission = async (submission, schoolId) => {
  const gradedAnswers = [];
  let totalScore = 0;
  let totalMaxScore = 0;

  for (const answer of submission.answers || []) {
    const { question, mcqAnswer, textAnswer } = answer;
    if (!question) continue;

    let gradeResult;
    const qType = question.type || 'mcq';

    if (qType === 'mcq') {
      gradeResult = gradeMCQ(question, mcqAnswer);
    } else if (qType === 'true_false') {
      gradeResult = gradeTrueFalse(question, mcqAnswer || textAnswer);
    } else if (qType === 'fill_blank') {
      gradeResult = gradeFillBlank(question, textAnswer);
    } else if (qType === 'theory') {
      gradeResult = await gradeShortAnswer(question, textAnswer, schoolId);
    } else if (qType === 'essay') {
      gradeResult = await gradeEssay(question, textAnswer, schoolId);
    } else {
      gradeResult = { score: 0, maxScore: question.marks || 1 };
    }

    totalScore += gradeResult.score || 0;
    totalMaxScore += gradeResult.maxScore || 0;

    gradedAnswers.push({
      question: question._id || question,
      mcqAnswer,
      textAnswer,
      aiScore: gradeResult.score,
      aiFeedback: gradeResult.feedback || null,
      finalScore: gradeResult.score,
    });
  }

  const percentage = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
  return { gradedAnswers, totalScore, totalMaxScore, percentage };
};

const computeCAScore = (examScores = [], caWeight = 30) => {
  if (!examScores.length) return 0;
  const avg = examScores.reduce((sum, s) => sum + (s || 0), 0) / examScores.length;
  return Math.round((avg / 100) * caWeight);
};

module.exports = { gradeMCQ, gradeTrueFalse, gradeFillBlank, gradeShortAnswer, gradeEssay, gradeSubmission, computeCAScore };
