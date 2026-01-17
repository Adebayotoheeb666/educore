import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ExamResult } from '../../lib/types';

interface PerformanceChartProps {
  results: ExamResult[];
  terms?: Array<{ id: string; name: string; startDate: string; endDate: string }>;
}

interface SubjectTrend {
  subject: string;
  trend: 'improving' | 'declining' | 'stable';
  currentScore: number;
  previousScore?: number;
  change?: number;
}

interface TermData {
  term: string;
  [key: string]: number | string;
}

export function PerformanceChart({ results }: PerformanceChartProps) {
  const [chartData, setChartData] = useState<TermData[]>([]);
  const [subjectTrends, setSubjectTrends] = useState<SubjectTrend[]>([]);
  const [termScores, setTermScores] = useState<TermData[]>([]);

  useEffect(() => {
    if (!results || results.length === 0) return;

    // Group results by term and subject
    const resultsByTerm: Record<string, Record<string, ExamResult[]>> = {};

    results.forEach((result) => {
      if (!resultsByTerm[result.term]) {
        resultsByTerm[result.term] = {};
      }
      if (!resultsByTerm[result.term][result.subjectId]) {
        resultsByTerm[result.term][result.subjectId] = [];
      }
      resultsByTerm[result.term][result.subjectId].push(result);
    });

    // Calculate average scores per term for line chart
    const lineChartData: TermData[] = Object.entries(resultsByTerm)
      .sort(([termA], [termB]) => termA.localeCompare(termB))
      .map(([term, subjects]) => {
        const data: TermData = { term };
        let totalScore = 0;
        let count = 0;

        Object.entries(subjects).forEach(([subjectId, subjectResults]) => {
          const avgScore = subjectResults.reduce((sum, r) => sum + r.totalScore, 0) / subjectResults.length;
          data[subjectId] = Math.round(avgScore);
          totalScore += avgScore;
          count++;
        });

        data.average = Math.round(totalScore / count);
        return data;
      });

    // Calculate subject trends (most recent term comparison)
    const sortedTerms = Object.keys(resultsByTerm).sort().reverse();
    const latestTerm = sortedTerms[0];
    const previousTerm = sortedTerms[1];

    const trends: SubjectTrend[] = [];
    const uniqueSubjects = new Set<string>();

    results.forEach((r) => {
      uniqueSubjects.add(r.subjectId);
    });

    uniqueSubjects.forEach((subjectId) => {
      const latestResults = resultsByTerm[latestTerm]?.[subjectId] || [];
      const previousResults = previousTerm ? resultsByTerm[previousTerm]?.[subjectId] : [];

      if (latestResults.length > 0) {
        const currentScore = latestResults.reduce((sum, r) => sum + r.totalScore, 0) / latestResults.length;
        const previousScore = previousResults.length > 0
          ? previousResults.reduce((sum, r) => sum + r.totalScore, 0) / previousResults.length
          : undefined;

        let trend: 'improving' | 'declining' | 'stable' = 'stable';
        let change: number | undefined;

        if (previousScore !== undefined) {
          change = currentScore - previousScore;
          if (change > 2) trend = 'improving';
          else if (change < -2) trend = 'declining';
        }

        // Get subject name from first result
        const subjectName = (latestResults[0] as any)?.subject || subjectId;

        trends.push({
          subject: subjectName,
          trend,
          currentScore: Math.round(currentScore),
          previousScore: previousScore ? Math.round(previousScore) : undefined,
          change: change ? Math.round(change * 10) / 10 : undefined,
        });
      }
    });

    // Calculate current term subject scores for bar chart
    const currentTermResults = results.filter((r) => r.term === latestTerm);
    const subjectScores: TermData[] = [];
    const subjectMap: Record<string, ExamResult[]> = {};

    currentTermResults.forEach((result) => {
      if (!subjectMap[result.subjectId]) {
        subjectMap[result.subjectId] = [];
      }
      subjectMap[result.subjectId].push(result);
    });

    Object.entries(subjectMap).forEach(([subjectId, results]) => {
      const avg = results.reduce((sum, r) => sum + r.totalScore, 0) / results.length;
      subjectScores.push({
        term: latestTerm,
        subject: (results[0] as any)?.subject || subjectId,
        score: Math.round(avg),
      });
    });

    setChartData(lineChartData);
    setSubjectTrends(trends.sort((a, b) => b.currentScore - a.currentScore));
    setTermScores(subjectScores);
  }, [results]);

  if (!results || results.length === 0) {
    return (
      <div className="p-6 bg-dark-card rounded-lg border border-teal-500/20">
        <p className="text-dark-text text-center">No performance data available yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Performance Trend */}
      <div className="p-6 bg-dark-card rounded-lg border border-teal-500/20">
        <h2 className="text-xl font-bold mb-4 text-teal-400">Performance Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="term" stroke="#999" />
            <YAxis stroke="#999" domain={[0, 100]} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #teal-500' }}
              formatter={(value) => [`${value}%`, '']}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="average"
              stroke="#009688"
              strokeWidth={3}
              dot={{ fill: '#009688', r: 6 }}
              activeDot={{ r: 8 }}
              name="Average Score"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Subject Performance Breakdown */}
      <div className="p-6 bg-dark-card rounded-lg border border-teal-500/20">
        <h2 className="text-xl font-bold mb-4 text-teal-400">Current Term by Subject</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={termScores}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="subject" stroke="#999" angle={-45} textAnchor="end" height={80} />
            <YAxis stroke="#999" domain={[0, 100]} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #teal-500' }}
              formatter={(value) => [`${value}%`, 'Score']}
            />
            <Bar dataKey="score" fill="#009688" name="Score" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Subject Trends Overview */}
      <div className="p-6 bg-dark-card rounded-lg border border-teal-500/20">
        <h2 className="text-xl font-bold mb-4 text-teal-400">Subject Performance & Trends</h2>
        <div className="space-y-3">
          {subjectTrends.map((trend) => (
            <div key={trend.subject} className="p-4 bg-dark-bg rounded border border-teal-500/10 hover:border-teal-500/30 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-dark-text">{trend.subject}</h3>
                    {trend.trend === 'improving' && (
                      <div className="flex items-center gap-1 text-green-400">
                        <TrendingUp size={18} />
                        <span className="text-sm">Improving</span>
                      </div>
                    )}
                    {trend.trend === 'declining' && (
                      <div className="flex items-center gap-1 text-red-400">
                        <TrendingDown size={18} />
                        <span className="text-sm">Declining</span>
                      </div>
                    )}
                    {trend.trend === 'stable' && (
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Minus size={18} />
                        <span className="text-sm">Stable</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-dark-text/70">Current Score</p>
                      <p className="text-2xl font-bold text-teal-400">{trend.currentScore}%</p>
                    </div>

                    {trend.previousScore !== undefined && (
                      <div>
                        <p className="text-sm text-dark-text/70">Previous Term</p>
                        <p className="text-lg text-dark-text">{trend.previousScore}%</p>
                      </div>
                    )}

                    {trend.change !== undefined && (
                      <div>
                        <p className="text-sm text-dark-text/70">Change</p>
                        <p className={`text-lg font-semibold ${trend.change > 0 ? 'text-green-400' : trend.change < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                          {trend.change > 0 ? '+' : ''}{trend.change}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Performance Gauge */}
                <div className="w-20 h-20 flex items-center justify-center">
                  <div className={`w-full h-full rounded-full border-4 flex items-center justify-center font-bold text-sm
                    ${trend.currentScore >= 80 ? 'border-green-400 text-green-400' :
                      trend.currentScore >= 70 ? 'border-blue-400 text-blue-400' :
                        trend.currentScore >= 60 ? 'border-yellow-400 text-yellow-400' :
                          'border-red-400 text-red-400'}`}>
                    {trend.currentScore}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 w-full bg-dark-bg rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all ${trend.currentScore >= 80 ? 'bg-green-400' :
                    trend.currentScore >= 70 ? 'bg-blue-400' :
                      trend.currentScore >= 60 ? 'bg-yellow-400' :
                        'bg-red-400'
                    }`}
                  style={{ width: `${trend.currentScore}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grade Distribution (Optional) */}
      {termScores.length > 0 && (
        <div className="p-6 bg-dark-card rounded-lg border border-teal-500/20">
          <h2 className="text-xl font-bold mb-4 text-teal-400">Performance Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-dark-bg rounded p-4 border border-teal-500/10">
              <p className="text-sm text-dark-text/70">Avg Score</p>
              <p className="text-2xl font-bold text-teal-400">
                {Math.round(termScores.reduce((sum, s) => sum + (s.score as number), 0) / termScores.length)}%
              </p>
            </div>
            <div className="bg-dark-bg rounded p-4 border border-teal-500/10">
              <p className="text-sm text-dark-text/70">Highest</p>
              <p className="text-2xl font-bold text-green-400">
                {Math.max(...termScores.map((s) => s.score as number))}%
              </p>
            </div>
            <div className="bg-dark-bg rounded p-4 border border-teal-500/10">
              <p className="text-sm text-dark-text/70">Lowest</p>
              <p className="text-2xl font-bold text-red-400">
                {Math.min(...termScores.map((s) => s.score as number))}%
              </p>
            </div>
            <div className="bg-dark-bg rounded p-4 border border-teal-500/10">
              <p className="text-sm text-dark-text/70">Subjects</p>
              <p className="text-2xl font-bold text-blue-400">{termScores.length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
