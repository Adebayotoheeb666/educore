const { OpenAI } = require("openai");
const Anthropic = require("@anthropic-ai/sdk");
const LessonPlan = require("../models/lessonPlanModel");
const Question = require("../models/questionModel");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const generateText = async (prompt) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }]
    });
    return response.choices[0].message.content;
  } catch (err) {
    console.warn("OpenAI failed, falling back to Anthropic:", err.message);
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }]
    });
    return response.content[0].text;
  }
};

const generateLessonPlan = async (req, res) => {
  try {
    const { topic, objective } = req.body;
    const prompt = `Create a detailed lesson plan for the topic: \${topic} with objective: \${objective}. Include Introduction, Main Activity, and Conclusion.`;
    const planContent = await generateText(prompt);
    res.status(200).json({ generatedPlan: planContent });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const generateQuestions = async (req, res) => {
  try {
    const { topic, difficulty, count } = req.body;
    const prompt = `Generate \${count} \${difficulty} multiple choice questions about \${topic}. Format as raw JSON array of objects with keys: question, options (array of strings), correctOption (the exact string match).`;
    const questionsString = await generateText(prompt);
    res.status(200).json({ questions: questionsString });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const gradeSubmission = async (req, res) => {
  try {
    const { answer, rubric } = req.body;
    const prompt = `Grade the following answer based on the rubric. Answer: "\${answer}". Rubric: "\${rubric}". Provide out of 100 score and feedback.`;
    const grading = await generateText(prompt);
    res.status(200).json({ grading });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { generateLessonPlan, generateQuestions, gradeSubmission };
