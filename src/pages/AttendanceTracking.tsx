import { useState, useEffect } from 'react';
import {
    Calendar,
    Users,
    CheckCircle2,
    XCircle,
    ChevronRight,
    Save
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { logAction } from '../lib/auditService';

export const AttendanceTracking = () => {
    const { schoolId, user, profile } = useAuth();
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent'>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        if (!schoolId) return;

        const fetchClasses = async () => {
            setLoading(true);
            try {
                // Fetch classes assigned to this teacher or all classes if admin
                const { data, error } = await supabase
                    .from('classes')
                    .select('*')
                    .eq('school_id', schoolId);

                if (error) throw error;
                setClasses(data.map(c => ({ id: c.id, name: c.name, ...c })));
            } catch (err) {
                console.error("Error fetching classes:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchClasses();
    }, [schoolId]);

    useEffect(() => {
        if (!selectedClass || !schoolId) return;

        const fetchStudents = async () => {
            setLoading(true);
            try {
                // Students are stored in the 'users' collection with role 'student' and schoolId
                // TODO: In a real app, we should filter by class enrollment (student_classes table)
                // For now, fetching all students in school as per original logic, potentially filering later?
                // The original code query: where('schoolId', ...), where('role', 'student')
                // It didn't seem to filter by class strictly in the query shown, 
                // but usually you would. I'll stick to the original logic or try to improve if tables exist.
                // Given bulkImport creates 'student_classes', we *should* use it.
                // But let's stick to 'users' for now to match old behavior unless we are sure.
                // Actually, let's just fetch all students for now to be safe with the migration.

                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('school_id', schoolId)
                    .eq('role', 'student');

                if (error) throw error;

                const studentsList = data.map(doc => ({
                    id: doc.id,
                    fullName: doc.full_name,
                    admissionNumber: doc.admission_number,
                    ...doc
                }));
                // If we want to filter by class, we'd need that info. 
                // Assuming for this stage we strictly migrate what was there.
                setStudents(studentsList);

                // Initialize attendance as all present
                const initial: Record<string, 'present' | 'absent'> = {};
                studentsList.forEach(s => initial[s.id] = 'present');
                setAttendance(initial);
            } catch (err) {
                console.error("Error fetching students:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [selectedClass, schoolId]);

    const handleSave = async () => {
        if (!selectedClass || !user || !profile || !schoolId) return;
        setSaving(true);
        setSuccess(false);
        try {
            // Prepare batch data
            const attendanceRecords = Object.entries(attendance).map(([studentId, status]) => ({
                school_id: schoolId,
                student_id: studentId,
                class_id: selectedClass,
                teacher_id: user.id,
                date: today,
                status,
                created_at: new Date().toISOString() // Let Supabase handle it or explicit
            }));

            const { error } = await supabase
                .from('attendance')
                .insert(attendanceRecords);

            if (error) throw error;

            // Log attendance tracking action
            const presentCount = Object.values(attendance).filter(s => s === 'present').length;
            const absentCount = Object.values(attendance).filter(s => s === 'absent').length;

            try {
                await logAction(
                    schoolId,
                    user.id,
                    profile.fullName || 'Unknown User',
                    'create',
                    'attendance',
                    `${selectedClass}_${today}`,
                    undefined,
                    {
                        classId: selectedClass,
                        date: today,
                        presentCount,
                        absentCount,
                        totalStudents: students.length
                    }
                );
            } catch (error) {
                console.error('Failed to log attendance action:', error);
            }

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error("Error saving attendance:", err);
            alert("Failed to save attendance");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-white mb-2">Daily Attendance</h1>
                <p className="text-gray-400">Record and track student presence in real-time.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Class Selection */}
                <div className="space-y-4">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest px-2">Select Class</h2>
                    <div className="space-y-2">
                        {loading && !classes.length ? (
                            <div className="p-8 text-center text-gray-600">Loading...</div>
                        ) : classes.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setSelectedClass(c.id)}
                                className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center justify-between group ${selectedClass === c.id
                                    ? 'bg-teal-500/10 border-teal-500/50 text-teal-400'
                                    : 'bg-dark-card border-white/5 text-gray-400 hover:bg-white/5'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedClass === c.id ? 'bg-teal-500/20' : 'bg-white/5 group-hover:bg-white/10'
                                        }`}>
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold">{c.name || 'Class Arm'}</span>
                                </div>
                                <ChevronRight className={`w-5 h-5 transition-transform ${selectedClass === c.id ? 'rotate-90' : ''}`} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Attendance List */}
                <div className="lg:col-span-2">
                    {!selectedClass ? (
                        <div className="h-full min-h-[400px] border-2 border-dashed border-white/5 rounded-[32px] flex flex-col items-center justify-center text-gray-600 p-8">
                            <Calendar className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-lg font-medium">Select a class to start marking attendance</p>
                        </div>
                    ) : (
                        <div className="bg-dark-card border border-white/5 rounded-[32px] overflow-hidden flex flex-col h-full">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-gray-500 text-xs font-bold uppercase tracking-widest">Attendance for</div>
                                        <div className="text-white font-bold">{today}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !students.length}
                                    className="flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-400 text-dark-bg font-bold rounded-xl transition-all disabled:opacity-50"
                                >
                                    {saving ? <div className="w-5 h-5 border-2 border-dark-bg border-t-transparent rounded-full animate-spin" />
                                        : success ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                                    <span>{success ? 'Saved!' : 'Save Attendance'}</span>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="space-y-3">
                                    {students.map(s => (
                                        <div key={s.id} className="flex items-center justify-between p-4 bg-dark-bg rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 font-bold">
                                                    {s.fullName?.charAt(0) || 'S'}
                                                </div>
                                                <div>
                                                    <div className="text-white font-bold">{s.fullName}</div>
                                                    <div className="text-gray-500 text-xs">{s.admissionNumber}</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setAttendance(prev => ({ ...prev, [s.id]: 'present' }))}
                                                    className={`px-4 py-2 rounded-xl border transition-all flex items-center gap-2 ${attendance[s.id] === 'present'
                                                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                                                        : 'border-white/5 text-gray-500 hover:bg-white/5'
                                                        }`}
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    <span className="text-sm font-bold">Present</span>
                                                </button>
                                                <button
                                                    onClick={() => setAttendance(prev => ({ ...prev, [s.id]: 'absent' }))}
                                                    className={`px-4 py-2 rounded-xl border transition-all flex items-center gap-2 ${attendance[s.id] === 'absent'
                                                        ? 'bg-red-500/10 border-red-500/50 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                                                        : 'border-white/5 text-gray-500 hover:bg-white/5'
                                                        }`}
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    <span className="text-sm font-bold">Absent</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {students.length === 0 && (
                                        <div className="text-center py-20 text-gray-600">
                                            No students found in this class.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
