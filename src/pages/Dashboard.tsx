import { useEffect, useState } from 'react';
import { Sparkles, HelpCircle, Scan, Cloud, ArrowRight, ScrollText, Users, CheckCircle2, XCircle, Download } from 'lucide-react';
import { NavLink, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export const Dashboard = () => {
    const { user, profile, role, loading: authLoading } = useAuth();
    const displayName = profile?.fullName || user?.user_metadata?.full_name || 'Teacher';
    const [pendingCount, setPendingCount] = useState(0);
    const [classStats, setClassStats] = useState<any[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { schoolId } = useAuth();

    if (authLoading) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (role === 'student' || role === 'parent') {
        return <Navigate to="/portal" replace />;
    }

    // Export attendance for a specific date
    const exportAttendanceForDate = (date: string) => {
        const recordsForDate = attendanceRecords.filter(r => r.date === date);
        const present = recordsForDate.filter(r => r.status === 'present').length;
        const absent = recordsForDate.filter(r => r.status === 'absent').length;

        // Create CSV content
        const headers = ['Student Name', 'Student ID', 'Status', 'Date', 'Class'];
        const rows = recordsForDate.map(record => [
            record.student_name,
            record.student_id,
            record.status.toUpperCase(),
            new Date(record.date).toLocaleDateString(),
            record.class_id
        ]);

        // Add summary row
        rows.push(['', '', '', '', '']);
        rows.push(['Summary', '', `Present: ${present}, Absent: ${absent}`, '', '']);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Download file
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance-${date}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!user) {
                console.log('[Dashboard] No user, skipping fetch');
                return;
            }
            try {
                // Fetch pending grades
                const { count, error } = await supabase
                    .from('results')
                    .select('*', { count: 'exact', head: true })
                    .eq('teacher_id', user.id);

                if (!error) setPendingCount(count || 0);

                // Fetch Staff Assignments
                if (schoolId) {
                    console.log('[Dashboard] Fetching staff assignments for:', { user_id: user.id, schoolId });

                    const { data: assignments, error: assignError } = await supabase
                        .from('staff_assignments')
                        .select('class_id, classes(name), subject_id, subjects(name)')
                        .eq('staff_id', user.id)
                        .eq('school_id', schoolId);

                    if (assignError) {
                        console.error('[Dashboard] Error fetching assignments:', assignError);
                    } else {
                        console.log('[Dashboard] Fetched assignments:', assignments?.length || 0);
                    }

                    if (!assignError && assignments && assignments.length > 0) {
                        // Get all student counts in a single query
                        const classIds = [...new Set(assignments.map(a => a.class_id))];
                        const { data: allStudentCounts } = await supabase
                            .from('student_classes')
                            .select('class_id')
                            .eq('school_id', schoolId)
                            .in('class_id', classIds);

                        // Count students per class
                        const countByClass = new Map<string, number>();
                        allStudentCounts?.forEach(sc => {
                            const count = (countByClass.get(sc.class_id) || 0) + 1;
                            countByClass.set(sc.class_id, count);
                        });

                        // Build stats from assignments with dedupe
                        const statsMap = new Map<string, any>();
                        assignments.forEach((a: any) => {
                            if (!statsMap.has(a.class_id)) {
                                statsMap.set(a.class_id, {
                                    classId: a.class_id,
                                    className: a.classes?.name || 'Unknown Class',
                                    subjectName: a.subjects?.name,
                                    studentCount: countByClass.get(a.class_id) || 0
                                });
                            }
                        });

                        const uniqueStats = Array.from(statsMap.values());
                        setClassStats(uniqueStats);
                        console.log('[Dashboard] Staff assignments loaded:', uniqueStats.length);
                    } else if (!assignError) {
                        console.log('[Dashboard] No assignments found for this staff');
                    }

                    // Fetch recent attendance records with student names
                    const classIdList = [...new Set(assignments.map(a => a.class_id))];
                    if (classIdList.length > 0) {
                        try {
                            const { data: attendance, error: attendError } = await supabase
                                .from('attendance')
                                .select('*')
                                .in('class_id', classIdList)
                                .eq('school_id', schoolId)
                                .order('date', { ascending: false })
                                .limit(50); // Get more records for daily summaries

                            if (!attendError && attendance) {
                                // Get unique student IDs and fetch their names
                                const studentIds = [...new Set(attendance.map(a => a.student_id))];
                                const { data: students } = await supabase
                                    .from('users')
                                    .select('id, full_name')
                                    .in('id', studentIds);

                                // Create a map of student ID to name
                                const studentNameMap = new Map(students?.map(s => [s.id, s.full_name]) || []);

                                // Enrich attendance records with student names
                                const enrichedRecords = attendance.map(record => ({
                                    ...record,
                                    student_name: studentNameMap.get(record.student_id) || 'Unknown Student'
                                }));

                                setAttendanceRecords(enrichedRecords);
                                console.log('[Dashboard] Attendance records loaded:', enrichedRecords.length);
                            } else if (attendError) {
                                console.warn('[Dashboard] Attendance fetch warning:', {
                                    message: attendError.message,
                                    details: attendError.details,
                                    hint: attendError.hint,
                                    code: attendError.code
                                });
                                setAttendanceRecords([]);
                            }
                        } catch (attendanceErr) {
                            console.warn('[Dashboard] Attendance fetch exception:', attendanceErr);
                            setAttendanceRecords([]);
                        }
                    }
                } else {
                    console.warn('[Dashboard] schoolId not available');
                }
            } catch (err) {
                console.error('[Dashboard] Error fetching dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, schoolId]);

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 p-[2px]">
                        <img src={`https://ui-avatars.com/api/?name=${displayName}&background=random`} alt="User" className="w-full h-full rounded-full bg-dark-bg" />
                    </div>
                    <div>
                        <div className="text-teal-500 text-xs font-bold uppercase tracking-wider mb-0.5">Dashboard</div>
                        <h1 className="text-2xl font-bold text-white">Welcome, {displayName}</h1>
                        {profile?.staffId && (
                            <p className="text-gray-400 text-sm">Staff ID: <span className="text-teal-400 font-bold">{profile.staffId}</span></p>
                        )}
                    </div>
                </div>

                <div className="px-4 py-2 rounded-full border border-teal-500/30 bg-teal-500/10 flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-teal-400" />
                    <span className="text-teal-400 text-sm font-bold">OFFLINE SYNCED</span>
                </div>
            </header>

            {/* AI Toolkit Section */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">AI Toolkit</h2>
                    <span className="text-teal-500 text-sm font-bold">4 tools available</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Big Main Card */}
                    <div className="md:col-span-2">
                        <NavLink to="/lessons" className="relative h-64 rounded-[32px] bg-gradient-to-br from-teal-600 to-teal-800 p-8 flex flex-col justify-between overflow-hidden group transition-transform hover:scale-[1.01]">
                            <div>
                                <Sparkles className="w-10 h-10 text-white mb-4" />
                                <h3 className="text-3xl font-bold text-white mb-2">Generate Lesson Note</h3>
                                <p className="text-teal-100 font-medium text-lg">Automate your SS1-SS3 content</p>
                            </div>

                            <div className="flex items-center gap-2 text-white font-bold bg-white/20 w-fit px-6 py-3 rounded-xl backdrop-blur-sm self-start group-hover:bg-white/30 transition-colors">
                                <span>Start Generating</span>
                                <ArrowRight className="w-5 h-5" />
                            </div>

                            {/* Decorative */}
                            <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3" />
                        </NavLink>
                    </div>

                    {/* Smaller Cards */}
                    <NavLink to="/exams" className="bg-dark-card border border-white/5 p-6 rounded-[24px] h-48 flex flex-col justify-between hover:bg-white/5 transition-colors group">
                        <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center group-hover:bg-teal-500/20 transition-colors">
                            <HelpCircle className="w-6 h-6 text-teal-400" />
                        </div>
                        <span className="text-xl font-bold text-white">Create Quiz</span>
                    </NavLink>

                    <NavLink to="/marking" className="bg-dark-card border border-white/5 p-6 rounded-[24px] h-48 flex flex-col justify-between hover:bg-white/5 transition-colors group">
                        <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center group-hover:bg-teal-500/20 transition-colors">
                            <Scan className="w-6 h-6 text-teal-400" />
                        </div>
                        <span className="text-xl font-bold text-white">Scan Scripts</span>
                    </NavLink>

                    <NavLink to="/class-manager" className="bg-dark-card border border-white/5 p-6 rounded-[24px] h-48 flex flex-col justify-between hover:bg-white/5 transition-colors group">
                        <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center group-hover:bg-teal-500/20 transition-colors">
                            <Users className="w-6 h-6 text-teal-400" />
                        </div>
                        <span className="text-xl font-bold text-white">Class Manager</span>
                    </NavLink>

                    <NavLink to="/attendance" className="bg-dark-card border border-white/5 p-6 rounded-[24px] h-48 flex flex-col justify-between hover:bg-white/5 transition-colors group">
                        <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center group-hover:bg-teal-500/20 transition-colors">
                            <Calendar className="w-6 h-6 text-teal-400" />
                        </div>
                        <span className="text-xl font-bold text-white">Take Attendance</span>
                    </NavLink>
                </div>
            </div>

            {/* Today's Schedule */}
            <div>
                <div className="flex items-center justify-between mb-6 pt-4">
                    <h2 className="text-xl font-bold text-white">Your Assigned Classes</h2>
                </div>

                <div className="space-y-3">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading schedule...</div>
                    ) : classStats.length > 0 ? (
                        classStats.map((stat) => (
                            <div key={stat.classId} className="bg-dark-card border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 font-bold">
                                        {stat.className.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold">{stat.className}</h3>
                                        <p className="text-gray-500 text-sm">{stat.studentCount} Students • {stat.subjectName || 'General Subject'}</p>
                                    </div>
                                </div>
                                <NavLink to={`/class-manager`} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-lg transition-colors">
                                    View Class
                                </NavLink>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <p>No classes assigned yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Attendance */}
            <div>
                <div className="flex items-center justify-between mb-6 pt-4">
                    <h2 className="text-xl font-bold text-white">Recent Attendance</h2>
                    <NavLink to="/attendance" className="text-teal-500 text-sm font-bold hover:text-teal-400">
                        View All →
                    </NavLink>
                </div>

                <div className="space-y-2">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading attendance...</div>
                    ) : attendanceRecords.length > 0 ? (
                        attendanceRecords.slice(0, 5).map((record: any, idx: number) => {
                            // Try to get class name from loaded classStats, fallback to class_id
                            const classInfo = classStats.find(c => c.classId === record.class_id);
                            const className = classInfo?.className || `Class ${record.class_id?.substring(0, 8)}` || 'Class';
                            const studentId = record.student_id?.substring(0, 8) || record.student_id;
                            const recordDate = new Date(record.date).toLocaleDateString();

                            return (
                                <div key={idx} className="bg-dark-card border border-white/5 rounded-xl p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${record.status === 'present' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                                            {record.status === 'present' ? (
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                            ) : (
                                                <XCircle className="w-5 h-5 text-red-500" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white font-semibold text-sm">Student {studentId}</p>
                                            <p className="text-gray-500 text-xs">{className} • {recordDate}</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${record.status === 'present' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {record.status === 'present' ? 'Present' : 'Absent'}
                                    </span>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <p>No attendance records yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Pending Grading */}
            <div className="relative overflow-hidden bg-dark-card border border-white/5 rounded-[32px] p-8">
                <div className="flex items-start justify-between relative z-10">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">Graded Scripts</h2>
                        <p className="text-gray-400">{pendingCount === 0 ? 'No grades recorded yet' : 'Scores recorded from Paper Scanner'}</p>
                    </div>
                    {pendingCount > 0 && (
                        <div className="px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold uppercase">
                            {pendingCount} {pendingCount === 1 ? 'Grade' : 'Grades'}
                        </div>
                    )}
                </div>

                <div className="mt-8 relative z-10 flex items-end justify-between">
                    <div>
                        <span className="text-6xl font-bold text-white tracking-tighter">{loading ? '...' : pendingCount}</span>
                        <span className="ml-3 text-gray-500 font-bold tracking-widest text-sm uppercase">Scripts graded</span>
                    </div>
                    <NavLink to="/marking" className="bg-teal-500 text-dark-bg px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-teal-400 transition-colors">
                        <ScrollText className="w-5 h-5" />
                        {pendingCount === 0 ? 'Start Grading' : 'View Analytics'}
                    </NavLink>
                </div>

                {/* Background Decor */}
                <div className="absolute right-0 bottom-0 w-64 h-64 bg-teal-500/5 blur-[80px] rounded-full translate-x-1/3 translate-y-1/3" />
            </div>
        </div>
    );
};

// Help helper
const Calendar = ({ className }: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
);
