import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Download, Settings as SettingsIcon, AlertCircle } from 'lucide-react';
import { geminiService } from '../lib/gemini';
import { exportService } from '../lib/exportService';
import { cn } from '../components/Layout';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export const LessonGenerator = () => {
    const [topic, setTopic] = useState('');
    const [subject, setSubject] = useState('Basic Science');
    const [level, setLevel] = useState('JSS 3');
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!topic) return;
        setLoading(true);
        setError(null);
        try {
            const note = await geminiService.generateLessonNote(topic, subject, level);
            setResult(note);

            if (auth.currentUser) {
                await addDoc(collection(db, "notes"), {
                    userId: auth.currentUser.uid,
                    topic,
                    subject,
                    level,
                    content: note,
                    createdAt: serverTimestamp()
                });
            }
        } catch (e) {
            console.error(e);
            setError("Failed to generate note. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = async () => {
        if (!result) return;
        setExporting(true);
        try {
            await exportService.exportLessonAsPDF(topic, subject, level, result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to export PDF');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <div className="text-teal-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                        NERDC Online
                    </div>
                    <h1 className="text-2xl font-bold text-white">Lesson Generator</h1>
                </div>
            </header>

            {/* Error Alert */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-red-300 text-sm">{error}</p>
                </div>
            )}

            {/* Controls */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-dark-card border border-white/5 rounded-xl p-3">
                    <label className="text-gray-500 text-xs font-bold block mb-1">Class Level</label>
                    <select
                        className="w-full bg-transparent text-white outline-none font-medium"
                        value={level} onChange={e => setLevel(e.target.value)}
                    >
                        <option>JSS 1</option> <option>JSS 2</option> <option>JSS 3</option>
                        <option>SS 1</option> <option>SS 2</option> <option>SS 3</option>
                    </select>
                </div>
                <div className="bg-dark-card border border-white/5 rounded-xl p-3">
                    <label className="text-gray-500 text-xs font-bold block mb-1">Subject</label>
                    <select
                        className="w-full bg-transparent text-white outline-none font-medium"
                        value={subject} onChange={e => setSubject(e.target.value)}
                    >
                        <option>Basic Science</option> <option>Mathematics</option> <option>English</option>
                        <option>Physics</option> <option>Chemistry</option>
                    </select>
                </div>
            </div>

            {/* Search Input */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="Enter Topic (e.g. Solar System)"
                    className="w-full bg-dark-card border border-white/10 rounded-2xl p-4 text-white placeholder-gray-600 focus:border-teal-500/50 outline-none transition-all"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                />
                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="absolute right-2 top-2 bg-teal-600 hover:bg-teal-500 text-white p-2 rounded-xl transition-colors disabled:opacity-50"
                >
                    <Send className={cn("w-5 h-5", loading && "animate-spin")} />
                </button>
            </div>

            {/* Enhance Toggles (Visual Only) */}
            <div className="space-y-3">
                {['Lab Experiments', 'Local Translation', 'WAEC/NECO Focus'].map((label) => (
                    <div key={label} className="bg-dark-card/50 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                        <span className="font-medium text-gray-300">{label}</span>
                        <div className={`w-12 h-6 rounded-full relative transition-colors ${label === 'Lab Experiments' ? 'bg-teal-500' : 'bg-gray-700'}`}>
                            <div className={`absolute w-4 h-4 rounded-full bg-white top-1 transition-all ${label === 'Lab Experiments' ? 'left-7' : 'left-1'}`} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Result Preview */}
            {result && (
                <div className="border border-white/10 rounded-2xl bg-dark-card overflow-hidden">
                    <div className="bg-white/5 p-3 flex justify-between items-center border-b border-white/5">
                        <span className="text-teal-400 text-sm font-bold">DRAFT 01</span>
                        <button className="text-teal-400 hover:text-teal-300 flex items-center gap-1 text-sm bg-teal-500/10 px-3 py-1 rounded-lg">
                            <Download className="w-4 h-4" /> Export
                        </button>
                    </div>
                    <div className="p-6 prose prose-invert prose-teal max-w-none text-gray-300">
                        <ReactMarkdown>{result}</ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
    );
};
