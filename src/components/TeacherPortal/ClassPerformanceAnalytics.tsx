import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Award,
  Users,
  Target,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';


interface StudentPerformance {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  caScore: number;
  examScore: number;
  totalScore: number;
  grade: string;
  trend: 'up' | 'down' | 'stable';
  improvementPercentage: number;
  attendanceRate: number;
}

interface SubjectPerformance {
  subject: string;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  studentsPassing: number;
  totalStudents: number;
}

export const ClassPerformanceAnalytics = ({ classId }: { classId?: string }) => {
  const { user, schoolId } = useAuth();
  const [students, setStudents] = useState<StudentPerformance[]>([]);
  const [subjects, setSubjects] = useState<SubjectPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'score' | 'trend' | 'name'>('score');

  useEffect(() => {
    const fetchClassData = async () => {
      if (!user || !schoolId || !classId) return;

      setLoading(true);
      try {
        // Get students in class
        const { data: studentData, error: studentError } = await supabase
          .from('student_classes')
          .select('student_id, students:users(id, full_name, admission_number)')
          .eq('class_id', classId)
          .eq('school_id', schoolId);

        if (studentError) throw studentError;

        const studentIds = studentData?.map((s: any) => s.student_id) || [];
        const studentMap = new Map();

        studentData?.forEach((s: any) => {
          if (s.students) {
            studentMap.set(s.student_id, {
              id: s.student_id,
              name: s.students.full_name,
              admissionNumber: s.students.admission_number,
            });
          }
        });

        if (studentIds.length === 0) {
          setStudents([]);
          setLoading(false);
          return;
        }

        // Get results for all students in class
        const { data: results, error: resultError } = await supabase
          .from('results')
          .select('*, subjects(name)')
          .in('student_id', studentIds)
          .eq('class_id', classId)
          .order('updated_at', { ascending: false });

        if (resultError) throw resultError;

        // Get attendance for all students
        const { data: attendance, error: attendanceError } = await supabase
          .from('attendance')
          .select('student_id, status')
          .in('student_id', studentIds)
          .eq('class_id', classId)
          .order('date', { ascending: false })
          .limit(studentIds.length * 10);

        if (attendanceError) throw attendanceError;

        // Process student performance data
        const studentPerformance: Record<string, StudentPerformance> = {};

        // Initialize students
        studentIds.forEach((studentId: string) => {
          const student = studentMap.get(studentId);
          if (student) {
            studentPerformance[studentId] = {
              studentId,
              studentName: student.name,
              admissionNumber: student.admissionNumber,
              caScore: 0,
              examScore: 0,
              totalScore: 0,
              grade: 'N/A',
              trend: 'stable',
              improvementPercentage: 0,
              attendanceRate: 0,
            };
          }
        });

        // Aggregate results
        results?.forEach((result: any) => {
          if (studentPerformance[result.student_id]) {
            const perf = studentPerformance[result.student_id];
            perf.caScore = result.ca_score;
            perf.examScore = result.exam_score;
            perf.totalScore = result.total_score;
            perf.grade = result.grade || calculateGrade(result.total_score);
          }
        });

        // Calculate attendance rates
        attendance?.forEach((att: any) => {
          if (studentPerformance[att.student_id]) {
            const perf = studentPerformance[att.student_id];
            const studentAttendance = attendance.filter(
              (a: any) => a.student_id === att.student_id
            );
            const presentCount = studentAttendance.filter(
              (a: any) => a.status === 'present'
            ).length;
            perf.attendanceRate = Math.round(
              (presentCount / Math.max(1, studentAttendance.length)) * 100
            );
          }
        });

        // Detect trends (would use historical data in production)
        Object.values(studentPerformance).forEach((perf) => {
          if (perf.totalScore >= 70) {
            perf.trend = 'up';
            perf.improvementPercentage = 15;
          } else if (perf.totalScore < 50) {
            perf.trend = 'down';
            perf.improvementPercentage = -10;
          } else {
            perf.trend = 'stable';
          }
        });

        const performanceArray = Object.values(studentPerformance)
          .filter((s) => s.studentName)
          .sort((a, b) => b.totalScore - a.totalScore);

        setStudents(performanceArray);

        // Calculate subject performance
        const subjectStats: Record<string, { scores: number[]; count: number }> = {};

        results?.forEach((result: any) => {
          const subjectName = result.subjects?.name || result.subject_id;
          if (!subjectStats[subjectName]) {
            subjectStats[subjectName] = { scores: [], count: 0 };
          }
          subjectStats[subjectName].scores.push(result.total_score);
          subjectStats[subjectName].count++;
        });

        const subjectPerformance = Object.entries(subjectStats).map(
          ([subject, data]) => ({
            subject,
            averageScore: Math.round(
              data.scores.reduce((a: number, b: number) => a + b, 0) / data.scores.length
            ),
            highestScore: Math.max(...data.scores),
            lowestScore: Math.min(...data.scores),
            studentsPassing: data.scores.filter((s) => s >= 50).length,
            totalStudents: data.count,
          })
        );

        setSubjects(subjectPerformance);
      } catch (error) {
        console.error('Error fetching class data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClassData();
  }, [classId, schoolId, user]);

  const calculateGrade = (score: number): string => {
    if (score >= 70) return 'A';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  };

  const sortedStudents = [...students].sort((a, b) => {
    switch (sortBy) {
      case 'trend':
        return a.trend === 'down' ? -1 : 1;
      case 'name':
        return a.studentName.localeCompare(b.studentName);
      default:
        return b.totalScore - a.totalScore;
    }
  });

  if (loading) {
    return <div className="text-center text-gray-400">Loading class performance data...</div>;
  }

  if (!classId) {
    return <div className="text-center text-gray-400">Select a class to view analytics</div>;
  }

  // Prepare chart data
  const performanceChartData = sortedStudents.slice(0, 10).map((s) => ({
    name: s.studentName.split(' ')[0],
    ca: s.caScore,
    exam: s.examScore,
    total: s.totalScore,
  }));

  return (
    <div className="space-y-6">
      {/* Class Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-card border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-bold">Total Students</h3>
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white">{students.length}</div>
        </div>

        <div className="bg-dark-card border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-bold">Average Score</h3>
            <Award className="w-5 h-5 text-teal-400" />
          </div>
          <div className="text-3xl font-bold text-teal-400">
            {students.length > 0
              ? Math.round(students.reduce((sum: number, s: StudentPerformance) => sum + s.totalScore, 0) / students.length)
              : 0}
          </div>
        </div>

        <div className="bg-dark-card border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-bold">Passing Rate</h3>
            <Target className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-400">
            {students.length > 0
              ? Math.round(
                (students.filter((s) => s.totalScore >= 50).length / students.length) * 100
              )
              : 0}
            %
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      {performanceChartData.length > 0 && (
        <div className="bg-dark-card border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Top 10 Students Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#999" />
              <YAxis stroke="#999" domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e1e1e',
                  border: '1px solid #333',
                }}
              />
              <Legend />
              <Bar dataKey="ca" fill="#009688" name="CA Score" />
              <Bar dataKey="exam" fill="#26a69a" name="Exam Score" />
              <Bar dataKey="total" fill="#4db6ac" name="Total" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Subject Performance */}
      <div className="bg-dark-card border border-white/5 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Subject-wise Performance</h3>
        <div className="space-y-3">
          {subjects.map((subject) => (
            <div key={subject.subject} className="p-4 bg-white/5 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-white">{subject.subject}</p>
                <span className="text-teal-400 font-bold">{subject.averageScore}</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs text-gray-400">
                <div>Highest: {subject.highestScore}</div>
                <div>Lowest: {subject.lowestScore}</div>
                <div>Passing: {subject.studentsPassing}/{subject.totalStudents}</div>
                <div>Rate: {Math.round((subject.studentsPassing / subject.totalStudents) * 100)}%</div>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className="bg-teal-500 h-full"
                  style={{ width: `${(subject.studentsPassing / subject.totalStudents) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Student Performance Table */}
      <div className="bg-dark-card border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Individual Student Performance</h3>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 bg-dark-input border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500"
          >
            <option value="score">Sort by Score</option>
            <option value="trend">Sort by Trend</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-gray-400 font-bold">Student</th>
                <th className="px-6 py-4 text-center text-gray-400 font-bold">CA</th>
                <th className="px-6 py-4 text-center text-gray-400 font-bold">Exam</th>
                <th className="px-6 py-4 text-center text-gray-400 font-bold">Total</th>
                <th className="px-6 py-4 text-center text-gray-400 font-bold">Grade</th>
                <th className="px-6 py-4 text-center text-gray-400 font-bold">Attendance</th>
                <th className="px-6 py-4 text-center text-gray-400 font-bold">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedStudents.map((student) => (
                <tr
                  key={student.studentId}
                  className="hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4 text-white font-medium">
                    <div>{student.studentName}</div>
                    <div className="text-xs text-gray-500">#{student.admissionNumber}</div>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-400">{student.caScore}</td>
                  <td className="px-6 py-4 text-center text-gray-400">{student.examScore}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-white">{student.totalScore}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`font-bold ${student.totalScore >= 70
                        ? 'text-emerald-400'
                        : student.totalScore >= 60
                          ? 'text-teal-400'
                          : 'text-orange-400'
                        }`}
                    >
                      {student.grade}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-400">
                    {student.attendanceRate}%
                  </td>
                  <td className="px-6 py-4 text-center">
                    {student.trend === 'up' ? (
                      <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto" />
                    ) : student.trend === 'down' ? (
                      <TrendingDown className="w-5 h-5 text-orange-400 mx-auto" />
                    ) : (
                      <div className="text-gray-500">→</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
