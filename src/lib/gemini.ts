import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

interface MCQuestion {
  id: number;
  type: 'mcq';
  text: string;
  options: string[];
  answer: string;
}

interface EssayQuestion {
  id: number;
  type: 'essay';
  text: string;
}

interface GradingResult {
  score: number;
  total: number;
  feedback: string;
  missingKeywords: string[];
  ocrAccuracy: number;
}

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

  async generateQuestions(
    context: string,
    count: number = 10,
    mcqRatio: number = 0.6,
    difficultyLevel: number = 50
  ): Promise<(MCQuestion | EssayQuestion)[]> {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const mcqCount = Math.ceil(count * mcqRatio);
    const essayCount = count - mcqCount;
    const difficulty = difficultyLevel < 33 ? "easy" : difficultyLevel < 67 ? "intermediate" : "difficult (WAEC standard)";

    const prompt = `Based on this educational material, generate exam questions for Nigerian students (NERDC curriculum).

MATERIAL:
${context}

REQUIREMENTS:
- Generate exactly ${mcqCount} Multiple Choice questions (4 options each)
- Generate exactly ${essayCount} Essay/Theory questions
- Difficulty level: ${difficulty}
- Format as valid JSON array

Return ONLY valid JSON array in this format:
[
  {"type":"mcq","question":"Question text?","options":["A) Option1","B) Option2","C) Option3","D) Option4"],"answer":"A"},
  {"type":"essay","question":"Essay question text?"}
]

Important: Return ONLY the JSON array, no other text.`;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();

      // Extract JSON from response if wrapped in code blocks
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
      const questionsData = JSON.parse(jsonStr);

      return questionsData.map((q: any, idx: number) =>
        q.type === 'mcq'
          ? {
              id: idx + 1,
              type: 'mcq' as const,
              text: q.question || q.text,
              options: q.options || [],
              answer: q.answer || '',
            }
          : {
              id: idx + 1,
              type: 'essay' as const,
              text: q.question || q.text,
            }
      );
    } catch (error) {
      console.error('Error parsing questions:', error);
      // Fallback: return empty array on parse error
      return [];
    }
  },

  async extractTextFromPDF(fileData: ArrayBuffer): Promise<string> {
    try {
      // Use PDF.js to extract text
      const pdfjsLib = await import('pdfjs-dist');
      const pdf = await pdfjsLib.getDocument({ data: fileData }).promise;
      let fullText = '';

      for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 50); pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }

      return fullText;
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      throw new Error('Failed to extract text from PDF. Please ensure it is a valid PDF file.');
    }
  },

  async gradeScript(
    imageBase64: string,
    markingScheme: string = "Standard marking scheme for secondary school exam"
  ): Promise<GradingResult> {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const prompt = `You are an expert exam grader. Analyze this student's handwritten exam script.

MARKING SCHEME:
${markingScheme}

GRADING REQUIREMENTS:
1. Extract and read all handwritten text from the image
2. Grade out of 20 based on the marking scheme
3. Identify missing key concepts or keywords
4. Provide constructive feedback
5. Estimate OCR accuracy percentage

Return ONLY a valid JSON object in this format:
{
  "score": <number 0-20>,
  "feedback": "Detailed feedback about the student's work",
  "missingKeywords": ["keyword1", "keyword2"],
  "ocrAccuracy": <number 0-100>
}

Important: Return ONLY the JSON object, no other text.`;

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: "image/jpeg",
      },
    };

    try {
      const result = await model.generateContent([prompt, imagePart]);
      const responseText = result.response.text().trim();

      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
      const gradingData = JSON.parse(jsonStr);

      return {
        score: Math.min(20, Math.max(0, gradingData.score || 0)),
        total: 20,
        feedback: gradingData.feedback || '',
        missingKeywords: gradingData.missingKeywords || [],
        ocrAccuracy: gradingData.ocrAccuracy || 85,
      };
    } catch (error) {
      console.error('Error grading script:', error);
      // Return default response
      return {
        score: 0,
        total: 20,
        feedback: 'Unable to grade script. Please ensure the image is clear and readable.',
        missingKeywords: [],
        ocrAccuracy: 0,
      };
    }
  }
};
