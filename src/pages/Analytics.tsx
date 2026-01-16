import { useEffect, useState } from 'react';
import { RefreshCw, Zap, Maximize2, Download, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { exportService } from '../lib/exportService';

interface UnifiedResult {
    id: string;
    studentName: string;
    score: number;
    total: number;
    feedback?: string;
    type: 'exam' | 'ai_scan';
    createdAt: any;
    subject?: string;
}

const StudentRow = ({ result }: { result: UnifiedResult }) => {
    let grade = 'F';
    let color = "bg-red-500 text-white";

    const percentage = (result.score / result.total) * 100;

    if (percentage >= 70) { grade = 'A'; color = "bg-teal-500 text-white"; }
    else if (percentage >= 60) { grade = 'B'; color = "bg-yellow-500 text-black"; }
    else if (percentage >= 50) { grade = 'C'; color = "bg-yellow-600 text-white"; }
    else if (percentage >= 45) { grade = 'D'; color = "bg-orange-500 text-white"; }

    const typeLabel = result.type === 'exam' ? 'Exam' : 'AI Scan';

    return (
        <div className="grid grid-cols-6 gap-4 items-center py-4 border-b border-white/5 hover:bg-white/5 px-4 transition-colors">
            <div className="col-span-2 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                    <img src={`https://ui-avatars.com/api/?name=${result.studentName}&background=random`} alt={result.studentName} />
                </div >
                <span className="font-bold text-white text-sm">{result.studentName}</span>
            </div >
            <div className="text-center text-sm text-gray-400">{result.subject || '-'}</div>
            <div className="flex justify-center">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${color}`}>
                    {grade}
                </div>
            </div>
            <div className="text-center text-sm text-gray-400">{result.score}/{result.total}</div>
            <div className="text-center text-sm text-gray-400">
                <span className="bg-teal-500/20 text-teal-300 px-2 py-1 rounded text-xs">{typeLabel}</span>
            </div>
        </div >
    );
};

export const Analytics = () => {
    const { schoolId, user } = useAuth();
    const [results, setResults] = useState<UnifiedResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('Gradebook');

    useEffect(() => {
        const fetchResults = async () => {
            if (!user || !schoolId) return;
            try {
                const unifiedResults: UnifiedResult[] = [];

                // Fetch exam results from results collection
                try {
                    const { data: examData, error: examError } = await supabase
                        .from('results')
                        .select('*')
                        .eq('school_id', schoolId)
                        .eq('teacher_id', user.id)
                        .order('updated_at', { ascending: false })
                        .limit(50);

                    if (examError) throw examError;

                    if (examData) {
                        examData.forEach((data: any) => {
                            unifiedResults.push({
                                id: data.id,
                                studentName: `Student ${data.student_id ? data.student_id.substring(0, 8) : 'N/A'}`,
                                score: data.total_score,
                                total: 100,
                                feedback: data.remarks,
                                type: 'exam',
                                createdAt: data.updated_at,
                                subject: data.subject_id
                            });
                        });
                    }
                } catch (err) {
                    console.warn("Error fetching exam results:", err);
                }

                // Fetch AI scan results from ai_scan_results collection
                try {
                    const { data: aiData, error: aiError } = await supabase
                        .from('ai_scan_results')
                        .select('*')
                        .eq('school_id', schoolId)
                        .eq('teacher_id', user.id)
                        .order('created_at', { ascending: false })
                        .limit(50);

                    if (aiError) throw aiError;

                    if (aiData) {
                        aiData.forEach((data: any) => {
                            unifiedResults.push({
                                id: data.id,
                                studentName: data.student_name,
                                score: data.score,
                                total: data.total,
                                feedback: data.feedback,
                                type: 'ai_scan',
                                createdAt: data.created_at
                            });
                        });
                    }
                } catch (err) {
                    console.warn("Error fetching AI scan results:", err);
                }

                // Sort by creation date
                unifiedResults.sort((a, b) => {
                    const aDate = a.createdAt ? new Date(a.createdAt) : new Date(0);
                    const bDate = b.createdAt ? new Date(b.createdAt) : new Date(0);
                    return bDate.getTime() - aDate.getTime();
                });

                setResults(unifiedResults);
            } catch (error) {
                console.error("Error fetching analytics:", error);
                setError("Failed to fetch results. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [schoolId, user]);

    // Calculate Class Metrics
    const avgScore = results.length > 0
        ? (results.reduce((acc, curr) => acc + curr.score, 0) / (results.length * 20)) * 100
        : 0;

    const handleExportGradeReport = async () => {
        if (results.length === 0) {
            setError('No grades to export');
            return;
        }

        setExporting(true);
        setError('');
        try {
            // Export a combined report for all students
            await exportService.exportGradeReportAsPDF('Class Report', results);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to export report');
        } finally {
            setExporting(false);
        }
    };

    const handleExportAsCSV = () => {
        if (results.length === 0) {
            setError('No grades to export');
            return;
        }

        try {
            const data = results.map(r => ({
                'Student Name': r.studentName,
                'Subject': r.subject || '-',
                'Score': r.score,
                'Total': r.total,
                'Percentage': ((r.score / r.total) * 100).toFixed(1) + '%',
                'Type': r.type === 'exam' ? 'Exam' : 'AI Scan',
                'Feedback': r.feedback || '-',
                'Date': r.createdAt?.toDate?.()?.toLocaleDateString('en-NG') || 'N/A'
            }));

            exportService.exportAsCSV('class-grades', data, [
                'Student Name',
                'Subject',
                'Score',
                'Total',
                'Percentage',
                'Type',
                'Feedback',
                'Date'
            ]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to export CSV');
        }
    };

    return (
        <div className="flex gap-6 h-auto">
            {/* Main Table Section */}
            <div className="flex-1 flex flex-col space-y-6">
                {/* Error Alert */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                        <p className="text-red-300 text-sm">{error}</p>
                    </div>
                )}

                <header className="mb-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">Class Performance</h1>
                            <p className="text-gray-400">Term 2 | {results.length} Results Recorded</p>
                        </div>
                        <div className="flex gap-2">
                            <span className="px-2 py-1 bg-teal-500/20 text-teal-400 text-xs font-bold rounded">SYNCED</span>
                            <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
                        </div>
                    </div>

                    {/* Sub Nav */}
                    <div className="flex gap-4 mt-6 border-b border-white/10 pb-4 justify-between items-center">
                        <div className="flex gap-4">
                            {['Gradebook', 'Heatmap', 'Attendance'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`text-sm font-bold pb-4 -mb-4 border-b-2 transition-colors ${activeTab === tab ? 'text-teal-400 border-teal-400' : 'text-gray-500 border-transparent hover:text-white'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Export Buttons */}
                        {activeTab === 'Gradebook' && results.length > 0 && (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleExportGradeReport}
                                    disabled={exporting}
                                    className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors"
                                >
                                    <Download className={`w-4 h-4 ${exporting ? 'animate-spin' : ''}`} />
                                    {exporting ? 'Exporting...' : 'PDF Report'}
                                </button>
                                <button
                                    onClick={handleExportAsCSV}
                                    className="flex items-center gap-2 bg-dark-card border border-white/10 hover:bg-white/5 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    CSV Export
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {activeTab === 'Gradebook' && (
                    <>
                        {/* Filter Chips */}
                        <div className="flex gap-3 mb-6">
                            {['All Subjects', 'Mathematics', 'Basic Science'].map((f, i) => (
                                <button key={f} className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center justify-between min-w-[120px] ${i === 0 ? 'bg-teal-600 text-white' : 'bg-dark-card text-gray-400 border border-white/10'}`}>
                                    {f} {i === 0 && <span className="ml-2">▼</span>}
                                </button>
                            ))}
                        </div>

                        {/* Table Header */}
                        <div className="bg-dark-card rounded-t-2xl border border-white/5 border-b-0 flex-1 overflow-hidden">
                            <div className="grid grid-cols-6 gap-4 px-4 py-4 bg-white/5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                <div className="col-span-2">Student</div>
                                <div className="text-center">Subject</div>
                                <div className="text-center">Grade</div>
                                <div className="text-center">Score</div>
                                <div className="text-center">Source</div>
                            </div>
                            <div className="overflow-y-auto max-h-[500px]">
                                {loading && <div className="p-4 text-center text-gray-500">Loading data...</div>}
                                {!loading && results.length === 0 && <div className="p-4 text-center text-gray-500">No results recorded yet.</div>}

                                {results.map((res) => (
                                    <StudentRow key={res.id} result={res} />
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'Heatmap' && (
                    <div className="flex-1 bg-dark-card border border-white/5 rounded-2xl p-8 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Zap className="w-8 h-8 text-orange-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Performance Heatmap</h3>
                            <p className="text-gray-400 max-w-sm mx-auto">
                                Visualizes student performance across different topics to identify weak areas.
                            </p>
                            <div className="mt-8 grid grid-cols-4 gap-2 opacity-50">
                                {Array.from({ length: 16 }).map((_, i) => (
                                    <div key={i} className={`w-12 h-12 rounded-lg ${Math.random() > 0.5 ? 'bg-teal-500/40' : 'bg-red-500/40'}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'Attendance' && (
                    <div className="flex-1 bg-dark-card border border-white/5 rounded-2xl p-8">
                        <h3 className="text-xl font-bold text-white mb-6">Today's Attendance</h3>
                        <div className="space-y-4">
                            {['John Doe', 'Jane Smith', 'Michael Johnson'].map((student) => (
                                <div key={student} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                    <span className="text-white font-bold">{student}</span>
                                    <div className="flex gap-2">
                                        <button className="px-4 py-2 bg-teal-500/20 text-teal-400 rounded-lg text-xs font-bold">PRESENT</button>
                                        <button className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/20">ABSENT</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Sidebar */}
            <div className="w-[350px] bg-dark-card border border-white/10 rounded-3xl p-6 hidden xl:block">
                {/* Sidebar Content (Static for Demo/Mock since we lack individual student profiles) */}
                <div className="flex justify-between items-start mb-8">
                    <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-xl bg-gray-700 overflow-hidden">
                            <img src="https://ui-avatars.com/api/?name=Chidi+O&background=random" alt="Chidi" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Class Average</h2>
                            <p className="text-gray-400 text-sm">Based on {results.length} scan(s)</p>
                        </div>
                    </div>
                    <button className="p-2 bg-white/5 rounded-full hover:bg-white/10"><Maximize2 className="w-4 h-4 text-gray-400" /></button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-dark-bg p-4 rounded-2xl border border-white/5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">ATTENDANCE</span>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-bold text-teal-400">92%</span>
                            <span className="text-[10px] text-teal-500 font-bold mb-1">+2% vs term</span>
                        </div>
                    </div>
                    <div className="bg-dark-bg p-4 rounded-2xl border border-white/5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">AVG SCORE</span>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-bold text-teal-400">{avgScore.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>

                <div className="bg-dark-bg p-6 rounded-2xl border border-teal-500/20 relative overflow-hidden mb-6">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-transparent" />
                    <div className="flex items-center gap-2 mb-4">
                        <div className="text-teal-400"><Zap className="w-4 h-4 fill-current" /></div>
                        <span className="text-teal-400 text-xs font-bold uppercase">AI PERFORMANCE INSIGHT</span>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">
                        {results.length > 0 ? "Recent scans show strong performance in biology concepts. Consider reviewing physics formulas next week." : "Start scanning scripts to get AI insights."}
                    </p>
                </div>

                <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-4">SCORE TREND (LAST 5 SCANS)</span>
                    <div className="flex items-end justify-between h-24 gap-2">
                        {[40, 55, 60, 75, avgScore].map((h, i) => (
                            <div key={i} className={`w-full rounded-t-lg transition-all hover:bg-teal-400 ${i === 4 ? 'bg-teal-500' : 'bg-teal-900/50'}`} style={{ height: `${Math.max(10, h)}%` }} />
                        ))}
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500 font-bold mt-2">
                        <span>START</span>
                        <span>NOW</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
