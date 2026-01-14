
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export const geminiService = {
  async generateLessonNote(topic: string, subject: string, level: string) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Generate a comprehensive lesson note for ${level} ${subject} on the topic "${topic}" following the Nigerian NERDC curriculum. 
    Include: 
    1. Objectives 
    2. Introduction 
    3. Main Content (with subsections) 
    4. Practical/Local Examples 
    5. Evaluation/Quiz. 
    Format in Markdown.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  },

  async generateQuestions(context: string, count: number = 10) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Based on the following text: "${context}", generate ${count} unique exam questions. 
    Mix of Multiple Choice and Theory. 
    Provide the answer key at the end.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  },

  async gradeScript(imageBase64: string, markingScheme: string) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const prompt = `Grade this student script based on the following marking scheme: ${markingScheme}. 
     Identify the score out of 20 and provide specific feedback on missed concepts.`;
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: "image/jpeg",
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    return result.response.text();
  }
};
