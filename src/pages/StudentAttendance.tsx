import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, CheckCircle2, XCircle, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { cn } from '../components/Layout';

interface AttendanceRecord {
    id: string;
    status: 'present' | 'absent';
    date: string;
}

export const StudentAttendance = () => {
    const { user, schoolId } = useAuth();
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        if (!user || !schoolId) return;

        const fetchAttendance = async () => {
            try {
                const { data, error } = await supabase
                    .from('attendance')
                    .select('*')
                    .eq('school_id', schoolId)
                    .eq('student_id', user.id)
                    .order('date', { ascending: false });

                if (error) throw error;
                const list = data.map(record => ({
                    id: record.id,
                    status: record.status,
                    date: record.date
                } as AttendanceRecord));
                setAttendance(list);
            } catch (err) {
                console.error("Error fetching attendance:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, [user, schoolId]);

    const stats = {
        total: attendance.length,
        present: attendance.filter(a => a.status === 'present').length,
        absent: attendance.filter(a => a.status === 'absent').length,
    };

    const rate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold text-white">Attendance History</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="text-emerald-500 text-sm font-bold uppercase mb-1">Attendance Rate</div>
                    <div className="text-3xl font-black text-white">{rate}%</div>
                </div>
                <div className="p-6 rounded-3xl bg-blue-500/10 border border-blue-500/20">
                    <div className="text-blue-500 text-sm font-bold uppercase mb-1">Days Present</div>
                    <div className="text-3xl font-black text-white">{stats.present}</div>
                </div>
                <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/20">
                    <div className="text-red-500 text-sm font-bold uppercase mb-1">Days Absent</div>
                    <div className="text-3xl font-black text-white">{stats.absent}</div>
                </div>
            </div>

            {/* Attendance Calendar */}
            <div className="bg-dark-card border border-white/5 rounded-[32px] p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-white">Monthly Overview</h2>
                        <p className="text-gray-500 text-sm">Visual attendance tracking</p>
                    </div>
                    <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl">
                        <button
                            onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                            className="p-2 hover:bg-white/10 rounded-xl text-gray-400 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-white font-bold min-w-[120px] text-center">
                            {currentMonth.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })}
                        </span>
                        <button
                            onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                            className="p-2 hover:bg-white/10 rounded-xl text-gray-400 transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-gray-600 text-[10px] font-black uppercase tracking-widest pb-4">
                            {day}
                        </div>
                    ))}
                    {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square" />
                    ))}
                    {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate() }).map((_, i) => {
                        const day = i + 1;
                        const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toISOString().split('T')[0];
                        const record = attendance.find(a => a.date === dateStr);

                        return (
                            <div
                                key={day}
                                className={cn(
                                    "aspect-square rounded-2xl flex flex-col items-center justify-center relative border transition-all group cursor-default",
                                    record?.status === 'present' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                                        record?.status === 'absent' ? "bg-red-500/10 border-red-500/20 text-red-500" :
                                            "bg-white/[0.02] border-white/5 text-gray-600"
                                )}
                            >
                                <span className="text-sm font-bold">{day}</span>
                                {record && (
                                    <div className={cn(
                                        "w-1 h-1 rounded-full mt-1",
                                        record.status === 'present' ? "bg-emerald-500" : "bg-red-500"
                                    )} />
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8 flex items-center gap-6 pt-8 border-t border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-xs text-gray-400 font-medium">Present</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-xs text-gray-400 font-medium">Absent</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-white/10" />
                        <span className="text-xs text-gray-400 font-medium">No Record</span>
                    </div>
                </div>
            </div>

            <div className="bg-dark-card border border-white/5 rounded-[32px] overflow-hidden">
                <div className="p-6 border-b border-white/5">
                    <h2 className="text-lg font-bold text-white">Daily Logs</h2>
                </div>
                {loading ? (
                    <div className="p-10 flex justify-center"><div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : attendance.length === 0 ? (
                    <div className="p-10 text-center text-gray-500 italic">No attendance records found.</div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {attendance.map(record => (
                            <div key={record.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${record.status === 'present' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                        }`}>
                                        <CalendarIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-white font-bold">{new Date(record.date).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                        <div className="text-gray-500 text-sm">{record.status === 'present' ? 'Signed in' : 'Marked absent'}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {record.status === 'present' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                                    <span className={`text-sm font-black uppercase tracking-widest ${record.status === 'present' ? 'text-emerald-500' : 'text-red-500'
                                        }`}>{record.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
