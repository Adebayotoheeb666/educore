import { useEffect, useState } from 'react';
import { Loader, AlertCircle, CheckCircle, Clock, Zap, BookOpen } from 'lucide-react';
import { geminiService } from '../../lib/gemini';
import { rateLimiter } from '../../lib/rateLimiter';
import type { ExamResult } from '../../lib/types';

interface StudyPlanProps {
  results: ExamResult[];
  attendanceRate: number;
  studentName?: string;
  userId: string;
}

interface StudyAction {
  priority: 'high' | 'medium' | 'low';
  action: string;
  subject: string;
  timeframe: string;
  resources?: string[];
}

interface ParsedStudyPlan {
  overallAssessment: string;
  strengths: string[];
  improvements: string[];
  studyPlan: StudyAction[];
  motivationalMessage: string;
}

export function StudyPlan({ results, attendanceRate, userId }: StudyPlanProps) {
  const [plan, setPlan] = useState<ParsedStudyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitWarning, setRateLimitWarning] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

  // Calculate attendance data
  const getStudentContext = (): string => {
    const avgScore = Math.round(results.reduce((sum, r) => sum + r.totalScore, 0) / results.length);
    const subjects = [...new Set(results.map((r) => r.subjectId))].length;
    return `${subjects} subjects with average score ${avgScore}% and ${attendanceRate}% attendance`;
  };

  const handleGeneratePlan = async () => {
    // Check rate limit
    const limit = rateLimiter.checkLimit('generateStudyPlan', userId);
    if (!limit.allowed) {
      setRateLimitWarning(
        `Please wait ${limit.retryAfter} seconds before generating another study plan`
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    setRateLimitWarning(null);

    try {
      // Generate insight using Gemini
      const insight = await geminiService.generateStudentPerformanceInsight(
        results,
        attendanceRate,
        getStudentContext()
      );

      // Parse the response
      const cleanedResponse = insight
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsedPlan: ParsedStudyPlan = JSON.parse(cleanedResponse);

      setPlan(parsedPlan);
      setLastGenerated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate study plan';
      setError(errorMessage);
      console.error('Study plan generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate on first load if no plan exists
  useEffect(() => {
    if (!plan && !isLoading && results.length > 0) {
      handleGeneratePlan();
    }
  }, []); // Only on mount

  if (results.length === 0) {
    return (
      <div className="p-6 bg-dark-card rounded-lg border border-teal-500/20">
        <p className="text-dark-text text-center">No academic data available to generate study plan</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-text">Your Personalized Study Plan</h2>
          <p className="text-dark-text/70 text-sm mt-1">
            AI-generated recommendations based on your academic performance
          </p>
        </div>
        <button
          onClick={handleGeneratePlan}
          disabled={isLoading}
          className="px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-500/50 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
        >
          {isLoading && <Loader size={18} className="animate-spin" />}
          {isLoading ? 'Generating...' : 'Regenerate Plan'}
        </button>
      </div>

      {/* Warnings and Errors */}
      {rateLimitWarning && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-yellow-400 flex-shrink-0 mt-1" size={20} />
          <div>
            <p className="font-semibold text-yellow-400">Rate Limit</p>
            <p className="text-yellow-400/80 text-sm">{rateLimitWarning}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-400 flex-shrink-0 mt-1" size={20} />
          <div>
            <p className="font-semibold text-red-400">Error</p>
            <p className="text-red-400/80 text-sm">{error}</p>
          </div>
        </div>
      )}

      {isLoading && !plan && (
        <div className="p-12 bg-dark-card rounded-lg border border-teal-500/20 text-center">
          <Loader size={40} className="mx-auto mb-4 animate-spin text-teal-400" />
          <p className="text-dark-text">Generating your personalized study plan...</p>
        </div>
      )}

      {plan && (
        <>
          {/* Overall Assessment */}
          <div className="p-6 bg-gradient-to-br from-teal-500/10 to-blue-500/10 rounded-lg border border-teal-500/30">
            <div className="flex items-start gap-4">
              <Zap className="text-teal-400 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="text-lg font-bold text-teal-400 mb-2">Overall Assessment</h3>
                <p className="text-dark-text leading-relaxed">{plan.overallAssessment}</p>
              </div>
            </div>
          </div>

          {/* Strengths and Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="p-6 bg-dark-card rounded-lg border border-green-500/30">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="text-green-400" size={20} />
                <h3 className="text-lg font-bold text-green-400">Your Strengths</h3>
              </div>
              <ul className="space-y-2">
                {plan.strengths.map((strength) => (
                  <li
                    key={`strength-${strength}`}
                    className="p-3 bg-green-500/10 rounded border border-green-500/20 text-dark-text text-sm"
                  >
                    ✓ {strength}
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas to Improve */}
            <div className="p-6 bg-dark-card rounded-lg border border-yellow-500/30">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="text-yellow-400" size={20} />
                <h3 className="text-lg font-bold text-yellow-400">Areas to Improve</h3>
              </div>
              <ul className="space-y-2">
                {plan.improvements.map((improvement, idx) => (
                  <li
                    key={idx}
                    className="p-3 bg-yellow-500/10 rounded border border-yellow-500/20 text-dark-text text-sm"
                  >
                    ⚠ {improvement}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Study Plan Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-dark-text flex items-center gap-2">
              <BookOpen className="text-teal-400" size={20} />
              Your Action Plan
            </h3>

            {/* High Priority Actions */}
            {plan.studyPlan.filter((a) => a.priority === 'high').length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-red-400 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-400 rounded-full" />
                  High Priority - This Week
                </h4>
                <div className="space-y-2">
                  {plan.studyPlan
                    .filter((a) => a.priority === 'high')
                    .map((action, idx) => (
                      <ActionCard key={idx} action={action} />
                    ))}
                </div>
              </div>
            )}

            {/* Medium Priority Actions */}
            {plan.studyPlan.filter((a) => a.priority === 'medium').length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-yellow-400 flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full" />
                  Medium Priority - This Month
                </h4>
                <div className="space-y-2">
                  {plan.studyPlan
                    .filter((a) => a.priority === 'medium')
                    .map((action, idx) => (
                      <ActionCard key={idx} action={action} />
                    ))}
                </div>
              </div>
            )}

            {/* Low Priority Actions */}
            {plan.studyPlan.filter((a) => a.priority === 'low').length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-green-400 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full" />
                  Low Priority - Ongoing
                </h4>
                <div className="space-y-2">
                  {plan.studyPlan
                    .filter((a) => a.priority === 'low')
                    .map((action, idx) => (
                      <ActionCard key={idx} action={action} />
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Motivational Message */}
          <div className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/30">
            <p className="text-lg text-dark-text italic">💪 {plan.motivationalMessage}</p>
          </div>

          {/* Last Generated Time */}
          {lastGenerated && (
            <p className="text-sm text-dark-text/50 text-center">
              Last generated: {lastGenerated.toLocaleString()}
            </p>
          )}
        </>
      )}
    </div>
  );
}

// Action Card Component
function ActionCard({ action }: { action: StudyAction }) {
  const priorityStyles = {
    high: 'bg-red-500/10 border-red-500/20',
    medium: 'bg-yellow-500/10 border-yellow-500/20',
    low: 'bg-green-500/10 border-green-500/20',
  };

  const priorityColor = {
    high: 'text-red-400',
    medium: 'text-yellow-400',
    low: 'text-green-400',
  };

  return (
    <div className={`p-4 rounded-lg border ${priorityStyles[action.priority]}`}>
      <div className="flex items-start gap-3">
        <CheckCircle className={`flex-shrink-0 mt-1 ${priorityColor[action.priority]}`} size={20} />
        <div className="flex-1">
          <h5 className="font-semibold text-dark-text mb-1">{action.action}</h5>
          <div className="flex flex-wrap gap-2 mb-2">
            {action.subject && (
              <span className="px-2 py-1 bg-dark-bg rounded text-xs font-semibold text-teal-400">
                {action.subject}
              </span>
            )}
            {action.timeframe && (
              <span className="px-2 py-1 bg-dark-bg rounded text-xs font-semibold text-dark-text/70 flex items-center gap-1">
                <Clock size={12} />
                {action.timeframe}
              </span>
            )}
          </div>
          {action.resources && action.resources.length > 0 && (
            <div className="text-xs text-dark-text/60">
              <p className="mb-1 font-semibold">Resources:</p>
              <ul className="list-disc list-inside">
                {action.resources.slice(0, 2).map((resource, idx) => (
                  <li key={idx}>{resource}</li>
                ))}
                {action.resources.length > 2 && (
                  <li>+{action.resources.length - 2} more</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
