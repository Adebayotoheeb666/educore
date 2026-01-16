import { useState, useEffect } from 'react';
import {
    ChevronDown,
    Calendar,
    Award,
    TrendingUp,
    CheckCircle2,
    AlertCircle,
    BarChart3,
    CreditCard,
    ExternalLink,
    MessageSquare,
    Wallet,
    LineChart
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { geminiService } from '../lib/gemini';
import { ParentTeacherMessaging } from '../components/ParentPortal/ParentTeacherMessaging';
import { FinancialInvoicing } from '../components/ParentPortal/FinancialInvoicing';
import { NotificationCenter } from '../components/ParentPortal/NotificationCenter';
import { ChildPerformanceTrends } from '../components/ParentPortal/ChildPerformanceTrends';

interface Child {
    id: string;
    fullName: string;
    admissionNumber: string;
}

interface AttendanceRecord {
    id: string;
    status: 'present' | 'absent';
    date: string;
}

interface ExamResult {
    id: string;
    subjectId: string;
    caScore: number;
    examScore: number;
    totalScore: number;
    grade?: string;
    term?: string;
    subjectName?: string;
}

interface AttendanceStats {
    total: number;
    present: number;
    absent: number;
    rate: number;
}

export const ParentPortal = () => {
    const { user, schoolId, profile } = useAuth();
    const [children, setChildren] = useState<Child[]>([]);
    const [selectedChildId, setSelectedChildId] = useState<string>('');
    const [selectedChildName, setSelectedChildName] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [attendance, setAttendance] = useState<AttendanceStats>({ total: 0, present: 0, absent: 0, rate: 0 });
    const [results, setResults] = useState<ExamResult[]>([]);
    const [aiInsight, setAiInsight] = useState<string>('');
    const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
    const [showChildrenMenu, setShowChildrenMenu] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'messaging' | 'finances'>('overview');

    // Fetch parent's children
    useEffect(() => {
        const fetchChildren = async () => {
            if (!user || !schoolId) return;

            setLoading(true);
            try {
                let fetchedChildren: Child[] = [];

                if (profile?.linkedStudents && Array.isArray(profile.linkedStudents) && profile.linkedStudents.length > 0) {
                    const { data, error } = await supabase
                        .from('users')
                        .select('id, full_name, admission_number')
                        .in('id', profile.linkedStudents)
                        .eq('school_id', schoolId);

                    if (error) throw error;

                    fetchedChildren = (data || []).map(u => ({
                        id: u.id,
                        fullName: u.full_name,
                        admissionNumber: u.admission_number
                    }));
                }

                if (fetchedChildren.length === 0) {
                    setChildren([]);
                    setLoading(false);
                    return;
                }

                setChildren(fetchedChildren);
                if (fetchedChildren.length > 0) {
                    setSelectedChildId(fetchedChildren[0].id);
                    setSelectedChildName(fetchedChildren[0].fullName);
                }
            } catch (err) {
                console.error('Error fetching children:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchChildren();
    }, [user, schoolId, profile]);

    // Fetch child's academic data
    useEffect(() => {
        const fetchChildData = async () => {
            if (!selectedChildId || !schoolId) return;

            setLoading(true);
            setAiInsight('');

            try {
                const { data: attendanceData, error: attError } = await supabase
                    .from('attendance')
                    .select('*')
                    .eq('school_id', schoolId)
                    .eq('student_id', selectedChildId)
                    .order('created_at', { ascending: false })
                    .limit(30);

                if (attError) throw attError;

                const attendanceRecords = (attendanceData || []).map(a => ({
                    id: a.id,
                    status: a.status,
                    date: a.date,
                })) as AttendanceRecord[];

                const total = attendanceRecords.length;
                const present = attendanceRecords.filter(a => a.status === 'present').length;
                const absent = total - present;
                const rate = total > 0 ? (present / total) * 100 : 0;

                setAttendance({ total, present, absent, rate });

                const { data: resultsData, error: resError } = await supabase
                    .from('results')
                    .select('*, subjects(name)')
                    .eq('school_id', schoolId)
                    .eq('student_id', selectedChildId)
                    .order('updated_at', { ascending: false })
                    .limit(10);

                if (resError) throw resError;

                const resultsList = (resultsData || []).map(r => ({
                    id: r.id,
                    subjectId: r.subject_id,
                    caScore: r.ca_score,
                    examScore: r.exam_score,
                    totalScore: r.total_score,
                    term: r.term,
                    grade: r.grade,
                    subjectName: r.subjects?.name || r.subject_id
                })) as any[];

                setResults(resultsList);
            } catch (err) {
                console.error('Error fetching child data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchChildData();
    }, [selectedChildId, schoolId]);

    const handleGenerateInsight = async () => {
        if (results.length === 0) {
            return;
        }

        setIsGeneratingInsight(true);
        try {
            const insight = await geminiService.generateStudentPerformanceInsight(results, attendance.rate);
            setAiInsight(insight);
        } catch (err) {
            console.error('Error generating insight:', err);
        } finally {
            setIsGeneratingInsight(false);
        }
    };

    const handleSelectChild = (childId: string, childName: string) => {
        setSelectedChildId(childId);
        setSelectedChildName(childName);
        setShowChildrenMenu(false);
    };

    if (loading && children.length === 0) {
        return (
            <div className="flex items-center justify-center py-20 bg-dark-bg min-h-screen">
                <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (children.length === 0) {
        return (
            <div className="min-h-screen bg-dark-bg text-gray-100 p-8">
                <header>
                    <h1 className="text-3xl font-bold text-white">Parent Portal</h1>
                    <p className="text-gray-400 mt-2">Monitor your children's academic progress</p>
                </header>

                <div className="mt-8 bg-orange-500/10 border border-orange-500/30 rounded-2xl p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-orange-300 mb-2">No Children Found</h2>
                    <p className="text-orange-200/70">
                        Your account hasn't been linked to any students yet. Please contact your school administrator.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 min-h-screen bg-dark-bg text-gray-100 p-8">
            {/* Header with Child Switcher and Notifications */}
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Parent Portal</h1>
                    <p className="text-gray-400 mt-2">Monitor your children's academic progress</p>
                </div>

                <div className="flex items-center gap-4">
                    <NotificationCenter childId={selectedChildId} />

                    {children.length > 1 && (
                        <div className="relative">
                            <button
                                onClick={() => setShowChildrenMenu(!showChildrenMenu)}
                                className="flex items-center gap-3 px-6 py-3 bg-dark-card border border-white/10 hover:border-teal-500 rounded-xl transition-colors"
                            >
                                <div className="flex-1 text-left">
                                    <p className="text-xs text-gray-400">Viewing</p>
                                    <p className="text-white font-bold">{selectedChildName}</p>
                                </div>
                                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${showChildrenMenu ? 'rotate-180' : ''}`} />
                            </button>

                            {showChildrenMenu && (
                                <div className="absolute right-0 mt-2 w-72 bg-dark-card border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                                    {children.map(child => (
                                        <button
                                            key={child.id}
                                            onClick={() => handleSelectChild(child.id, child.fullName)}
                                            className={`w-full text-left px-6 py-4 transition-colors flex items-center justify-between border-b border-white/5 last:border-b-0 ${selectedChildId === child.id
                                                ? 'bg-teal-500/20 text-teal-400'
                                                : 'hover:bg-white/5 text-gray-300'
                                                }`}
                                        >
                                            <div>
                                                <p className="font-bold">{child.fullName}</p>
                                                <p className="text-xs text-gray-500 mt-1">#{child.admissionNumber}</p>
                                            </div>
                                            {selectedChildId === child.id && (
                                                <CheckCircle2 className="w-5 h-5" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="flex gap-2 border-b border-white/10 overflow-x-auto">
                {[
                    { id: 'overview', label: 'Overview', icon: BarChart3 },
                    { id: 'trends', label: 'Performance Trends', icon: LineChart },
                    { id: 'messaging', label: 'Messages', icon: MessageSquare },
                    { id: 'finances', label: 'Finances', icon: Wallet }
                ].map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-3 font-bold transition-colors flex items-center gap-2 border-b-2 whitespace-nowrap ${activeTab === tab.id
                                ? 'border-teal-500 text-teal-400'
                                : 'border-transparent text-gray-400 hover:text-white'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Attendance & Performance Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                        {/* Attendance Card */}
                        <div className="bg-dark-card border border-white/5 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-gray-400 text-sm font-bold">Attendance Rate</h3>
                                <Calendar className="w-5 h-5 text-teal-400" />
                            </div>
                            <div className="space-y-3">
                                <div className="text-3xl font-bold text-white">{attendance.rate.toFixed(1)}%</div>
                                <div className="text-sm text-gray-400">
                                    {attendance.present} present, {attendance.absent} absent out of {attendance.total} days
                                </div>
                                <div className="w-full bg-white/5 rounded-full h-2 mt-4 overflow-hidden">
                                    <div
                                        className="bg-teal-500 h-full transition-all"
                                        style={{ width: `${attendance.rate}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Average Score Card */}
                        <div className="bg-dark-card border border-white/5 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-gray-400 text-sm font-bold">Average Score</h3>
                                <Award className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div className="space-y-3">
                                <div className="text-3xl font-bold text-white">
                                    {results.length > 0
                                        ? (results.reduce((sum, r) => sum + r.totalScore, 0) / results.length).toFixed(1)
                                        : 'N/A'}
                                </div>
                                <div className="text-sm text-gray-400">
                                    {results.length} subject{results.length !== 1 ? 's' : ''} recorded
                                </div>
                            </div>
                        </div>

                        {/* Performance Trend Card */}
                        <div className="bg-dark-card border border-white/5 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-gray-400 text-sm font-bold">Performance</h3>
                                <TrendingUp className="w-5 h-5 text-blue-400" />
                            </div>
                            <div className="space-y-3">
                                <div className="text-3xl font-bold text-white">
                                    {results.length > 1
                                        ? results[0].totalScore > results[results.length - 1].totalScore
                                            ? '📈'
                                            : results[0].totalScore < results[results.length - 1].totalScore
                                                ? '📉'
                                                : '→'
                                        : '→'}
                                </div>
                                <div className="text-sm text-gray-400">
                                    {results.length > 1
                                        ? `Latest: ${results[0].totalScore}, Previous: ${results[results.length - 1].totalScore}`
                                        : 'More data needed'}
                                </div>
                            </div>
                        </div>

                        {/* Fees Card */}
                        <div className="bg-dark-card border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-gray-400 text-sm font-bold">Fees & Payments</h3>
                                <CreditCard className="w-5 h-5 text-orange-400" />
                            </div>
                            <div className="space-y-3">
                                <div className="text-3xl font-bold text-white">₦42,500</div>
                                <div className="text-xs text-orange-400 font-bold uppercase tracking-wider">Outstanding Balance</div>
                            </div>
                            <NavLink
                                to="/financial/pay-fees"
                                className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-dark-bg font-bold rounded-xl transition-all border border-orange-500/20 group-hover:scale-[1.02]"
                            >
                                <span>Pay Fees</span>
                                <ExternalLink className="w-4 h-4" />
                            </NavLink>
                        </div>
                    </div>

                    {/* AI Performance Insight */}
                    {results.length > 0 && (
                        <div className="bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border border-teal-500/30 rounded-2xl p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white">AI Performance Insight</h3>
                                    <p className="text-gray-400 text-sm mt-1">Powered by Gemini</p>
                                </div>
                                <button
                                    onClick={handleGenerateInsight}
                                    disabled={isGeneratingInsight}
                                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <BarChart3 className={`w-4 h-4 ${isGeneratingInsight ? 'animate-spin' : ''}`} />
                                    {isGeneratingInsight ? 'Generating...' : 'Generate Insight'}
                                </button>
                            </div>

                            {aiInsight ? (
                                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                                    <p className="text-gray-200 leading-relaxed text-sm">{aiInsight}</p>
                                </div>
                            ) : (
                                <div className="bg-white/5 border border-dashed border-white/10 rounded-lg p-8 text-center text-gray-400">
                                    <p>Click "Generate Insight" to receive AI-powered analysis of your child's performance</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Recent Results Table */}
                    {results.length > 0 && (
                        <div className="bg-dark-card border border-white/5 rounded-2xl overflow-hidden">
                            <div className="p-6 border-b border-white/5">
                                <h3 className="text-lg font-bold text-white">Recent Results</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-white/5 border-b border-white/5">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-gray-400 font-bold">Subject</th>
                                            <th className="px-6 py-4 text-center text-gray-400 font-bold">CA Score</th>
                                            <th className="px-6 py-4 text-center text-gray-400 font-bold">Exam Score</th>
                                            <th className="px-6 py-4 text-center text-gray-400 font-bold">Total</th>
                                            <th className="px-6 py-4 text-center text-gray-400 font-bold">Grade</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {results.map(result => {
                                            const percentage = result.totalScore;
                                            let grade = 'F';
                                            let gradeColor = 'text-red-400';
                                            if (percentage >= 70) { grade = 'A'; gradeColor = 'text-teal-400'; }
                                            else if (percentage >= 60) { grade = 'B'; gradeColor = 'text-emerald-400'; }
                                            else if (percentage >= 50) { grade = 'C'; gradeColor = 'text-yellow-400'; }
                                            else if (percentage >= 45) { grade = 'D'; gradeColor = 'text-orange-400'; }

                                            return (
                                                <tr key={result.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4 text-white font-medium">{result.subjectName}</td>
                                                    <td className="px-6 py-4 text-center text-gray-400">{result.caScore}</td>
                                                    <td className="px-6 py-4 text-center text-gray-400">{result.examScore}</td>
                                                    <td className="px-6 py-4 text-center text-white font-bold">{result.totalScore}</td>
                                                    <td className={`px-6 py-4 text-center font-bold ${gradeColor}`}>{grade}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Empty State for No Results */}
                    {results.length === 0 && !loading && (
                        <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-8 text-center">
                            <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-orange-300 mb-2">No Results Yet</h2>
                            <p className="text-orange-200/70">
                                Your child doesn't have any recorded results yet. Results will appear here as teachers record grades.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Performance Trends Tab */}
            {activeTab === 'trends' && selectedChildId && (
                <ChildPerformanceTrends childId={selectedChildId} />
            )}

            {/* Messaging Tab */}
            {activeTab === 'messaging' && selectedChildId && (
                <ParentTeacherMessaging childId={selectedChildId} />
            )}

            {/* Finances Tab */}
            {activeTab === 'finances' && selectedChildId && (
                <FinancialInvoicing childId={selectedChildId} />
            )}
        </div>
    );
};
