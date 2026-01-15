import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Download, AlertCircle, Archive, Clock } from 'lucide-react';
import { geminiService } from '../lib/gemini';
import { exportService } from '../lib/exportService';
import { cn } from '../components/Layout';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export const LessonGenerator = () => {
    const [topic, setTopic] = useState('');
    const [subject, setSubject] = useState('Basic Science');
    const [level, setLevel] = useState('Primary 1');
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // AI Polish States
    const [personalization, setPersonalization] = useState('standard');
    const [includeTranslation, setIncludeTranslation] = useState(false);
    const [waecFocus, setWaecFocus] = useState(false);
    const [labExperiments, setLabExperiments] = useState(true);

    // Archive States
    const [view, setView] = useState<'generate' | 'archive'>('generate');
    const [archives, setArchives] = useState<any[]>([]);
    const [fetchingArchives, setFetchingArchives] = useState(false);

    const handleGenerate = async () => {
        if (!topic) return;
        setLoading(true);
        setError(null);
        try {
            const note = await geminiService.generateLessonNote(topic, subject, level, {
                personalization,
                translation: includeTranslation,
                waecFocus
            });
            setResult(note);

            if (auth.currentUser) {
                await addDoc(collection(db, "notes"), {
                    userId: auth.currentUser.uid,
                    topic,
                    subject,
                    level,
                    content: note,
                    options: { personalization, translation: includeTranslation, waecFocus },
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

    const fetchArchives = async () => {
        if (!auth.currentUser) return;
        setFetchingArchives(true);
        try {
            const q = query(
                collection(db, "notes"),
                where("userId", "==", auth.currentUser.uid),
                orderBy("createdAt", "desc")
            );
            const snap = await getDocs(q);
            setArchives(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (e) {
            console.error(e);
        } finally {
            setFetchingArchives(false);
        }
    };

    const handleRecycle = (note: any) => {
        setTopic(note.topic);
        setSubject(note.subject);
        setLevel(note.level);
        setResult(note.content);
        setView('generate');
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
                    <h1 className="text-2xl font-bold text-white">Lesson Planner</h1>
                </div>
                <div className="flex bg-dark-card border border-white/5 rounded-xl p-1">
                    <button
                        onClick={() => setView('generate')}
                        className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", view === 'generate' ? "bg-teal-500 text-dark-bg" : "text-gray-500 hover:text-white")}
                    >
                        Generate
                    </button>
                    <button
                        onClick={() => { setView('archive'); fetchArchives(); }}
                        className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", view === 'archive' ? "bg-teal-500 text-dark-bg" : "text-gray-500 hover:text-white")}
                    >
                        Archives
                    </button>
                </div>
            </header>

            {/* Error Alert */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-red-300 text-sm">{error}</p>
                </div>
            )}

            {view === 'generate' ? (
                <>
                    {/* Controls */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-dark-card border border-white/5 rounded-xl p-3">
                            <label className="text-gray-500 text-xs font-bold block mb-1">Class Level</label>
                            <select
                                className="w-full bg-transparent text-white outline-none font-medium"
                                value={level} onChange={e => setLevel(e.target.value)}
                            >
                                <option>Creche</option>
                                <option>Nursery 1</option> <option>Nursery 2</option>
                                <option>Primary 1</option> <option>Primary 2</option> <option>Primary 3</option>
                                <option>Primary 4</option> <option>Primary 5</option> <option>Primary 6</option>
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

                    {/* AI Enhancement Controls */}
                    <div className="space-y-4">
                        <div className="bg-dark-card border border-white/5 p-4 rounded-xl flex items-center justify-between">
                            <div>
                                <span className="font-bold text-white text-sm block">Personalization Level</span>
                                <p className="text-xs text-gray-500">Tailor note depth to student needs</p>
                            </div>
                            <select
                                className="bg-dark-bg border border-white/10 text-white rounded-lg px-3 py-1 text-sm outline-none focus:border-teal-500/50"
                                value={personalization}
                                onChange={(e) => setPersonalization(e.target.value)}
                            >
                                <option value="standard">Standard (NERDC)</option>
                                <option value="advanced">Advanced (Extension)</option>
                                <option value="support">Support Needed</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <button
                                onClick={() => setLabExperiments(!labExperiments)}
                                className={cn(
                                    "p-4 rounded-xl border flex flex-col gap-1 transition-all",
                                    labExperiments ? "bg-teal-500/10 border-teal-500/30 text-teal-400" : "bg-dark-card border-white/5 text-gray-500"
                                )}
                            >
                                <span className="text-xs font-bold uppercase tracking-widest">Lab Experiments</span>
                                <span className="text-[10px] opacity-70">Include practicals</span>
                            </button>

                            <button
                                onClick={() => setIncludeTranslation(!includeTranslation)}
                                className={cn(
                                    "p-4 rounded-xl border flex flex-col gap-1 transition-all",
                                    includeTranslation ? "bg-teal-500/10 border-teal-500/30 text-teal-400" : "bg-dark-card border-white/5 text-gray-500"
                                )}
                            >
                                <span className="text-xs font-bold uppercase tracking-widest">Local Context</span>
                                <span className="text-[10px] opacity-70">Translate to Yoruba/Hausa/Igbo</span>
                            </button>

                            <button
                                onClick={() => setWaecFocus(!waecFocus)}
                                className={cn(
                                    "p-4 rounded-xl border flex flex-col gap-1 transition-all",
                                    waecFocus ? "bg-teal-500/10 border-teal-500/30 text-teal-400" : "bg-dark-card border-white/5 text-gray-500"
                                )}
                            >
                                <span className="text-xs font-bold uppercase tracking-widest">WAEC/NECO Focus</span>
                                <span className="text-[10px] opacity-70">Exam priority topics</span>
                            </button>
                        </div>
                    </div>

                    {/* Result Preview */}
                    {result && (
                        <div className="border border-white/10 rounded-2xl bg-dark-card overflow-hidden">
                            <div className="bg-white/5 p-3 flex justify-between items-center border-b border-white/5">
                                <span className="text-teal-400 text-sm font-bold">DRAFT 01</span>
                                <button
                                    onClick={handleExportPDF}
                                    disabled={exporting}
                                    className="text-teal-400 hover:text-teal-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm bg-teal-500/10 px-3 py-1 rounded-lg transition-colors"
                                >
                                    <Download className={cn("w-4 h-4", exporting && "animate-spin")} />
                                    {exporting ? 'Exporting...' : 'Export PDF'}
                                </button>
                            </div>
                            <div className="p-6 prose prose-invert prose-teal max-w-none text-gray-300">
                                <ReactMarkdown>{result}</ReactMarkdown>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="space-y-4">
                    {fetchingArchives ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {archives.map(note => (
                                <div key={note.id} className="bg-dark-card border border-white/5 p-4 rounded-2xl flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-teal-400 transition-colors">
                                            <Archive className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold">{note.topic}</h3>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span>{note.subject}</span>
                                                <span className="w-1 h-1 rounded-full bg-gray-700" />
                                                <span>{note.level}</span>
                                                <span className="w-1 h-1 rounded-full bg-gray-700" />
                                                <Clock className="w-3 h-3" />
                                                <span>{note.createdAt?.toDate().toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRecycle(note)}
                                        className="px-4 py-2 bg-white/5 hover:bg-teal-500/10 text-gray-400 hover:text-teal-400 text-sm font-bold rounded-lg transition-all"
                                    >
                                        Recycle Note
                                    </button>
                                </div>
                            ))}
                            {archives.length === 0 && (
                                <div className="text-center py-20 bg-dark-card border border-white/5 border-dashed rounded-[32px]">
                                    <Archive className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                                    <p className="text-gray-500">No archived notes found.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
