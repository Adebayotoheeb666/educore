const { callAIStructured, trackTokenUsage } = require('./aiClient');
const curriculum = require('./nerdc_curriculum.json');

const EXAM_PATTERN_CONTEXT = {
  waec: 'WAEC (West African Examinations Council) style: formal academic English, Nigerian context, multi-step problems',
  neco: 'NECO (National Examinations Council) style: similar to WAEC, emphasis on Nigerian examples',
  jamb: 'JAMB (UTME) style: concise, 4-option MCQ, strict time constraints, single best answer',
  internal: 'School-based internal exam: tests classroom content directly, approachable language',
  ca: 'Continuous Assessment style: shorter, tests recent classwork, 1-2 sentence questions'
};

const generateQuestions = async ({ subject, classLevel, topic, type = 'mcq', count = 10, difficulty = 'medium', examPattern = 'internal' }, schoolId) => {
  const patternContext = EXAM_PATTERN_CONTEXT[examPattern] || EXAM_PATTERN_CONTEXT.internal;
  const nerdcTopics = curriculum.secondary?.[classLevel]?.[subject]
    || curriculum.primary?.[classLevel]?.[subject]
    || [];

  const typeInstructions = {
    mcq: `Each question must have "options" array of exactly 4 strings (A-D) and "answer" which is the exact text of the correct option`,
    theory: `Each question must have "markingGuide" string with key points and "marks" number`,
    essay: `Each question must have "rubric" array of strings (marking criteria) and "marks" number (10-25)`,
    true_false: `Each question must have "answer" of exactly "True" or "False" and "explanation" string`,
    fill_blank: `Use "___" in the question for the blank. "answer" is the correct word/phrase`
  };

  const userPrompt = `Generate ${count} ${difficulty} difficulty ${type} questions for a Nigerian secondary school exam.

JSON structure — return an array of objects:
[
  {
    "question": "string",
    "type": "${type}",
    "difficulty": "${difficulty}",
    "topic": "string",
    "marks": number,
    ${type === 'mcq' ? '"options": ["string","string","string","string"], "answer": "string",' : ''}
    ${type === 'theory' ? '"markingGuide": "string", "marks": number,' : ''}
    ${type === 'essay' ? '"rubric": ["string"], "marks": number,' : ''}
    ${type === 'true_false' ? '"answer": "True or False", "explanation": "string",' : ''}
    ${type === 'fill_blank' ? '"answer": "string",' : ''}
    "nerdcReference": "string"
  }
]

Parameters:
- Subject: ${subject}
- Class: ${classLevel}
- Topic: ${topic}
- Exam Pattern: ${patternContext}
- NERDC related topics: ${nerdcTopics.slice(0, 5).join(', ')}
- ${typeInstructions[type] || typeInstructions.mcq}

Set "marks" to: mcq=1, theory=5-10, essay=15-25, true_false=1, fill_blank=2`;

  const result = await callAIStructured(null, userPrompt, { maxTokens: 3000 });
  await trackTokenUsage(schoolId, result.tokens);
  const questions = Array.isArray(result.data) ? result.data : result.data?.questions || [];
  return questions.map(q => ({ ...q, type, difficulty, examPattern }));
};

const generateExamPaper = async ({ subject, classLevel, topic, sections, schoolName, examDate, duration = 120, totalMarks = 100 }, schoolId) => {
  const userPrompt = `Generate a complete exam paper structure.

Return this JSON:
{
  "title": "string",
  "subject": "string",
  "class": "string",
  "date": "string",
  "duration": number,
  "totalMarks": number,
  "instructions": ["string (4-6 items)"],
  "sections": [
    {
      "name": "string (e.g. Section A)",
      "type": "mcq|theory|essay",
      "instructions": "string",
      "marks": number,
      "questionCount": number,
      "questions": []
    }
  ]
}

Parameters:
- Subject: ${subject}
- Class: ${classLevel}
- Topics: ${Array.isArray(topic) ? topic.join(', ') : topic}
- School: ${schoolName}
- Duration: ${duration} minutes
- Total marks: ${totalMarks}
- Sections requested: ${JSON.stringify(sections || [{ type: 'mcq', count: 40 }, { type: 'theory', count: 6 }])}

Write Nigerian-style instructions. Set instructions as per WAEC/NECO format.`;

  const result = await callAIStructured(null, userPrompt, { maxTokens: 1500 });
  await trackTokenUsage(schoolId, result.tokens);
  return result.data;
};

const shuffleExamPaper = (questions) => {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.map(q => {
    if (q.type === 'mcq' && Array.isArray(q.options)) {
      const opts = [...q.options].sort(() => Math.random() - 0.5);
      return { ...q, options: opts };
    }
    return q;
  });
};

module.exports = { generateQuestions, generateExamPaper, shuffleExamPaper };
