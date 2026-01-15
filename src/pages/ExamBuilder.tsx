import { useState } from 'react';
import { Upload, CheckSquare, Trash2, AlertCircle, Download } from 'lucide-react';
import { cn } from '../components/Layout';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { geminiService } from '../lib/gemini';
import { exportService } from '../lib/exportService';

interface Question {
    id: number;
    text: string;
    options?: string[];
    answer?: string;
    type: 'mcq' | 'essay';
}

export const ExamBuilder = () => {
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [difficulty, setDifficulty] = useState(50);
    const [generatedQuestions, setQuestions] = useState<Question[]>([]);
    const [sourceText, setSourceText] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [fileName, setFileName] = useState<string>('');
    const [questionCount, setQuestionCount] = useState(10);
    const [mcqRatio, setMcqRatio] = useState(0.6);
    const [examTitle, setExamTitle] = useState('');

    const navigate = useNavigate();

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError('');
        setLoading(true);

        try {
            // Check if it's a PDF
            if (file.type === 'application/pdf') {
                const arrayBuffer = await file.arrayBuffer();
                const text = await geminiService.extractTextFromPDF(arrayBuffer);
                setSourceText(text);
                setFileName(file.name);
            } else if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
                // Handle plain text files
                const text = await file.text();
                setSourceText(text);
                setFileName(file.name);
            } else {
                setError('Please upload a PDF or text file.');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process file');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!sourceText.trim()) {
            setError('Please upload a source material first.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Truncate source text if too long to avoid token limits
            const truncatedText = sourceText.substring(0, 8000);
            const questions = await geminiService.generateQuestions(
                truncatedText,
                questionCount,
                mcqRatio,
                difficulty
            );

            if (questions.length === 0) {
                setError('Failed to generate questions. Please try again.');
            } else {
                setQuestions(questions as Question[]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate questions');
        } finally {
            setLoading(false);
        }
    };

    const handleExportExam = async () => {
        if (generatedQuestions.length === 0) return;
        setExporting(true);
        try {
            await exportService.exportExamAsPDF(
                examTitle || `Exam-${new Date().toLocaleDateString('en-NG')}`,
                generatedQuestions
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to export exam');
        } finally {
            setExporting(false);
        }
    };

    const handleSaveExam = async () => {
        if (!auth.currentUser) {
            alert("Please sign in to save exams.");
            return;
        }
        if (generatedQuestions.length === 0) return;

        try {
            await addDoc(collection(db, "exams"), {
                userId: auth.currentUser.uid,
                title: examTitle || "Generated Exam",
                questions: generatedQuestions,
                difficulty,
                createdAt: serverTimestamp()
            });
            alert("Exam Saved Successfully!");
            navigate('/dashboard');
        } catch (e) {
            console.error("Error saving exam: ", e);
            alert("Failed to save exam.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span className="text-teal-500 text-xl font-bold">‹</span>
                    AI Exam Builder
                </h1>
            </header>

            {/* Error Alert */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="text-red-400 font-bold">Error</h3>
                        <p className="text-red-300 text-sm">{error}</p>
                    </div>
                </div>
            )}

            {/* Source Material Upload */}
            <section>
                <div className="text-teal-500 text-xs font-bold uppercase tracking-wider mb-2">SOURCE MATERIAL</div>
                <div className="border border-dashed border-teal-500/30 bg-teal-500/5 rounded-2xl p-10 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-teal-500/10 transition-colors">
                    <div className="w-16 h-16 bg-teal-900/50 rounded-full flex items-center justify-center mb-4 text-teal-400 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8" />
                    </div>
                    <h3 className="text-white font-bold text-lg mb-1">Upload PDF or Text Source</h3>
                    <p className="text-gray-500 text-sm">WAEC / NECO / LESSON NOTES (MAX 20MB)</p>
                    {fileName && (
                        <p className="text-teal-400 text-sm mt-3">✓ Loaded: {fileName}</p>
                    )}
                    <label className="mt-6 bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-8 rounded-xl transition-all cursor-pointer">
                        {loading ? 'Processing...' : 'Select File'}
                        <input
                            type="file"
                            accept=".pdf,.txt,.text"
                            onChange={handleFileUpload}
                            disabled={loading}
                            className="hidden"
                        />
                    </label>
                </div>
            </section>

            {/* Configuration */}
            <section>
                <div className="text-teal-500 text-xs font-bold uppercase tracking-wider mb-4">EXAM CONFIGURATION</div>

                {/* Question Count */}
                <div className="bg-dark-card border border-white/5 p-4 rounded-xl mb-4">
                    <label className="text-white font-bold block mb-2">Number of Questions: {questionCount}</label>
                    <input
                        type="range"
                        min="5"
                        max="30"
                        value={questionCount}
                        onChange={(e) => setQuestionCount(Number(e.target.value))}
                        className="w-full accent-teal-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>5</span>
                        <span>30</span>
                    </div>
                </div>

                {/* MCQ Ratio */}
                <div className="bg-dark-card border border-white/5 p-4 rounded-xl mb-4">
                    <label className="text-white font-bold block mb-2">MCQ vs Essay Mix</label>
                    <div className="flex gap-4 text-sm">
                        <div className="flex-1">
                            <div className="text-teal-400 font-bold">{Math.round(mcqRatio * questionCount)} MCQ</div>
                            <div className="text-gray-500 text-xs">{Math.round(mcqRatio * 100)}%</div>
                        </div>
                        <div className="flex-1">
                            <div className="text-yellow-400 font-bold">{Math.round((1 - mcqRatio) * questionCount)} Essay</div>
                            <div className="text-gray-500 text-xs">{Math.round((1 - mcqRatio) * 100)}%</div>
                        </div>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={mcqRatio}
                        onChange={(e) => setMcqRatio(Number(e.target.value))}
                        className="w-full accent-teal-500 mt-3"
                    />
                </div>

                {/* Difficulty Slider */}
                <div className="bg-dark-card border border-white/5 p-4 rounded-xl">
                    <label className="text-white font-bold block mb-2">Question Difficulty</label>
                    <div className="flex justify-between text-xs font-bold text-green-500 mb-2">
                        <span>EASY</span>
                        <span className="text-teal-500">INTERMEDIATE</span>
                        <span className="text-red-500">WAEC STANDARD</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={difficulty}
                        onChange={(e) => setDifficulty(Number(e.target.value))}
                        className="w-full accent-teal-500"
                    />
                </div>
            </section>

            {/* Live Preview */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-teal-500 text-xs font-bold uppercase tracking-wider">LIVE PREVIEW</span>
                        {loading && <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>}
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={loading || !sourceText.trim()}
                        className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded text-xs text-white font-bold uppercase transition-colors"
                    >
                        {loading ? "Generating..." : `Generate ${questionCount} Questions`}
                    </button>
                </div>

                <div className="space-y-4">
                    {generatedQuestions.length === 0 && !loading && (
                        <div className="text-center py-10 text-gray-500">
                            {sourceText.trim() ? 'Click "Generate" button to create questions' : 'Upload source material to start'}
                        </div>
                    )}

                    {generatedQuestions.map((q, idx) => (
                        <div key={q.id} className="bg-dark-card border border-white/5 rounded-xl p-5 hover:border-teal-500/20 transition-colors relative group">
                            <div className="flex justify-between items-start mb-3">
                                <span className="bg-teal-900/30 text-teal-400 text-[10px] font-bold px-2 py-1 rounded uppercase">
                                    {q.type === 'mcq' ? 'MCQ • 2 Marks' : 'Essay • 10 Marks'}
                                </span>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => {
                                            const updated = generatedQuestions.filter((_, i) => i !== idx);
                                            setQuestions(updated);
                                        }}
                                        className="text-gray-400 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <p className="text-white font-medium text-lg leading-relaxed mb-4">{q.text}</p>

                            {q.type === 'mcq' && q.options && (
                                <div className="space-y-2">
                                    {q.options.map((opt, i) => (
                                        <div key={i} className={cn(
                                            "p-3 rounded-lg border text-sm font-medium",
                                            q.answer === opt.substring(0, 1)
                                                ? "bg-teal-500/10 border-teal-500/50 text-teal-100"
                                                : "bg-transparent border-white/5 text-gray-400"
                                        )}>
                                            {opt}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </div>
            </section>

            {/* Exam Title Input */}
            {generatedQuestions.length > 0 && (
                <section className="bg-dark-card border border-white/5 p-4 rounded-2xl">
                    <label className="text-gray-400 text-xs font-bold block mb-2">Exam Title (Optional)</label>
                    <input
                        type="text"
                        placeholder="e.g., SS3 Biology Mid-Term Exam"
                        value={examTitle}
                        onChange={(e) => setExamTitle(e.target.value)}
                        className="w-full bg-dark-bg border border-white/10 rounded-xl p-3 text-white placeholder-gray-600 focus:border-teal-500/50 outline-none"
                    />
                </section>
            )}

            {/* Footer Actions */}
            {generatedQuestions.length > 0 && (
                <div className="flex gap-4 pt-4 border-t border-white/5">
                    <button
                        onClick={handleExportExam}
                        disabled={exporting}
                        className="flex-1 bg-dark-card border border-white/10 hover:bg-white/5 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors py-3 disabled:opacity-50"
                    >
                        <Download className={cn("w-5 h-5", exporting && "animate-spin")} />
                        <span>{exporting ? 'Exporting...' : 'Export PDF'}</span>
                    </button>
                    <button
                        onClick={handleSaveExam}
                        className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors py-3"
                    >
                        <CheckSquare className="w-5 h-5" />
                        <span>FINALIZE EXAM ({generatedQuestions.length} questions)</span>
                    </button>
                </div>
            )}
        </div>
    );
};
