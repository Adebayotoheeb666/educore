import { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  TrendingUp,
  AlertCircle,
  BookOpen,
  Target,
  Award,
  Clock,
  Activity,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface ClassStats {
  classId: string;
  className: string;
  studentCount: number;
  averageScore: number;
  passingPercentage: number;
  attendanceRate: number;
  studentsAtRisk: number;
}

interface PerformanceMetrics {
  overallAverageScore: number;
  averageAttendanceRate: number;
  totalStudents: number;
  classCount: number;
  improvementRate: number;
  at RiskStudents: number;
}

export const TeacherAnalyticsDashboard = () => {
  const { user, schoolId, profile } = useAuth();
  const [classStats, setClassStats] = useState<ClassStats[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    overallAverageScore: 0,
    averageAttendanceRate: 0,
    totalStudents: 0,
    classCount: 0,
    improvementRate: 0,
    atRiskStudents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'term'>('month');

  // Fetch class analytics
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user || !schoolId || profile?.role !== 'staff') return;

      setLoading(true);
      try {
        // Get staff assignments
        const { data: assignments, error: assignmentError } = await supabase
          .from('staff_assignments')
          .select('class_id, classes(name)')
          .eq('staff_id', user.id)
          .eq('school_id', schoolId);

        if (assignmentError) throw assignmentError;

        const classIds = assignments?.map((a: any) => a.class_id) || [];
        if (classIds.length === 0) {
          setClassStats([]);
          setLoading(false);
          return;
        }

        // Get class details
        const { data: classes, error: classError } = await supabase
          .from('classes')
          .select('id, name')
          .in('id', classIds)
          .eq('school_id', schoolId);

        if (classError) throw classError;

        // Fetch stats for each class
        const stats: ClassStats[] = [];
        let totalStudents = 0;
        let totalScore = 0;
        let totalAttendance = 0;
        let totalAtRisk = 0;

        for (const classItem of classes || []) {
          // Get students in class
          const { data: studentData, error: studentError } = await supabase
            .from('student_classes')
            .select('student_id')
            .eq('class_id', classItem.id)
            .eq('school_id', schoolId);

          if (studentError) throw studentError;

          const studentIds = studentData?.map((s: any) => s.student_id) || [];
          const studentCount = studentIds.length;

          if (studentIds.length === 0) {
            stats.push({
              classId: classItem.id,
              className: classItem.name,
              studentCount: 0,
              averageScore: 0,
              passingPercentage: 0,
              attendanceRate: 0,
              studentsAtRisk: 0,
            });
            continue;
          }

          // Get results for this class
          const { data: results, error: resultError } = await supabase
            .from('results')
            .select('student_id, total_score')
            .in('student_id', studentIds)
            .eq('class_id', classItem.id)
            .order('updated_at', { ascending: false })
            .limit(studentIds.length);

          if (resultError) throw resultError;

          // Get attendance for this class
          const { data: attendance, error: attendanceError } = await supabase
            .from('attendance')
            .select('student_id, status')
            .in('student_id', studentIds)
            .eq('class_id', classItem.id)
            .order('date', { ascending: false })
            .limit(studentIds.length * 5); // Last 5 attendance records per student

          if (attendanceError) throw attendanceError;

          // Calculate stats
          const avgScore = results && results.length > 0
            ? results.reduce((sum, r: any) => sum + (r.total_score || 0), 0) / results.length
            : 0;

          const passingCount = results?.filter((r: any) => (r.total_score || 0) >= 50).length || 0;
          const passingPercentage = studentIds.length > 0 ? (passingCount / studentIds.length) * 100 : 0;

          const presentCount = attendance?.filter((a: any) => a.status === 'present').length || 0;
          const totalAttendanceRecords = attendance?.length || 1;
          const attendanceRate = (presentCount / Math.max(1, totalAttendanceRecords)) * 100;

          const atRiskCount = results?.filter((r: any) => (r.total_score || 0) < 50).length || 0;

          stats.push({
            classId: classItem.id,
            className: classItem.name,
            studentCount,
            averageScore: Math.round(avgScore),
            passingPercentage: Math.round(passingPercentage),
            attendanceRate: Math.round(attendanceRate),
            studentsAtRisk: atRiskCount,
          });

          totalStudents += studentCount;
          totalScore += avgScore;
          totalAttendance += attendanceRate;
          totalAtRisk += atRiskCount;
        }

        setClassStats(stats);

        // Update metrics
        const classCount = stats.length;
        setMetrics({
          overallAverageScore: Math.round(totalScore / Math.max(1, classCount)),
          averageAttendanceRate: Math.round(totalAttendance / Math.max(1, classCount)),
          totalStudents,
          classCount,
          improvementRate: 15, // Would calculate from historical data
          atRiskStudents: totalAtRisk,
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user, schoolId, profile?.role]);

  if (loading) {
    return (
      <div className="bg-dark-card border border-white/5 rounded-2xl p-8 text-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (classStats.length === 0) {
    return (
      <div className="bg-dark-card border border-white/5 rounded-2xl p-8">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-300 text-center">No Classes Assigned</h3>
        <p className="text-gray-500 text-center mt-2">
          You haven't been assigned to any classes yet.
        </p>
      </div>
    );
  }

  // Prepare data for charts
  const classScoreData = classStats.map((stat) => ({
    name: stat.className,
    average: stat.averageScore,
    passing: stat.passingPercentage,
  }));

  const performanceDistribution = [
    { name: 'Passing (50+)', value: classStats.reduce((sum, c) => sum + (c.studentCount - c.studentsAtRisk), 0), color: '#009688' },
    { name: 'At Risk (<50)', value: metrics.atRiskStudents, color: '#ff6b6b' },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-dark-card border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-bold">Avg Score</h3>
            <BarChart3 className="w-5 h-5 text-teal-400" />
          </div>
          <div className="text-3xl font-bold text-white">{metrics.overallAverageScore}</div>
          <p className="text-xs text-gray-500 mt-2">Across all classes</p>
        </div>

        <div className="bg-dark-card border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-bold">Attendance Rate</h3>
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-400">{metrics.averageAttendanceRate}%</div>
          <p className="text-xs text-gray-500 mt-2">Average across classes</p>
        </div>

        <div className="bg-dark-card border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-bold">Total Students</h3>
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-400">{metrics.totalStudents}</div>
          <p className="text-xs text-gray-500 mt-2">Across {metrics.classCount} classes</p>
        </div>

        <div className="bg-dark-card border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-bold">At Risk</h3>
            <AlertCircle className="w-5 h-5 text-orange-400" />
          </div>
          <div className="text-3xl font-bold text-orange-400">{metrics.atRiskStudents}</div>
          <p className="text-xs text-gray-500 mt-2">Students below passing</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Performance Chart */}
        <div className="bg-dark-card border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Class Performance Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={classScoreData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#999" />
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
              <Bar dataKey="average" fill="#009688" name="Average Score" />
              <Bar dataKey="passing" fill="#4caf50" name="Passing %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Distribution Pie Chart */}
        <div className="bg-dark-card border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Student Performance Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={performanceDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {performanceDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e1e1e',
                  border: '1px solid #333',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Class Details Table */}
      <div className="bg-dark-card border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-lg font-bold text-white">Class-by-Class Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-gray-400 font-bold">Class</th>
                <th className="px-6 py-4 text-center text-gray-400 font-bold">Students</th>
                <th className="px-6 py-4 text-center text-gray-400 font-bold">Avg Score</th>
                <th className="px-6 py-4 text-center text-gray-400 font-bold">Passing %</th>
                <th className="px-6 py-4 text-center text-gray-400 font-bold">Attendance</th>
                <th className="px-6 py-4 text-center text-gray-400 font-bold">At Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {classStats.map((stat) => {
                const scoreColor =
                  stat.averageScore >= 70
                    ? 'text-emerald-400'
                    : stat.averageScore >= 60
                      ? 'text-teal-400'
                      : stat.averageScore >= 50
                        ? 'text-yellow-400'
                        : 'text-orange-400';

                const attendanceColor =
                  stat.attendanceRate >= 90
                    ? 'text-emerald-400'
                    : stat.attendanceRate >= 75
                      ? 'text-teal-400'
                      : 'text-orange-400';

                return (
                  <tr
                    key={stat.classId}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => setSelectedClass(stat.classId)}
                  >
                    <td className="px-6 py-4 text-white font-medium">{stat.className}</td>
                    <td className="px-6 py-4 text-center text-gray-400">{stat.studentCount}</td>
                    <td className={`px-6 py-4 text-center font-bold ${scoreColor}`}>
                      {stat.averageScore}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-400">
                      {stat.passingPercentage}%
                    </td>
                    <td className={`px-6 py-4 text-center font-bold ${attendanceColor}`}>
                      {stat.attendanceRate}%
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-bold ${stat.studentsAtRisk > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {stat.studentsAtRisk}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Insights */}
      <div className="bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border border-teal-500/30 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <Target className="w-6 h-6 text-teal-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Key Insights</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                ✓ Your overall class average is {metrics.overallAverageScore}%, which is {
                  metrics.overallAverageScore >= 70 ? 'excellent' : metrics.overallAverageScore >= 60 ? 'good' : 'needs improvement'
                }
              </li>
              <li>
                ✓ {metrics.atRiskStudents} students are currently below the passing threshold and may benefit from intervention
              </li>
              <li>
                ✓ Average attendance across your classes is {metrics.averageAttendanceRate}%, {
                  metrics.averageAttendanceRate >= 90 ? 'excellent' : metrics.averageAttendanceRate >= 75 ? 'good' : 'needs attention'
                }
              </li>
              <li>
                ✓ Focus on improving student attendance and targeted intervention for at-risk students
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};