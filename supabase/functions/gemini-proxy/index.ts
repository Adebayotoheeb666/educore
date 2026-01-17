// @ts-nocheck
// ============================================
// GEMINI PROXY EDGE FUNCTION
// ============================================
// This Edge Function proxies all Gemini API calls from the client.
// Benefits:
// 1. API key never exposed to client
// 2. Rate limiting can be enforced server-side
// 3. Requests can be logged and audited
// 4. Cost can be tracked per school/user
//
// Deploy: supabase functions deploy gemini-proxy
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.24.1";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

interface RequestBody {
  action: "generateLessonNote" | "generateQuestions" | "gradeScript" | "generateStudentPerformanceInsight" | "chatWithStudyAssistant" | "predictAttendanceIssues" | "extractTextFromPDF";
  params: Record<string, unknown>;
  schoolId: string;
  userId: string;
}

interface RateLimitError {
  error: string;
  retryAfter?: number;
}

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

async function checkRateLimitDB(
  userId: string,
  schoolId: string,
  limit: number = 10,
  windowMs: number = 60000
): Promise<boolean> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowMs);

  // 1. Find or create rate limit record
  const { data: existing, error: fetchError } = await supabase
    .from("api_rate_limits")
    .select("*")
    .eq("user_id", userId)
    .eq("endpoint", "gemini-proxy")
    .gt("window_end", now.toISOString())
    .maybeSingle();

  if (fetchError) {
    console.error("Rate limit fetch error:", fetchError);
    return true; // Fail open if DB error
  }

  if (!existing) {
    // Create new window
    const { error: insertError } = await supabase.from("api_rate_limits").insert({
      user_id: userId,
      school_id: schoolId,
      endpoint: "gemini-proxy",
      request_count: 1,
      window_start: now.toISOString(),
      window_end: windowEnd.toISOString(),
    });
    if (insertError) console.error("Rate limit insert error:", insertError);
    return true;
  }

  // 2. Check if limit exceeded
  if (existing.request_count >= limit) {
    return false;
  }

  // 3. Increment count
  await supabase
    .from("api_rate_limits")
    .update({ request_count: existing.request_count + 1 })
    .eq("id", existing.id);

  return true;
}

