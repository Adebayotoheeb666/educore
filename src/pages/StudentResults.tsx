import { useState, useEffect } from 'react';
import { BookOpen, Award, ArrowLeft, Download, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface StudentResult {
    id: string;
    subjectId: string;
    caScore: number;
    examScore: number;
    totalScore: number;
    term: string;
    session: string;
}

export const StudentResults = () => {
    const { user, schoolId } = useAuth();
    const [results, setResults] = useState<StudentResult[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user || !schoolId) return;

        const fetchResults = async () => {
            try {
                const q = query(
                    collection(db, 'results'),
                    where('schoolId', '==', schoolId),
                    where('studentId', '==', user.uid)
                );
                const snap = await getDocs(q);
                const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentResult));
                setResults(list);
            } catch (err) {
                console.error("Error fetching results:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [user, schoolId]);

    const average = results.length > 0 ? Math.round(results.reduce((acc, curr) => acc + curr.totalScore, 0) / results.length) : 0;

    return (
        <div className="space-y-8 pb-20">
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
                        <div className="text-5xl font-black text-white">{results.length}</div>
                        <div className="text-gray-500 text-sm mt-1 uppercase tracking-widest font-bold">Subjects Graded</div>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                        <BookOpen className="w-8 h-8" />
                    </div>
                </div>
            </div>

            {/* Performance Chart */}
            {!loading && results.length > 0 && (
                <div className="bg-dark-card border border-white/5 p-8 rounded-[32px]">
                    <h3 className="text-lg font-bold text-white mb-6">Performance Trends</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={results}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis dataKey="subjectId" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
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

            <div className="bg-dark-card border border-white/5 rounded-[32px] overflow-hidden">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">Detailed Scores</h2>
                        <span className="text-gray-500 text-sm">Session: 2025/2026 | 1st Term</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500">
                        <Award className="w-5 h-5" />
                    </div>
                </div>

                {loading ? (
                    <div className="p-10 flex justify-center"><div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : results.length === 0 ? (
                    <div className="p-10 text-center text-gray-500 italic">No academic results recorded yet.</div>
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
                                {results.map(res => (
                                    <tr key={res.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-6 font-bold text-white">{res.subjectId}</td>
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
                                            <span className="font-black text-xl text-white opacity-40 group-hover:opacity-100 transition-opacity">
                                                {res.totalScore >= 70 ? 'A' : res.totalScore >= 60 ? 'B' : res.totalScore >= 50 ? 'C' : 'D'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
