import { useState, useEffect } from 'react';
import {
    User,
    Calendar,
    Award,
    TrendingUp,
    Clock,
    CheckCircle2,
    XCircle,
    BookOpen,
    Sparkles,
    MessageSquare,
    Send,
    X,
    Bot,
    ArrowRight
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { geminiService } from '../lib/gemini';
import { cn } from '../components/Layout';

interface AttendanceRecord {
    id: string;
    status: 'present' | 'absent';
    date: string;
    schoolId: string;
    studentId: string;
}

interface StudentResult {
    id: string;
    subjectId: string;
    caScore: number;
    examScore: number;
    totalScore: number;
    schoolId: string;
    studentId: string;
    subjectName?: string;
}

export const StudentPortal = () => {
    const { profile, user, schoolId } = useAuth();
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [results, setResults] = useState<StudentResult[]>([]);
    const [stats, setStats] = useState({
        attendanceRate: 0,
        averageScore: 0,
        totalSubjects: 0
    });
    const [loading, setLoading] = useState(true);
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // AI Study Assistant States
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<{ id: string; role: 'user' | 'model', content: string }[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isChatting, setIsChatting] = useState(false);

    useEffect(() => {
        if (!user || !schoolId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Student Results
                const { data: resultsData, error: resultsError } = await supabase
                    .from('results')
                    .select('*, subjects(name)')
                    .eq('student_id', user.id);

                if (resultsError) throw resultsError;

                const resultsList = (resultsData || []).map(r => ({
                    id: r.id,
                    subjectId: r.subject_id || r.subjectId || 'Unknown', // Handle snake_case from Supabase
                    caScore: r.ca_score,
                    examScore: r.exam_score,
                    totalScore: r.total_score,
                    subjectName: r.subjects?.name || r.subject_id,
                    schoolId: r.school_id,
                    studentId: r.student_id
                })) as StudentResult[];

                setResults(resultsList);

                // 2. Fetch Attendance (Recent)
                const { data: attendanceData, error: attendanceError } = await supabase
                    .from('attendance')
                    .select('*')
                    .eq('school_id', schoolId)
                    .eq('student_id', user.id)
                    .limit(20);

                if (attendanceError) throw attendanceError;

                const attendanceList = (attendanceData || []).map(a => ({
                    id: a.id,
                    status: a.status,
                    date: a.date,
                    schoolId: a.school_id,
                    studentId: a.student_id
                })) as AttendanceRecord[];

                setAttendance(attendanceList);

                // 3. Calculate Stats
                const totalAttendance = attendanceList.length;
                const presentCount = attendanceList.filter(a => a.status === 'present').length;
                const rate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 100;

                const avg = resultsList.length > 0
                    ? resultsList.reduce((acc, curr) => acc + (curr.totalScore || 0), 0) / resultsList.length
                    : 0;

                setStats({
                    attendanceRate: Math.round(rate),
                    averageScore: Math.round(avg),
                    totalSubjects: resultsList.length
                });

            } catch (err) {
                console.error("Error fetching portal data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, schoolId]);

    const handleGenerateInsight = async () => {
        if (results.length === 0) return;
        setIsGenerating(true);
        try {
            const insight = await geminiService.generateStudentPerformanceInsight(results, stats.attendanceRate);
            setAiInsight(insight);
        } catch (err) {
            console.error("Error generating insight:", err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isChatting) return;

        const userMsg = inputMessage;
        setInputMessage('');
        const newMessages = [...chatMessages, { role: 'user' as const, content: userMsg }];
        setChatMessages(newMessages);
        setIsChatting(true);

        try {
            const context = `Average Score: ${stats.averageScore}%. Subjects: ${results.map(r => `${r.subjectId} (${r.totalScore})`).join(', ')}. Weakest: ${results.sort((a, b) => a.totalScore - b.totalScore).slice(0, 2).map(r => r.subjectId).join(', ')}`;
            const response = await geminiService.chatWithStudyAssistant(userMsg, chatMessages, context);
            setChatMessages([...newMessages, { role: 'model' as const, content: response }]);
        } catch (err) {
            console.error("Chat Error:", err);
        } finally {
            setIsChatting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header / Welcome */}
            <header className="relative overflow-hidden bg-gradient-to-br from-teal-500 to-emerald-600 rounded-[32px] p-8 text-white shadow-2xl shadow-teal-500/20">
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                            <User className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="text-teal-100 text-sm font-bold uppercase tracking-widest opacity-80">Student Portal</div>
                            <h1 className="text-3xl font-black">Welcome, {profile?.fullName || 'Student'}</h1>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm font-medium">
                        <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm">Admission: {profile?.admissionNumber}</span>
                        <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm">Academic Year: 2025/2026</span>
                    </div>
                </div>
                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-400/20 blur-[60px] rounded-full -translate-x-1/2 translate-y-1/2" />
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    icon={Clock}
                    label="Current Attendance"
                    value={`${stats.attendanceRate}%`}
                    color="teal"
                    trend={`${stats.attendanceRate > 90 ? 'Excellent' : 'Needs attention'}`}
                />
                <StatCard
                    icon={TrendingUp}
                    label="Average Score"
                    value={`${stats.averageScore}%`}
                    color="blue"
                    trend={`${stats.averageScore >= 70 ? 'Distinction' : 'Good'}`}
                />
                <StatCard
                    icon={Award}
                    label="Subjects Taken"
                    value={stats.totalSubjects.toString()}
                    color="purple"
                    trend="Term 1"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Academic Performance */}
                <section className="bg-dark-card border border-white/5 rounded-[32px] overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <BookOpen className="w-5 h-5 text-teal-400" />
                            <h2 className="text-lg font-bold text-white">Academic Performance</h2>
                        </div>
                        <NavLink to="/portal/results" className="text-teal-500 text-sm font-bold hover:underline py-1 px-3 rounded-lg hover:bg-teal-500/10 transition-colors flex items-center gap-1">
                            <span>View All</span>
                            <ArrowRight className="w-3 h-3" />
                        </NavLink>
                    </div>
                    <div className="p-6 space-y-4">
                        {results.length === 0 ? (
                            <div className="text-center py-10 text-gray-600 italic">No results uploaded for this term yet.</div>
                        ) : (
                            results.map(res => (
                                <div key={res.id} className="flex items-center justify-between p-4 bg-dark-bg rounded-2xl border border-white/5 hover:border-teal-500/20 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 group-hover:bg-teal-500/10 group-hover:text-teal-400 transition-all">
                                            {res.subjectName?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-white font-bold">{res.subjectName || 'Subject'}</div>
                                            <div className="text-gray-500 text-xs">CA: {res.caScore} | Exam: {res.examScore}</div>
                                        </div>
                                    </div>
                                    <div className={`text-lg font-black ${res.totalScore >= 70 ? 'text-emerald-400' : 'text-white'}`}>
                                        {res.totalScore}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Attendance Timeline */}
                <section className="bg-dark-card border border-white/5 rounded-[32px] overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-teal-400" />
                            <h2 className="text-lg font-bold text-white">Recent Attendance</h2>
                        </div>
                        <NavLink to="/portal/attendance" className="text-teal-500 text-sm font-bold hover:underline py-1 px-3 rounded-lg hover:bg-teal-500/10 transition-colors flex items-center gap-1">
                            <span>View History</span>
                            <ArrowRight className="w-3 h-3" />
                        </NavLink>
                    </div>
                    <div className="p-6">
                        {attendance.length === 0 ? (
                            <div className="text-center py-10 text-gray-600 italic">No attendance records found.</div>
                        ) : (
                            <div className="space-y-4">
                                {attendance.map(record => (
                                    <div key={record.id} className="flex items-center justify-between p-4 bg-dark-bg rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${record.status === 'present' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                                }`}>
                                                {record.status === 'present' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                            </div>
                                            <div className="text-white font-medium">{new Date(record.date).toLocaleDateString('en-NG', { weekday: 'short', day: '2-digit', month: 'short' })}</div>
                                        </div>
                                        <div className={`text-xs font-bold uppercase tracking-widest ${record.status === 'present' ? 'text-emerald-500' : 'text-red-500'
                                            }`}>
                                            {record.status}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* AI Insights (Phase 5 Extension) */}
            <div className="bg-gradient-to-br from-indigo-900/40 to-dark-card border border-indigo-500/20 rounded-[32px] p-8 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="p-5 rounded-[24px] bg-indigo-500/10 text-indigo-400 shadow-inner">
                        <Sparkles className="w-12 h-12 animate-pulse" />
                    </div>
                    <div className="text-center md:text-left">
                        <h2 className="text-2xl font-bold text-white mb-2">AI Performance Insights</h2>
                        <p className="text-indigo-200/60 max-w-xl">
                            {aiInsight ? 'Your personalized performance analysis is ready.' : 'Our AI is analyzing your results and attendance patterns to provide personalized study recommendations and term predictions.'}
                        </p>
                    </div>
                    {!aiInsight ? (
                        <div className="relative md:ml-auto">
                            <div className="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce z-20">
                                NEW
                            </div>
                            <button
                                onClick={handleGenerateInsight}
                                disabled={isGenerating || results.length === 0}
                                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-500/20 whitespace-nowrap flex items-center gap-2 relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                {isGenerating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5 animate-pulse" />
                                        Generate Insight
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setAiInsight(null)}
                            className="md:ml-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all whitespace-nowrap"
                        >
                            Clear Analysis
                        </button>
                    )}
                </div>

                {aiInsight && (
                    <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/10 text-indigo-100 prose prose-invert max-w-none">
                        <div className="whitespace-pre-wrap leading-relaxed">
                            {aiInsight}
                        </div>
                    </div>
                )}
            </div>

            {/* AI Floating Button */}
            <button
                onClick={() => setIsChatOpen(true)}
                className="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-2xl flex items-center justify-center group transition-all hover:scale-110 z-40"
            >
                <MessageSquare className="w-8 h-8 group-hover:rotate-12 transition-transform" />
                <div className="absolute -top-2 -right-2 bg-pink-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-bounce">
                    AI HELP
                </div>
            </button>

            {/* AI Assistant Sidebar */}
            {isChatOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-dark-bg/60 backdrop-blur-sm" onClick={() => setIsChatOpen(false)} />
                    <div className="relative w-full max-w-md bg-dark-card border-l border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-indigo-600/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white">
                                    <Bot className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-white font-bold">Study Assistant</h2>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Online</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {chatMessages.length === 0 && (
                                <div className="text-center py-10 space-y-4">
                                    <Sparkles className="w-10 h-10 text-indigo-400 mx-auto" />
                                    <p className="text-gray-400 text-sm px-10 leading-relaxed">
                                        Hi {profile?.fullName.split(' ')[0]}! I've analyzed your performance in <b>{results.sort((a, b) => a.totalScore - b.totalScore)[0]?.subjectId}</b>.
                                        Want to try some practice questions?
                                    </p>
                                </div>
                            )}
                            {chatMessages.map((msg, i) => (
                                <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                                    <div className={cn(
                                        "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed",
                                        msg.role === 'user' ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white/5 text-gray-200 rounded-tl-none border border-white/5"
                                    )}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isChatting && (
                                <div className="flex justify-start">
                                    <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/5 flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-white/5 bg-dark-card">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                                className="flex gap-2"
                            >
                                <input
                                    type="text"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    placeholder="Ask anything..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-indigo-500 outline-none transition-all text-sm"
                                />
                                <button
                                    type="submit"
                                    disabled={!inputMessage.trim() || isChatting}
                                    className="w-12 h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, color, trend }: any) => {
    const colors: any = {
        teal: 'text-teal-400 bg-teal-500/10 border-teal-500/20 shadow-teal-500/5',
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-blue-500/5',
        purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20 shadow-purple-500/5'
    };

    return (
        <div className={`p-8 rounded-[32px] bg-dark-card border transition-all hover:scale-[1.02] shadow-xl ${colors[color]}`}>
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${colors[color]} bg-opacity-20`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold uppercase tracking-widest opacity-60">{trend}</div>
            </div>
            <div className="text-4xl font-black text-white mb-1">{value}</div>
            <div className="text-gray-500 text-sm font-bold uppercase tracking-wider">{label}</div>
        </div>
    );
};