async function generateLessonNote(params: any) {
  const { topic, subject, level, options } = params;

  if (!topic || !subject || !level) {
    throw new Error("Missing required parameters: topic, subject, level");
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  let prompt = `Generate a comprehensive lesson note for ${level} ${subject} on the topic "${topic}" following the Nigerian NERDC curriculum.`;

  if (level === "Creche" || level.includes("Nursery")) {
    prompt += `\n- DEVELOPMENTAL FOCUS: Early Years Foundation. Use very simple language, focus on sensory play, rhymes, and visual aids. Keep sections extremely short and engaging.`;
  } else if (level.includes("Primary")) {
    prompt += `\n- DEVELOPMENTAL FOCUS: Primary level. Use clear, concrete examples and include interactive classroom activities.`;
  }

  if (options?.personalization === "advanced") {
    prompt += `\n- TARGET AUDIENCE: Advanced learners. Use more complex terminology and include challenging extension activities.`;
  } else if (options?.personalization === "support") {
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
}

async function generateQuestions(params: any) {
  const { context, count = 10, mcqRatio = 0.6, difficultyLevel = 50 } = params;

  if (!context) {
    throw new Error("Missing required parameter: context");
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const mcqCount = Math.ceil(count * mcqRatio);
  const essayCount = count - mcqCount;
  const difficulty = difficultyLevel < 33 ? "easy" : difficultyLevel < 67 ? "intermediate" : "difficult (WAEC standard)";

  const prompt = `Generate exactly ${count} examination questions from the following content. ${mcqCount} should be multiple-choice (easy to answer, ~2 mins each) and ${essayCount} should be essay questions. Difficulty level: ${difficulty}.

Content:
${context}

Return ONLY a valid JSON array with this structure:
[
  { "type": "mcq", "text": "...", "options": ["A", "B", "C", "D"], "answer": "A" },
  { "type": "essay", "text": "..." }
]

Do not include any markdown formatting or code blocks. Return ONLY the JSON array.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Failed to parse AI-generated questions as JSON");
  }
}

async function gradeScript(params: any) {
  const { imageBase64, markingScheme } = params;

  if (!imageBase64 || !markingScheme) {
    throw new Error("Missing required parameters: imageBase64, markingScheme");
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const imageParts = [
    {
      inlineData: {
        data: imageBase64,
        mimeType: "image/jpeg",
      },
    },
  ];

  const prompt = `You are an expert teacher grading an examination script. Grade this script according to the marking scheme below and return ONLY a JSON object.

Marking Scheme:
${markingScheme}

Return ONLY this JSON format (no other text):
{
  "score": number,
  "total": number,
  "feedback": "string",
  "missingKeywords": ["array", "of", "keywords"],
  "ocrAccuracy": 0.95
}`;

  const result = await model.generateContent([...imageParts, prompt]);
  const text = result.response.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Failed to parse grading result as JSON");
  }
}

async function generateStudentPerformanceInsight(params: any) {
  const { results, attendanceRate, studentContext } = params;

  if (!results) {
    throw new Error("Missing required parameter: results");
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `As an educational analyst, provide a brief but insightful performance summary for a student.

Student Data:
- Attendance Rate: ${attendanceRate}%
- Test Scores: ${JSON.stringify(results)}
${studentContext ? `- Context: ${studentContext}` : ""}

Provide a JSON response with this structure:
{
  "summary": "1-2 sentence overview",
  "strongSubjects": ["subject1", "subject2"],
  "weakSubjects": ["subject1", "subject2"],
  "recommendations": ["action1", "action2"],
  "aiInsight": "1 paragraph analysis"
}

Return ONLY the JSON, no other text.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Failed to parse performance insight as JSON");
  }
}

async function chatWithStudyAssistant(params: any) {
  const { message, history = [], studentContext } = params;

  if (!message) {
    throw new Error("Missing required parameter: message");
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const systemPrompt = `You are a helpful AI tutor assisting a student with their academics. Be encouraging, clear, and concise. Use the student's context to personalize your responses.

${studentContext ? `Student Context: ${studentContext}` : ""}

Chat naturally but keep responses to 2-3 paragraphs maximum.`;

  const contents = [
    {
      role: "user",
      parts: [{ text: systemPrompt }],
    },
    ...history.map((h: any) => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.content }],
    })),
    {
      role: "user",
      parts: [{ text: message }],
    },
  ];

  const result = await model.generateContent({ contents });
  return result.response.text();
}

async function predictAttendanceIssues(params: any) {
  const { attendanceData, recentCount = 5 } = params;

  if (!attendanceData) {
    throw new Error("Missing required parameter: attendanceData");
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Analyze this attendance data and predict potential attendance issues. Return JSON only.

Attendance Data (last ${recentCount} records):
${JSON.stringify(attendanceData)}

Return this JSON structure:
{
  "riskLevel": "low|medium|high",
  "pattern": "description of pattern",
  "prediction": "what might happen",
  "suggestion": "recommended action"
}

Return ONLY the JSON, no other text.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Failed to parse attendance prediction as JSON");
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { action, params, schoolId, userId } = (await req.json()) as RequestBody;

    // Validate authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Rate limiting (Distributed via DB)
    const allowed = await checkRateLimitDB(userId, schoolId, 15, 60000); // Slightly higher limit
    if (!allowed) {
      const response: RateLimitError = {
        error: "Rate limit exceeded. Maximum 15 requests per minute.",
        retryAfter: 60,
      };
      return new Response(JSON.stringify(response), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "60",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Validate required fields
    if (!action || !params || !schoolId || !userId) {
      return new Response(JSON.stringify({ error: "Missing required fields: action, params, schoolId, userId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Route to appropriate handler
    let result;
    switch (action) {
      case "generateLessonNote":
        result = await generateLessonNote(params);
        break;
      case "generateQuestions":
        result = await generateQuestions(params);
        break;
      case "gradeScript":
        result = await gradeScript(params);
        break;
      case "generateStudentPerformanceInsight":
        result = await generateStudentPerformanceInsight(params);
        break;
      case "chatWithStudyAssistant":
        result = await chatWithStudyAssistant(params);
        break;
      case "predictAttendanceIssues":
        result = await predictAttendanceIssues(params);
        break;
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Gemini proxy error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to process Gemini request",
        details: errorMessage,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
