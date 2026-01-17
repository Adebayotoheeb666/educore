import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TermData {
  term: string;
  average: number;
  count: number;
  trend: 'up' | 'down' | 'stable';
}

interface SubjectTrend {
  subject: string;
  scores: { term: string; score: number }[];
  average: number;
  trend: 'up' | 'down' | 'stable';
  improvement: number;
}

export const ChildPerformanceTrends = ({ childId }: { childId: string }) => {
  const { schoolId } = useAuth();
  const [termData, setTermData] = useState<TermData[]>([]);
  const [subjectTrends, setSubjectTrends] = useState<SubjectTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [showChart, setShowChart] = useState<'overall' | 'subject'>('overall');

  useEffect(() => {
    const fetchPerformanceTrends = async () => {
      if (!childId || !schoolId) return;

      setLoading(true);
      try {
        // Fetch all results for this student
        const { data: results, error } = await supabase
          .from('results')
          .select('*, subjects(name)')
          .eq('student_id', childId)
          .eq('school_id', schoolId)
          .order('updated_at', { ascending: true });

        if (error) throw error;

        // Group by term
        const termMap = new Map<string, { total: number; count: number }>();
        const subjectMap = new Map<string, Map<string, number>>();

        (results || []).forEach((result: any) => {
          const term = result.term || 'Current';
          const subject = result.subjects?.name || 'Unknown';
          const score = result.total_score || 0;

          // Aggregate by term
          if (!termMap.has(term)) {
            termMap.set(term, { total: 0, count: 0 });
          }
          const termEntry = termMap.get(term)!;
          termEntry.total += score;
          termEntry.count += 1;

          // Aggregate by subject
          if (!subjectMap.has(subject)) {
            subjectMap.set(subject, new Map());
          }
          const subjectTerms = subjectMap.get(subject)!;
          if (!subjectTerms.has(term)) {
            subjectTerms.set(term, 0);
          }
          subjectTerms.set(term, subjectTerms.get(term)! + score);
        });

        // Calculate term trends
        const terms: TermData[] = [];
        const termArray = Array.from(termMap.entries());

        termArray.forEach(([term, data], idx) => {
          const average = data.count > 0 ? Math.round(data.total / data.count) : 0;

          // Determine trend
          let trend: 'up' | 'down' | 'stable' = 'stable';
          if (idx > 0) {
            const prevAverage = terms[idx - 1].average;
            if (average > prevAverage + 5) trend = 'up';
            else if (average < prevAverage - 5) trend = 'down';
          }

          terms.push({
            term,
            average,
            count: data.count,
            trend,
          });
        });

        setTermData(terms);

        // Calculate subject trends
        const subjects: SubjectTrend[] = Array.from(subjectMap.entries()).map(
          ([subject, termScores]) => {
            const termArray = Array.from(termScores.entries());
            const scores = termArray.map(([term, score]) => ({
              term,
              score: Math.round(score / (termData.find((t) => t.term === term)?.count || 1)),
            }));

            const average = Math.round(
              scores.reduce((sum, s) => sum + s.score, 0) / Math.max(1, scores.length)
            );

            const improvement =
              scores.length > 1 ? scores[scores.length - 1].score - scores[0].score : 0;

            let trend: 'up' | 'down' | 'stable' = 'stable';
            if (improvement > 5) trend = 'up';
            else if (improvement < -5) trend = 'down';

            return {
              subject,
              scores,
              average,
              trend,
              improvement,
            };
          }
        );

        setSubjectTrends(subjects);
        if (subjects.length > 0) {
          setSelectedSubject(subjects[0].subject);
        }
      } catch (error) {
        console.error('Error fetching performance trends:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceTrends();
  }, [childId, schoolId]);

  if (loading) {
    return (
      <div className="bg-dark-card border border-white/5 rounded-2xl p-8 text-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (termData.length === 0) {
    return (
      <div className="bg-dark-card border border-white/5 rounded-2xl p-8 text-center">
        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-500 opacity-50" />
        <p className="text-gray-400">No performance data available yet</p>
      </div>
    );
  }

  const selectedSubjectData = subjectTrends.find((s) => s.subject === selectedSubject);

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex gap-2">
        {(['overall', 'subject'] as const).map((view) => (
          <button
            key={view}
            onClick={() => setShowChart(view)}
            className={`px-4 py-2 rounded-lg font-bold transition-colors capitalize flex items-center gap-2 ${showChart === view
              ? 'bg-teal-500 text-dark-bg'
              : 'bg-dark-card text-gray-400 hover:text-white border border-white/10'
              }`}
          >
            {view === 'overall' ? <TrendingUp className="w-4 h-4" /> : <BarChart3 className="w-4 h-4" />}
            {view} Performance
          </button>
        ))}
      </div>

      {/* Overall Performance Chart */}
      {showChart === 'overall' && (
        <div className="bg-dark-card border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Academic Progress Over Time</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={termData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="term" stroke="#999" />
              <YAxis stroke="#999" domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e1e1e',
                  border: '1px solid #333',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#fff' }}
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

          {/* Performance Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-gray-400 text-sm font-bold">Current Average</p>
              <p className="text-2xl font-bold text-white mt-2">
                {termData[termData.length - 1]?.average || 0}
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-gray-400 text-sm font-bold">Highest Score</p>
              <p className="text-2xl font-bold text-emerald-400 mt-2">
                {Math.max(...termData.map((t) => t.average))}
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-gray-400 text-sm font-bold">Lowest Score</p>
              <p className="text-2xl font-bold text-orange-400 mt-2">
                {Math.min(...termData.map((t) => t.average))}
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-gray-400 text-sm font-bold">Overall Trend</p>
              <div className="flex items-center gap-2 mt-2">
                {termData.length > 1 && termData[termData.length - 1].average > termData[0].average ? (
                  <>
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">
                      +{termData[termData.length - 1].average - termData[0].average}
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-6 h-6 text-orange-400" />
                    <span className="text-orange-400 font-bold">
                      {termData[termData.length - 1].average - termData[0].average}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subject-Specific Performance */}
      {showChart === 'subject' && (
        <div className="space-y-6">
          {/* Subject Selector */}
          <div className="bg-dark-card border border-white/5 rounded-2xl p-4">
            <p className="text-gray-400 text-sm font-bold mb-3">Select Subject</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {subjectTrends.map((subject) => (
                <button
                  key={subject.subject}
                  onClick={() => setSelectedSubject(subject.subject)}
                  className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${selectedSubject === subject.subject
                    ? 'bg-teal-500 text-dark-bg'
                    : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                    }`}
                >
                  {subject.subject}
                </button>
              ))}
            </div>
          </div>

          {/* Subject Performance Chart */}
          {selectedSubjectData && (
            <div className="bg-dark-card border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">{selectedSubjectData.subject} Progress</h3>
                <div className="flex items-center gap-2">
                  {selectedSubjectData.trend === 'up' ? (
                    <>
                      <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">+{selectedSubjectData.improvement}</span>
                    </>
                  ) : selectedSubjectData.trend === 'down' ? (
                    <>
                      <ArrowDownRight className="w-5 h-5 text-orange-400" />
                      <span className="text-orange-400 font-bold">{selectedSubjectData.improvement}</span>
                    </>
                  ) : (
                    <span className="text-gray-400 font-bold">Stable</span>
                  )}
                </div>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={selectedSubjectData.scores}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="term" stroke="#999" />
                  <YAxis stroke="#999" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e1e1e',
                      border: '1px solid #333',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="score" fill="#009688" radius={[8, 8, 0, 0]} name="Score" />
                </BarChart>
              </ResponsiveContainer>

              {/* Subject Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <p className="text-gray-400 text-sm">Average</p>
                  <p className="text-2xl font-bold text-white mt-2">{selectedSubjectData.average}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <p className="text-gray-400 text-sm">Highest</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-2">
                    {Math.max(...selectedSubjectData.scores.map((s) => s.score))}
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <p className="text-gray-400 text-sm">Lowest</p>
                  <p className="text-2xl font-bold text-orange-400 mt-2">
                    {Math.min(...selectedSubjectData.scores.map((s) => s.score))}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* All Subjects Summary */}
      <div className="bg-dark-card border border-white/5 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Subject Performance Summary</h3>
        <div className="space-y-2">
          {subjectTrends.map((subject) => {
            const percentage = subject.average;
            let statusColor = 'text-red-400';
            let statusBg = 'bg-red-500/10';

            if (percentage >= 70) {
              statusColor = 'text-emerald-400';
              statusBg = 'bg-emerald-500/10';
            } else if (percentage >= 60) {
              statusColor = 'text-teal-400';
              statusBg = 'bg-teal-500/10';
            } else if (percentage >= 50) {
              statusColor = 'text-yellow-400';
              statusBg = 'bg-yellow-500/10';
            } else if (percentage >= 40) {
              statusColor = 'text-orange-400';
              statusBg = 'bg-orange-500/10';
            }

            return (
              <div key={subject.subject} className={`p-4 rounded-lg ${statusBg} border border-white/10`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-bold text-white">{subject.subject}</p>
                    <div className="w-full bg-white/10 rounded-full h-2 mt-2 overflow-hidden">
                      <div
                        className={`h-full transition-all ${statusColor === 'text-emerald-400' ? 'bg-emerald-500' : statusColor === 'text-teal-400' ? 'bg-teal-500' : statusColor === 'text-yellow-400' ? 'bg-yellow-500' : statusColor === 'text-orange-400' ? 'bg-orange-500' : 'bg-red-500'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className={`text-xl font-bold ${statusColor}`}>{subject.average}</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center justify-end gap-1">
                      {subject.trend === 'up' ? (
                        <>
                          <TrendingUp className="w-3 h-3" /> +{subject.improvement}
                        </>
                      ) : subject.trend === 'down' ? (
                        <>
                          <TrendingDown className="w-3 h-3" /> {subject.improvement}
                        </>
                      ) : (
                        'Stable'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
