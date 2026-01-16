import { AlertCircle, CheckCircle, Trophy, TrendingDown } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { ExamResult } from '../../lib/types';

interface SubjectBreakdownProps {
  results: ExamResult[];
  currentTermId?: string;
}

interface SubjectPerformance {
  subjectId: string;
  subjectName: string;
  caScore: number;
  examScore: number;
  totalScore: number;
  grade: string;
  teacher?: string;
  performanceStatus: 'excellent' | 'good' | 'average' | 'poor';
  trend?: 'improving' | 'stable' | 'declining';
  previousScore?: number;
}

const GRADE_SCALE = {
  'A': { min: 80, max: 100, color: 'text-green-400', bg: 'bg-green-400/10' },
  'B': { min: 70, max: 79, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  'C': { min: 60, max: 69, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  'D': { min: 50, max: 59, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  'F': { min: 0, max: 49, color: 'text-red-400', bg: 'bg-red-400/10' },
};

function getGrade(score: number): string {
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

function getPerformanceStatus(score: number): 'excellent' | 'good' | 'average' | 'poor' {
  if (score >= 80) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 60) return 'average';
  return 'poor';
}

export function SubjectBreakdown({ results, currentTermId }: SubjectBreakdownProps) {
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  const subjectPerformances = useMemo<SubjectPerformance[]>(() => {
    if (!results || results.length === 0) return [];

    // Group by subject
    const groupedBySubject: Record<string, ExamResult[]> = {};

    results.forEach((result) => {
      if (!groupedBySubject[result.subjectId]) {
        groupedBySubject[result.subjectId] = [];
      }
      groupedBySubject[result.subjectId].push(result);
    });

    // Calculate performance for each subject
    const performances: SubjectPerformance[] = Object.entries(groupedBySubject).map(
      ([subjectId, subjectResults]) => {
        // Get results for current term (or latest if not specified)
        const sortedByTerm = subjectResults.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        const currentTerm = sortedByTerm[0];
        const previousTerm = sortedByTerm[1];

        const grade = getGrade(currentTerm.totalScore);
        const status = getPerformanceStatus(currentTerm.totalScore);

        let trend: 'improving' | 'stable' | 'declining' | undefined;
        if (previousTerm) {
          const diff = currentTerm.totalScore - previousTerm.totalScore;
          if (diff > 2) trend = 'improving';
          else if (diff < -2) trend = 'declining';
          else trend = 'stable';
        }

        return {
          subjectId,
          subjectName: currentTerm.subject || subjectId,
          caScore: currentTerm.caScore,
          examScore: currentTerm.examScore,
          totalScore: currentTerm.totalScore,
          grade,
          teacher: currentTerm.teacher_id, // Assuming teacher_id is available
          performanceStatus: status,
          trend,
          previousScore: previousTerm ? previousTerm.totalScore : undefined,
        };
      }
    );

    return performances.sort((a, b) => b.totalScore - a.totalScore);
  }, [results]);

  if (!results || results.length === 0) {
    return (
      <div className="p-6 bg-dark-card rounded-lg border border-teal-500/20">
        <p className="text-dark-text text-center">No subject data available yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-dark-text mb-2">Subject Performance</h2>
        <p className="text-dark-text/70">Detailed breakdown of your performance in each subject</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subjectPerformances.map((subject) => (
          <SubjectCard
            key={subject.subjectId}
            subject={subject}
            isExpanded={expandedSubject === subject.subjectId}
            onToggle={() =>
              setExpandedSubject(
                expandedSubject === subject.subjectId ? null : subject.subjectId
              )
            }
          />
        ))}
      </div>

      {/* Overall Summary */}
      <div className="mt-8 p-6 bg-dark-card rounded-lg border border-teal-500/20">
        <h3 className="text-lg font-bold mb-4 text-teal-400">Overall Subject Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard
            label="Total Subjects"
            value={subjectPerformances.length.toString()}
            icon="📚"
          />
          <SummaryCard
            label="Average Score"
            value={`${Math.round(
              subjectPerformances.reduce((sum, s) => sum + s.totalScore, 0) /
                subjectPerformances.length
            )}%`}
            icon="📊"
          />
          <SummaryCard
            label="Best Subject"
            value={subjectPerformances[0]?.subjectName || 'N/A'}
            icon="🏆"
          />
          <SummaryCard
            label="Excellent Grades"
            value={subjectPerformances
              .filter((s) => s.performanceStatus === 'excellent')
              .length.toString()}
            icon="⭐"
          />
        </div>
      </div>
    </div>
  );
}

// Subject Card Component
function SubjectCard({
  subject,
  isExpanded,
  onToggle,
}: {
  subject: SubjectPerformance;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const grade = GRADE_SCALE[subject.grade as keyof typeof GRADE_SCALE] || GRADE_SCALE.F;

  return (
    <div
      className={`p-4 bg-dark-card rounded-lg border transition-all cursor-pointer ${
        isExpanded
          ? 'border-teal-500 ring-1 ring-teal-500/30'
          : 'border-teal-500/20 hover:border-teal-500/50'
      }`}
      onClick={onToggle}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-dark-text">{subject.subjectName}</h3>
          {subject.teacher && (
            <p className="text-sm text-dark-text/70">Teacher: {subject.teacher}</p>
          )}
        </div>

        {/* Grade Badge */}
        <div
          className={`px-3 py-1 rounded-full font-bold text-lg ${grade.color} ${grade.bg} border border-current/30`}
        >
          {subject.grade}
        </div>
      </div>

      {/* Main Scores */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <ScoreBox label="CA" value={subject.caScore} max={40} />
        <ScoreBox label="Exam" value={subject.examScore} max={60} />
        <ScoreBox label="Total" value={subject.totalScore} max={100} highlight />
      </div>

      {/* Status Indicator */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          {subject.performanceStatus === 'excellent' && (
            <div className="flex items-center gap-1 text-green-400">
              <CheckCircle size={16} />
              <span className="text-sm font-semibold">Excellent</span>
            </div>
          )}
          {subject.performanceStatus === 'good' && (
            <div className="flex items-center gap-1 text-blue-400">
              <CheckCircle size={16} />
              <span className="text-sm font-semibold">Good</span>
            </div>
          )}
          {subject.performanceStatus === 'average' && (
            <div className="flex items-center gap-1 text-yellow-400">
              <Trophy size={16} />
              <span className="text-sm font-semibold">Average</span>
            </div>
          )}
          {subject.performanceStatus === 'poor' && (
            <div className="flex items-center gap-1 text-red-400">
              <AlertCircle size={16} />
              <span className="text-sm font-semibold">Needs Improvement</span>
            </div>
          )}

          {/* Trend */}
          {subject.trend && subject.previousScore !== undefined && (
            <div
              className={`ml-auto text-sm font-semibold ${
                subject.trend === 'improving'
                  ? 'text-green-400'
                  : subject.trend === 'declining'
                  ? 'text-red-400'
                  : 'text-yellow-400'
              }`}
            >
              {subject.trend === 'improving' && '↗ Improving'}
              {subject.trend === 'declining' && '↘ Declining'}
              {subject.trend === 'stable' && '→ Stable'}
              {` (${subject.totalScore - subject.previousScore > 0 ? '+' : ''}${subject.totalScore - subject.previousScore}%)`}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-dark-bg rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all ${
              subject.performanceStatus === 'excellent'
                ? 'bg-green-400'
                : subject.performanceStatus === 'good'
                ? 'bg-blue-400'
                : subject.performanceStatus === 'average'
                ? 'bg-yellow-400'
                : 'bg-red-400'
            }`}
            style={{ width: `${subject.totalScore}%` }}
          />
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-teal-500/20 pt-4 mt-4 space-y-3">
          {subject.previousScore !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-dark-text/70">Previous Term Score</span>
              <span className="font-semibold text-dark-text">{subject.previousScore}%</span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-dark-text/70">CA/Exam Ratio</span>
            <span className="font-semibold text-dark-text">
              {((subject.caScore / 40) * 100).toFixed(0)}% / {((subject.examScore / 60) * 100).toFixed(0)}%
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-dark-text/70">Performance Status</span>
            <span className="text-sm px-2 py-1 rounded bg-teal-500/20 text-teal-400 font-semibold">
              {subject.performanceStatus === 'excellent' && '🎯 Excellent'}
              {subject.performanceStatus === 'good' && '✅ Good'}
              {subject.performanceStatus === 'average' && '⚠️ Average'}
              {subject.performanceStatus === 'poor' && '❌ Needs Work'}
            </span>
          </div>

          {/* Recommended Action */}
          <div className="mt-4 p-3 bg-dark-bg rounded border border-teal-500/10">
            <p className="text-sm text-dark-text/80">
              {subject.performanceStatus === 'excellent' &&
                '🌟 Keep up the excellent work! Consider helping classmates.'}
              {subject.performanceStatus === 'good' &&
                '✨ Good performance! Review weak topics to improve further.'}
              {subject.performanceStatus === 'average' &&
                '📚 Focus on mastering key concepts. Consider extra practice.'}
              {subject.performanceStatus === 'poor' &&
                '💪 This needs attention. Seek help from your teacher or a tutor.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Score Box Component
function ScoreBox({
  label,
  value,
  max,
  highlight,
}: {
  label: string;
  value: number;
  max: number;
  highlight?: boolean;
}) {
  const percentage = (value / max) * 100;
  const color =
    percentage >= 80 ? 'text-green-400' : percentage >= 70 ? 'text-blue-400' : percentage >= 60 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div
      className={`p-3 rounded text-center border ${
        highlight
          ? 'bg-teal-500/10 border-teal-500/30'
          : 'bg-dark-bg border-teal-500/10'
      }`}
    >
      <p className="text-xs text-dark-text/70 font-semibold uppercase">{label}</p>
      <p className={`text-xl font-bold ${color}`}>
        {value}/{max}
      </p>
      <p className="text-xs text-dark-text/50 mt-1">{Math.round(percentage)}%</p>
    </div>
  );
}

// Summary Card Component
function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="p-4 bg-dark-bg rounded border border-teal-500/10 text-center hover:border-teal-500/30 transition-colors">
      <p className="text-2xl mb-2">{icon}</p>
      <p className="text-sm text-dark-text/70 mb-1">{label}</p>
      <p className="text-lg font-bold text-teal-400">{value}</p>
    </div>
  );
}
