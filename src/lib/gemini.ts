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
  async generateLessonNote(topic: string, subject: string, level: string, options?: { personalization?: string, translation?: boolean, waecFocus?: boolean }) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let prompt = `Generate a comprehensive lesson note for ${level} ${subject} on the topic "${topic}" following the Nigerian NERDC curriculum.`;

    // Developmental adjustments for younger years
    if (level === 'Creche' || level.includes('Nursery')) {
      prompt += `\n- DEVELOPMENTAL FOCUS: Early Years Foundation. Use very simple language, focus on sensory play, rhymes, and visual aids. Keep sections extremely short and engaging.`;
    } else if (level.includes('Primary')) {
      prompt += `\n- DEVELOPMENTAL FOCUS: Primary level. Use clear, concrete examples and include interactive classroom activities.`;
    }

    if (options?.personalization === 'advanced') {
      prompt += `\n- TARGET AUDIENCE: Advanced learners. Use more complex terminology and include challenging extension activities.`;
    } else if (options?.personalization === 'support') {
      prompt += `\n- TARGET AUDIENCE: Students needing extra support. Use simpler language, break down complex concepts further, and include foundational drills.`;
    }

    if (options?.translation) {
      prompt += `\n- LANGUAGE SUPPORT: Include a final section titled "Local Context Keywords" that translates 5-7 key technical terms from this lesson into Yoruba, Hausa, and Igbo with brief explanations.`;
    }

    if (options?.waecFocus) {
      prompt += `\n- EXAM FOCUS: Highlight concepts that frequently appear in WAEC/NECO/JAMB examinations.`;
    }

    prompt += `\n\nStructure the note exactly like a standard Nigerian lesson plan:
    1. Prerequisite Knowledge (Entry Behavior)
    2. Performance Objectives (SMART)
    3. Content (Detailed notes breaking down themes)
    4. Instructional Materials (Suggested local resources)
    5. Presentation (Teacher and Student Activities)
    6. Local Context/Nigerian Examples
    7. Evaluation (Short quiz/questions).
    
    Format in professional Markdown.`;

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
  },

  async generateStudentPerformanceInsight(results: any[], attendanceRate: number) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an AI educational counselor. Analyze the following student performance data and provide a concise, encouraging, and professional progress report for the student and their parents.
    
    DATA:
    - Results: ${JSON.stringify(results)}
    - Attendance Rate: ${attendanceRate}%
    
    REQUIREMENTS:
    1. Summarize overall performance (Distinction, Credit, or Needs Improvement).
    2. Identify the strongest and weakest subjects.
    3. Note the impact of attendance on their performance.
    4. Provide 3 specific, actionable "Next Steps" for improvement.
    5. Output in professional Markdown format, keeping it under 250 words.
    
    Tone: Encouraging, Nigerian educational context.`;

    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      console.error("AI Insight Error:", err);
      return "Unable to generate insights at this time. Please try again later.";
    }
  },

  async chatWithStudyAssistant(message: string, history: { role: 'user' | 'model', parts: string }[], studentContext: string) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{
            text: `You are the EduCore AI Study Assistant. Your goal is to help Nigerian students succeed in their exams (WAEC/NECO/JAMB).
          
          STUDENT CONTEXT:
          ${studentContext}
          
          INSTRUCTIONS:
          - Be encouraging and helpful.
          - Suggest relevant study topics based on their context.
          - Answer academic questions clearly.
          - Use Nigerian examples where possible.` }]
        },
        {
          role: "model",
          parts: [{ text: "Hello! I am your EduCore AI Study Assistant. I've analyzed your academic records and I'm ready to help you excel. What would you like to study today?" }]
        },
        ...history.map(h => ({ role: h.role, parts: [{ text: h.parts }] }))
      ]
    });

    const result = await chat.sendMessage(message);
    return result.response.text();
  },

  async predictAttendanceIssues(attendanceData: any[]) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analyze the following student attendance data and predict potential absence patterns or students at risk of falling below the 75% attendance threshold required for exams.

DATA:
${JSON.stringify(attendanceData)}

REQUIREMENTS:
1. Identify students with declining attendance trends.
2. Highlight any class-wide patterns (e.g., lower attendance on specific days).
3. Provide 3 proactive recommendations for the teacher.
4. Output in a concise, professional Markdown format.

Tone: Professional, Nigerian educational context.`;

    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      console.error("Attendance Prediction Error:", err);
      return "Unable to generate prediction at this time. Please try again later.";
    }
  }
};
