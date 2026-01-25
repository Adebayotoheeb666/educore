/**
 * SECURITY HARDENED GEMINI SERVICE
 * ================================
 * This service proxies all Gemini API calls through a Supabase Edge Function.
 * Benefits:
 * 1. API key is never exposed to the client
 * 2. Server-side rate limiting is enforced
 * 3. All requests can be logged and audited
 * 4. Requests are batched and optimized server-side
 *
 * Migration Notes:
 * - Remove direct GoogleGenerativeAI client initialization
 * - All calls now go through geminiProxyRequest()
 * - Error handling is improved with retry logic
 * - Rate limiting warnings are shown to users
 */

import type { UserProfile } from './types';
import { rateLimiter, retryWithBackoff } from './rateLimiter';

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

// ============================================
// EDGE FUNCTION PROXY
// ============================================

/**
 * Proxy a request to the Gemini Edge Function
 * Handles authentication, rate limiting, and error handling
 */
async function geminiProxyRequest(
  action: string,
  params: Record<string, unknown>,
  userProfile: UserProfile
): Promise<any> {
  try {
    // Import supabase only when needed
    const { supabase } = await import('./supabase');

    // Check client-side rate limit first
    const rateLimitCheck = rateLimiter.checkLimit(action, userProfile.id);
    if (!rateLimitCheck.allowed) {
      throw new Error(
        `Rate limit exceeded for ${action}. Please wait ${rateLimitCheck.retryAfter} seconds before trying again.`
      );
    }

    // Get auth token
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Authentication required. Please log in.');
    }

    // Prepare request
    const requestBody = {
      action,
      params,
      schoolId: userProfile.schoolId,
      userId: userProfile.id,
    };

    // Get edge function URL
    const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-proxy`;

    // Make request with retry logic
    const makeRequest = async () => {
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle rate limiting from server
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After') || '60';
          throw new Error(
            `Server rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`
          );
        }

        throw new Error(
          errorData.details || errorData.error || 'Failed to process request'
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Request failed');
      }

      return result.data;
    };

    // Retry with exponential backoff
    return retryWithBackoff(makeRequest, {
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
    });
  } catch (error) {
    console.error(`Gemini proxy error for action ${action}:`, error);
    throw error instanceof Error ? error : new Error('Gemini service error');
  }
}

// ============================================
// GET CURRENT USER PROFILE (helper)
// ============================================

let cachedProfile: UserProfile | null = null;

async function getCurrentUserProfile(): Promise<UserProfile> {
  if (cachedProfile) return cachedProfile;

  try {
    // Import supabase only when needed
    const { supabase } = await import('./supabase');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('User not authenticated');

    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!data) throw new Error('User profile not found');

    // Convert snake_case to camelCase
    cachedProfile = {
      id: data.id,
      fullName: data.full_name,
      email: data.email,
      role: data.role,
      schoolId: data.school_id,
      admissionNumber: data.admission_number,
      staffId: data.staff_id,
      assignedClasses: data.assigned_classes,
      assignedSubjects: data.assigned_subjects,
      phoneNumber: data.phone_number,
      profileImage: data.profile_image,
      linkedStudents: data.linked_students,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return cachedProfile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to load user profile. Please refresh and try again.'
    );
  }
}

/**
 * Clear cached profile (call after user update)
 */
export function clearProfileCache() {
  cachedProfile = null;
}

// ============================================
// GEMINI SERVICE IMPLEMENTATION
// ============================================

export const geminiService = {
  /**
   * Generate a lesson note using Gemini AI via Edge Function
   */
  async generateLessonNote(
    topic: string,
    subject: string,
    level: string,
    options?: { personalization?: string; translation?: boolean; waecFocus?: boolean }
  ): Promise<string> {
    try {
      const userProfile = await getCurrentUserProfile();

      return await geminiProxyRequest(
        'generateLessonNote',
        { topic, subject, level, options },
        userProfile
      );
    } catch (error) {
      console.error('Lesson generation error:', error);
      throw error instanceof Error
        ? error
        : new Error('Failed to generate lesson note');
    }
  },

  /**
   * Generate exam questions using Gemini AI via Edge Function
   */
  async generateQuestions(
    context: string,
    count: number = 10,
    mcqRatio: number = 0.6,
    difficultyLevel: number = 50
  ): Promise<(MCQuestion | EssayQuestion)[]> {
    try {
      const userProfile = await getCurrentUserProfile();

      const questions = await geminiProxyRequest(
        'generateQuestions',
        { context, count, mcqRatio, difficultyLevel },
        userProfile
      );

      return questions.map((q: any, idx: number) =>
        q.type === 'mcq'
          ? {
              id: idx + 1,
              type: 'mcq' as const,
              text: q.text || q.question,
              options: q.options || [],
              answer: q.answer || '',
            }
          : {
              id: idx + 1,
              type: 'essay' as const,
              text: q.text || q.question,
            }
      );
    } catch (error) {
      console.error('Question generation error:', error);
      return [];
    }
  },

  /**
   * Extract text from PDF (remains client-side as it's local processing)
   */
  async extractTextFromPDF(fileData: ArrayBuffer): Promise<string> {
    try {
      // Dynamic import with proper error handling
      let pdfjsLib: any;
      try {
        const module = await import('pdfjs-dist');
        pdfjsLib = module.default || module;
      } catch (importError) {
        console.error('Failed to import pdfjs-dist:', importError);
        throw new Error('PDF processing library is not available');
      }

      const pdf = await pdfjsLib.getDocument({ data: fileData }).promise;
      let fullText = '';

      for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 50); pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      return fullText;
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error(
        'Failed to extract text from PDF. Please ensure it is a valid PDF file.'
      );
    }
  },

  /**
   * Grade a handwritten exam script using Gemini AI via Edge Function
   */
  async gradeScript(
    imageBase64: string,
    markingScheme: string = 'Standard marking scheme for secondary school exam'
  ): Promise<GradingResult> {
    try {
      const userProfile = await getCurrentUserProfile();

      const result = await geminiProxyRequest(
        'gradeScript',
        { imageBase64, markingScheme },
        userProfile
      );

      return {
        score: Math.min(20, Math.max(0, result.score || 0)),
        total: 20,
        feedback: result.feedback || '',
        missingKeywords: result.missingKeywords || [],
        ocrAccuracy: result.ocrAccuracy || 85,
      };
    } catch (error) {
      console.error('Script grading error:', error);
      return {
        score: 0,
        total: 20,
        feedback:
          'Unable to grade script. Please ensure the image is clear and readable.',
        missingKeywords: [],
        ocrAccuracy: 0,
      };
    }
  },

  /**
   * Generate student performance insight using Gemini AI via Edge Function
   */
  async generateStudentPerformanceInsight(
    results: any[],
    attendanceRate: number,
    studentContext?: string
  ): Promise<string> {
    try {
      const userProfile = await getCurrentUserProfile();

      return await geminiProxyRequest(
        'generateStudentPerformanceInsight',
        { results, attendanceRate, studentContext },
        userProfile
      );
    } catch (error) {
      console.error('Performance insight error:', error);
      return 'Unable to generate insights at this time. Please try again later.';
    }
  },

  /**
   * Chat with AI study assistant using Gemini AI via Edge Function
   */
  async chatWithStudyAssistant(
    message: string,
    history?: { role: 'user' | 'model'; content: string }[],
    studentContext?: string
  ): Promise<string> {
    try {
      const userProfile = await getCurrentUserProfile();

      return await geminiProxyRequest(
        'chatWithStudyAssistant',
        { message, history, studentContext },
        userProfile
      );
    } catch (error) {
      console.error('Study assistant error:', error);
      throw error instanceof Error
        ? error
        : new Error('Failed to get response from AI assistant');
    }
  },

  /**
   * Predict attendance issues using Gemini AI via Edge Function
   */
  async predictAttendanceIssues(
    attendanceData: any[],
    recentCount: number = 5
  ): Promise<string> {
    try {
      const userProfile = await getCurrentUserProfile();

      return await geminiProxyRequest(
        'predictAttendanceIssues',
        { attendanceData, recentCount },
        userProfile
      );
    } catch (error) {
      console.error('Attendance prediction error:', error);
      return 'Unable to generate prediction at this time. Please try again later.';
    }
  },

  /**
   * Get rate limit status for a specific action
   */
  getRateLimitStatus(action: string, userId: string) {
    const remaining = rateLimiter.getRemainingRequests(action, userId);
    const isApproaching = remaining <= 2;
    const config = rateLimiter.getLimits()[action] || { maxRequests: 10 };

    return {
      action,
      remaining,
      limit: config.maxRequests,
      isApproaching,
      warningMessage: isApproaching
        ? `Only ${remaining} requests remaining for ${action}`
        : null,
    };
  },
};
