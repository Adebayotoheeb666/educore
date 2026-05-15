const { callAIStructured, callAIWithSystem, trackTokenUsage } = require('./aiClient');
const curriculum = require('./nerdc_curriculum.json');

const buildSystemPrompt = () => {
  const subjects = JSON.stringify(curriculum.secondary, null, 2);
  return `You are an expert Nigerian secondary school curriculum designer trained in the NERDC (Nigerian Educational Research and Development Council) framework.
You create structured, pedagogically sound lesson plans aligned with the Nigerian curriculum.
Always reference NERDC topics. Write in clear Nigerian English. Use Bloom's Taxonomy levels.
Available curriculum data: ${subjects.substring(0, 3000)}`;
};

const generateLessonPlan = async ({ subject, classLevel, topic, term, teacherName, schoolName, duration = 40 }, schoolId) => {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = `Generate a detailed lesson plan with this exact JSON structure:
{
  "topic": "string",
  "subject": "string",
  "classLevel": "string",
  "term": "string",
  "duration": number,
  "nerdcReference": "string",
  "bloomsTaxonomyLevel": ["string"],
  "objectives": ["string (3-5 items)"],
  "content": {
    "intro": "string (5-7 minutes activity)",
    "development": "string (25-30 minutes main teaching)",
    "conclusion": "string (5 minutes wrap-up)"
  },
  "teachingAids": ["string (4-6 items)"],
  "assessment": "string",
  "assignment": "string"
}

Parameters:
- Subject: ${subject}
- Class Level: ${classLevel}
- Topic: ${topic}
- Term: ${term}
- Duration: ${duration} minutes
- School: ${schoolName || 'Nigerian Secondary School'}`;

  const result = await callAIStructured(systemPrompt, userPrompt, { maxTokens: 1500 });
  await trackTokenUsage(schoolId, result.tokens);
  return result.data;
};

const generateSchemeOfWork = async ({ subject, classLevel, term, session, weekCount = 13 }, schoolId) => {
  const systemPrompt = buildSystemPrompt();

  const nerdcTopics = curriculum.secondary?.[classLevel]?.[subject]
    || curriculum.primary?.[classLevel]?.[subject]
    || [];

  const userPrompt = `Generate a complete scheme of work with this exact JSON structure:
{
  "subject": "string",
  "classLevel": "string",
  "term": "string",
  "session": "string",
  "weeks": [
    {
      "weekNumber": number,
      "topic": "string",
      "subtopics": ["string"],
      "objectives": ["string"],
      "teachingMethods": ["string"],
      "resources": ["string"],
      "evaluation": "string"
    }
  ]
}

Parameters:
- Subject: ${subject}
- Class: ${classLevel}
- Term: ${term}
- Session: ${session}
- Number of weeks: ${weekCount}
- NERDC topics to cover: ${nerdcTopics.join(', ') || 'Standard Nigerian curriculum topics'}
Distribute topics evenly. Include revision week in week ${weekCount}.`;

  const result = await callAIStructured(systemPrompt, userPrompt, { maxTokens: 3000 });
  await trackTokenUsage(schoolId, result.tokens);
  return result.data;
};

const suggestTeachingAids = async ({ topic, subject, classLevel }, schoolId) => {
  const prompt = `List 6 practical teaching aids for teaching "${topic}" in ${subject} for ${classLevel} students in a Nigerian secondary school.
Return a JSON array of strings only. Each item should be a specific, obtainable resource.`;

  const result = await callAIStructured(null, prompt, { maxTokens: 300 });
  await trackTokenUsage(schoolId, result.tokens);
  return Array.isArray(result.data) ? result.data : [];
};

module.exports = { generateLessonPlan, generateSchemeOfWork, suggestTeachingAids };
