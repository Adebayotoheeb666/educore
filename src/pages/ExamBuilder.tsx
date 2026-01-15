import { useState } from 'react';
import { Upload, CheckSquare, RefreshCw, Save, Trash2, AlertCircle } from 'lucide-react';
import { cn } from '../components/Layout';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { geminiService } from '../lib/gemini';

interface Question {
    id: number;
    text: string;
    options?: string[];
    answer?: string;
    type: 'mcq' | 'essay';
}

export const ExamBuilder = () => {
    const [loading, setLoading] = useState(false);
    const [difficulty, setDifficulty] = useState(50);
    const [generatedQuestions, setQuestions] = useState<Question[]>([]);
    const [sourceText, setSourceText] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [fileName, setFileName] = useState<string>('');
    const [questionCount, setQuestionCount] = useState(10);
    const [mcqRatio, setMcqRatio] = useState(0.6);

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

    const handleSaveExam = async () => {
        if (!auth.currentUser) {
            alert("Please sign in to save exams.");
            return;
        }
        if (generatedQuestions.length === 0) return;

        try {
            await addDoc(collection(db, "exams"), {
                userId: auth.currentUser.uid,
                title: "Generated Exam", // Ideally customizable
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
                <button className="bg-white/10 p-2 rounded-lg hover:bg-white/20">
                    <div className="w-6 h-4 border-2 border-white rounded-sm relative flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                </button>
            </header>

            {/* Source Material Upload */}
            <section>
                <div className="text-teal-500 text-xs font-bold uppercase tracking-wider mb-2">SOURCE MATERIAL</div>
                <div className="border border-dashed border-teal-500/30 bg-teal-500/5 rounded-2xl p-10 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-teal-500/10 transition-colors">
                    <div className="w-16 h-16 bg-teal-900/50 rounded-full flex items-center justify-center mb-4 text-teal-400 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8" />
                    </div>
                    <h3 className="text-white font-bold text-lg mb-1">Upload PDF Source</h3>
                    <p className="text-gray-500 text-sm">WAEC / NECO / LESSON NOTES (MAX 20MB)</p>
                    <button className="mt-6 bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-8 rounded-xl transition-all">
                        Select File
                    </button>
                </div>
            </section>

            {/* Configuration */}
            <section>
                <div className="text-teal-500 text-xs font-bold uppercase tracking-wider mb-4">EXAM CONFIGURATION</div>
                <div className="space-y-3">
                    {[
                        { label: 'Multiple Choice (MCQ)', checked: true },
                        { label: 'Short Answer', checked: false },
                        { label: 'Essay Questions', checked: true }
                    ].map((opt, i) => (
                        <div key={i} className="bg-dark-card border border-white/5 p-4 rounded-xl flex items-center justify-between cursor-pointer hover:border-teal-500/30 transition-colors">
                            <span className="text-white font-bold">{opt.label}</span>
                            <div className={cn("w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors", opt.checked ? "bg-teal-500 border-teal-500" : "border-gray-600 bg-transparent")}>
                                {opt.checked && <CheckSquare className="w-4 h-4 text-white" />}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Slider */}
                <div className="mt-8 px-2">
                    <div className="flex justify-between text-xs font-bold text-green-500 mb-2">
                        <span>EASY</span>
                        <span className="text-teal-500">INTERMEDIATE</span>
                        <span className="text-red-500">WAEC STANDARD</span>
                    </div>
                    <input
                        type="range"
                        className="w-full text-teal-500 accent-teal-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        value={difficulty}
                        onChange={(e) => setDifficulty(Number(e.target.value))}
                    />
                </div>
            </section>

            {/* Live Preview */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-teal-500 text-xs font-bold uppercase tracking-wider">LIVE PREVIEW</span>
                        <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="bg-dark-card border border-white/10 px-4 py-1 rounded text-xs text-white font-bold uppercase"
                    >
                        {loading ? "Drafting..." : "Drafting 12 Questions..."}
                    </button>
                </div>

                <div className="space-y-4">
                    {generatedQuestions.length === 0 && !loading && (
                        <div className="text-center py-10 text-gray-500">Click to generate preview</div>
                    )}

                    {generatedQuestions.map((q) => (
                        <div key={q.id} className="bg-dark-card border border-white/5 rounded-xl p-5 hover:border-teal-500/20 transition-colors relative group">
                            <div className="flex justify-between items-start mb-3">
                                <span className="bg-teal-900/30 text-teal-400 text-[10px] font-bold px-2 py-1 rounded uppercase">
                                    {q.type === 'mcq' ? 'MCQ • 2 Marks' : 'Essay • 10 Marks'}
                                </span>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <RefreshCw className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white" />
                                    <Trash2 className="w-4 h-4 text-gray-400 cursor-pointer hover:text-red-400" />
                                </div>
                            </div>

                            <p className="text-white font-medium text-lg leading-relaxed mb-4">{q.text}</p>

                            {q.type === 'mcq' && (
                                <div className="space-y-2">
                                    {q.options?.map((opt, i) => (
                                        <div key={i} className={cn(
                                            "p-3 rounded-lg border text-sm font-medium",
                                            opt.includes("(Correct)") // Simulating knowing the answer
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
                </div>

                {/* Add Manual Button */}
                <button className="w-full py-4 border border-dashed border-white/10 rounded-xl flex items-center justify-center gap-2 text-gray-400 hover:text-white hover:border-white/20 transition-colors mt-6">
                    <span className="text-lg font-bold">+</span>
                    <span className="text-sm font-bold uppercase">Add Question Manually</span>
                </button>
            </section>

            {/* Footer Actions */}
            <div className="flex gap-4 pt-4 border-t border-white/5">
                <button className="bg-dark-card p-4 rounded-xl text-gray-400 hover:text-white transition-colors">
                    <Save className="w-6 h-6" />
                    <span className="sr-only">Save</span>
                </button>
                <button
                    onClick={handleSaveExam}
                    className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                    <CheckSquare className="w-5 h-5" />
                    <span>FINALIZE EXAM</span>
                </button>
            </div>
        </div>
    );
};
