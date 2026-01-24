import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import {
    Award,
    TrendingUp,
    Download,
    Filter,
    Search,
    BookOpen,
    ArrowLeft
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

interface StudentResult {
    id: string;
    subjectId: string;
    caScore: number;
    examScore: number;
    totalScore: number;
    grade?: string;
    term?: string;
    session?: string;
    createdAt?: string;
    subjectName?: string;
}

export const StudentResults = () => {
    const { user, schoolId } = useAuth();
    const [results, setResults] = useState<StudentResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [termFilter, setTermFilter] = useState('all');
    const navigate = useNavigate();

    useEffect(() => {
        if (!user || !schoolId) return;

        const fetchResults = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('results')
                    .select('*, subjects(name)')
                    .eq('school_id', schoolId)
                    .eq('student_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                const resultsList = (data || []).map(r => ({
                    id: r.id,
                    subjectId: r.subject_id,
                    caScore: r.ca_score,
                    examScore: r.exam_score,
                    totalScore: r.total_score,
                    term: r.term,
                    session: r.session || '2025/2026',
                    createdAt: r.created_at,
                    subjectName: r.subjects?.name || r.subject_id
                }));

                setResults(resultsList);
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : String(err);
                console.error("Error fetching results:", errorMsg, err);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [user, schoolId]);

    const filteredResults = results.filter(result => {
        const matchesSearch = (result.subjectName || result.subjectId)?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTerm = termFilter === 'all' || result.term === termFilter;
        return matchesSearch && matchesTerm;
    });

    const average = filteredResults.length > 0
        ? Math.round(filteredResults.reduce((acc, curr) => acc + curr.totalScore, 0) / filteredResults.length)
        : 0;

    const getGrade = (score: number) => {
        if (score >= 70) return { grade: 'A', color: 'text-teal-400' };
        if (score >= 60) return { grade: 'B', color: 'text-emerald-400' };
        if (score >= 50) return { grade: 'C', color: 'text-yellow-400' };
        if (score >= 45) return { grade: 'D', color: 'text-orange-400' };
        return { grade: 'F', color: 'text-red-400' };
    };

    return (
        <div className="space-y-8 pb-20 bg-dark-bg text-gray-100 p-8 min-h-screen">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-2xl font-bold text-white">Academic Results</h1>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-teal-500 text-dark-bg font-bold rounded-xl hover:bg-teal-400 transition-colors">
                    <Download className="w-5 h-5" />
                    Export PDF
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-teal-500/20 to-emerald-500/5 border border-teal-500/20 p-8 rounded-[32px] flex items-center justify-between">
                    <div>
                        <div className="text-teal-400 text-sm font-bold uppercase tracking-widest mb-2">Current Average</div>
                        <div className="text-5xl font-black text-white">{average}%</div>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-teal-500/20 flex items-center justify-center text-teal-400">
                        <TrendingUp className="w-8 h-8" />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/5 border border-purple-500/20 p-8 rounded-[32px] flex items-center justify-between">
                    <div>
                        <div className="text-purple-400 text-sm font-bold uppercase tracking-widest mb-2">Subject Performance</div>
                        <div className="text-5xl font-black text-white">{filteredResults.length}</div>
                        <div className="text-gray-500 text-sm mt-1 uppercase tracking-widest font-bold">Subjects Graded</div>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                        <BookOpen className="w-8 h-8" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="bg-dark-card border border-white/10 rounded-lg px-4 py-3 flex items-center gap-2 flex-1">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search subjects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent border-none outline-none text-white w-full placeholder-gray-500"
                    />
                </div>
                <div className="bg-dark-card border border-white/10 rounded-lg px-4 py-3 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                        value={termFilter}
                        onChange={(e) => setTermFilter(e.target.value)}
                        className="bg-transparent border-none outline-none text-white cursor-pointer"
                    >
                        <option value="all">All Terms</option>
                        <option value="First Term">First Term</option>
                        <option value="Second Term">Second Term</option>
                        <option value="Third Term">Third Term</option>
                    </select>
                </div>
            </div>

            {/* Performance Chart */}
            {!loading && filteredResults.length > 0 && (
                <div className="bg-dark-card border border-white/5 p-8 rounded-[32px]">
                    <h3 className="text-lg font-bold text-white mb-6">Performance Trends</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={filteredResults}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis dataKey="subjectName" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                                    itemStyle={{ color: '#14b8a6' }}
                                />
                                <Line type="monotone" dataKey="totalScore" stroke="#14b8a6" strokeWidth={4} dot={{ fill: '#14b8a6', r: 6 }} activeDot={{ r: 8, stroke: '#14b8a6', strokeWidth: 2 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Results Table */}
            <div className="bg-dark-card border border-white/5 rounded-[32px] overflow-hidden">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">Detailed Scores</h2>
                        <span className="text-gray-500 text-sm">Session: {filteredResults[0]?.session || '2025/2026'} | {filteredResults[0]?.term || 'Current Term'}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500">
                        <Award className="w-5 h-5" />
                    </div>
                </div>

                {loading ? (
                    <div className="p-10 flex justify-center"><div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : filteredResults.length === 0 ? (
                    <div className="p-10 text-center text-gray-500 italic">No academic results match your criteria.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 text-gray-500 text-xs font-bold uppercase tracking-widest">
                                    <th className="px-8 py-4">Subject</th>
                                    <th className="px-8 py-4 text-center">CA (40)</th>
                                    <th className="px-8 py-4 text-center">Exam (60)</th>
                                    <th className="px-8 py-4 text-center">Total (100)</th>
                                    <th className="px-8 py-4 text-right">Grade</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredResults.map(res => {
                                    const { grade, color } = getGrade(res.totalScore);
                                    return (
                                        <tr key={res.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-8 py-6 font-bold text-white">{res.subjectName}</td>
                                            <td className="px-8 py-6 text-center text-gray-400">{res.caScore}</td>
                                            <td className="px-8 py-6 text-center text-gray-400">{res.examScore}</td>
                                            <td className="px-8 py-6 text-center">
                                                <span className={`px-4 py-2 rounded-xl font-black ${res.totalScore >= 70 ? 'bg-emerald-500/10 text-emerald-500' :
                                                    res.totalScore >= 50 ? 'bg-blue-500/10 text-blue-400' :
                                                        'bg-red-500/10 text-red-500'
                                                    }`}>
                                                    {res.totalScore}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className={`font-black text-xl opacity-40 group-hover:opacity-100 transition-opacity ${color}`}>
                                                    {grade}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
