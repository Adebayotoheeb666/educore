const { callAIWithSystem, trackTokenUsage } = require('./aiClient');

const PRINCIPAL_COMMENT_TEMPLATES = [
  (name, perf) => `${name} has demonstrated ${perf} academic performance this term. We encourage ${name} to maintain this level of dedication and continue to strive for excellence.`,
  (name, perf) => `${name}'s ${perf} result this term is a reflection of hard work and commitment. I urge ${name} to keep up with studies and aim higher next term.`,
  (name, perf) => `This is a ${perf} performance for ${name}. The school administration is confident that with continued effort, ${name} will achieve even greater results.`,
];

const CLASS_TEACHER_TEMPLATES = [
  (name, perf) => `${name} has shown ${perf} commitment in class this term. Regular attendance and active participation have contributed to this result.`,
  (name, perf) => `${name} has been a ${perf} student this term. I encourage ${name} to maintain focus and continue to ask questions in class.`,
];

const getPerformanceLabel = (percentage) => {
  if (percentage >= 75) return 'excellent';
  if (percentage >= 65) return 'very good';
  if (percentage >= 55) return 'good';
  if (percentage >= 45) return 'fair';
  if (percentage >= 40) return 'below average';
  return 'poor';
};

const generatePrincipalComment = async (result, schoolName, schoolId) => {
  const { overallPercentage, student } = result;
  const studentName = student?.firstName || 'The student';
  const perf = getPerformanceLabel(overallPercentage);

  try {
    const systemPrompt = `You are the principal of ${schoolName || 'a Nigerian secondary school'}.
Write encouraging, professional academic comments in Nigerian English.
Keep comments to 2-3 sentences. Be specific about performance level. Use formal tone.`;

    const userPrompt = `Write a principal's comment for a student's report card.
Student: ${studentName}
Overall Score: ${overallPercentage}%
Performance Level: ${perf}
Term Result Summary: ${JSON.stringify(result.subjects?.slice(0, 3) || [])}

Return ONLY the comment text, nothing else.`;

    const aiResult = await callAIWithSystem(systemPrompt, userPrompt, { maxTokens: 150 });
    await trackTokenUsage(schoolId, aiResult.tokens);
    return aiResult.text.trim();
  } catch {
    const template = PRINCIPAL_COMMENT_TEMPLATES[Math.floor(Math.random() * PRINCIPAL_COMMENT_TEMPLATES.length)];
    return template(studentName, perf);
  }
};

const generateClassTeacherComment = async (result, schoolId) => {
  const { overallPercentage, student } = result;
  const studentName = student?.firstName || 'The student';
  const perf = getPerformanceLabel(overallPercentage);

  try {
    const userPrompt = `Write a class teacher's report card comment for a Nigerian secondary school student.
Student: ${studentName}
Overall Score: ${overallPercentage}%
Performance: ${perf}

Write 1-2 sentences only. Be encouraging and constructive. Use Nigerian academic English. Return ONLY the comment.`;

    const aiResult = await callAIWithSystem(null, userPrompt, { maxTokens: 100 });
    await trackTokenUsage(schoolId, aiResult.tokens);
    return aiResult.text.trim();
  } catch {
    const template = CLASS_TEACHER_TEMPLATES[Math.floor(Math.random() * CLASS_TEACHER_TEMPLATES.length)];
    return template(studentName, perf);
  }
};

const suggestLearningRecommendations = async (result, schoolId) => {
  const weakSubjects = (result.subjects || [])
    .filter(s => (s.totalScore / (s.maxScore || 100)) * 100 < 50)
    .map(s => s.subjectName || s.subject?.name || 'Unknown')
    .slice(0, 3);

  try {
    const userPrompt = `Suggest 3-5 specific, actionable learning improvement recommendations for a Nigerian secondary school student.
Weak subjects: ${weakSubjects.join(', ') || 'General improvement needed'}
Overall score: ${result.overallPercentage}%

Return a JSON array of strings. Each item should be a concrete, actionable recommendation.`;

    const { callAIStructured } = require('./aiClient');
    const aiResult = await callAIStructured(null, userPrompt, { maxTokens: 400 });
    await trackTokenUsage(schoolId, aiResult.tokens);
    return Array.isArray(aiResult.data) ? aiResult.data : [];
  } catch {
    const defaults = [
      'Dedicate at least 2 hours daily to academic study.',
      'Form or join a study group with classmates.',
      'Consult subject teachers during free periods for extra support.',
      'Practice with past WAEC/NECO question papers regularly.',
    ];
    return weakSubjects.length
      ? [`Focus on improving performance in: ${weakSubjects.join(', ')}.`, ...defaults.slice(0, 3)]
      : defaults;
  }
};

module.exports = { generatePrincipalComment, generateClassTeacherComment, suggestLearningRecommendations };
