import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Download, AlertCircle, Archive, Clock, Sparkles } from 'lucide-react';
import { geminiService } from '../lib/gemini';
import { exportService } from '../lib/exportService';
import { cn } from '../lib/cn';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface ClassData {
    id: string;
    name: string;
}

interface SubjectData {
    id: string;
    name: string;
}

interface LessonNote {
    id: string;
    topic: string;
    subject: string;
    level: string;
    content: string;
    personalization: string;
    translation: boolean;
    waecFocus: boolean;
    created_at: string;
}

export const LessonGenerator = () => {
    const { user, schoolId, profile } = useAuth();
    const [topic, setTopic] = useState('');
    const [subject, setSubject] = useState('');
    const [level, setLevel] = useState('');
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [subjects, setSubjects] = useState<SubjectData[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingMetadata, setFetchingMetadata] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!schoolId) return;

        const fetchMetadata = async () => {
            setFetchingMetadata(true);
            try {
                // Fetch Classes
                let classesQuery = supabase.from('classes').select('id, name').eq('school_id', schoolId);

                // If staff, filter by assignments (optional optimization, but let's stick to school-wide for now to be safe, or check profile)
                if (profile?.role === 'staff') {
                    // For now, consistent with GradeEntry, we'll fetch all but UI could filter
                }

                const { data: classData, error: classError } = await classesQuery;
                if (classError) throw classError;
                setClasses(classData || []);
                if (classData && classData.length > 0) setLevel(classData[0].name);

                // Fetch Subjects
                const { data: subjectData, error: subjectError } = await supabase
                    .from('subjects')
                    .select('id, name')
                    .eq('school_id', schoolId);
                if (subjectError) throw subjectError;
                setSubjects(subjectData || []);
                if (subjectData && subjectData.length > 0) setSubject(subjectData[0].name);

            } catch (err) {
                console.error("Error fetching metadata:", err);
            } finally {
                setFetchingMetadata(false);
            }
        };

        fetchMetadata();
    }, [schoolId]);

    // AI Polish States
    const [personalization, setPersonalization] = useState('standard');
    const [includeTranslation, setIncludeTranslation] = useState(false);
    const [waecFocus, setWaecFocus] = useState(false);
    const [labExperiments, setLabExperiments] = useState(true);

    // Archive States
    const [view, setView] = useState<'generate' | 'archive'>('generate');
    const [archives, setArchives] = useState<LessonNote[]>([]);
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

            if (user && schoolId) {
                // Save to Supabase
                const { error: saveError } = await supabase
                    .from('lessons')
                    .insert({
                        topic,
                        content: note,
                        teacher_id: user.id,
                        school_id: schoolId,
                        class_id: classes.find(c => c.name === level)?.id,
                        subject_id: subjects.find(s => s.name === subject)?.id,
                        personalization,
                        // Assuming these columns exist or we add them to a JSON 'options' column
                        // wrapper for options if schema is simple:
                        // options: { personalization, translation: includeTranslation, waecFocus }
                        translation: includeTranslation,
                        waec_focus: waecFocus
                    });

                if (saveError) {
                    console.error("Error saving lesson to Supabase:", saveError);
                    // Don't block UI on save error, but log it
                }
            }
        } catch (e) {
            console.error(e);
            setError("Failed to generate note. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const fetchArchives = async () => {
        if (!user) return;
        setFetchingArchives(true);
        try {
            const { data, error } = await supabase
                .from('lessons')
                .select('*, subjects(name)')
                .eq('teacher_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const mappedNotes: LessonNote[] = (data || []).map(d => ({
                id: d.id,
                topic: d.topic,
                subject: d.subjects?.name || d.subject_id,
                level: d.level,
                content: d.content,
                personalization: d.personalization || 'standard',
                translation: d.translation || false,
                waecFocus: d.waec_focus || false,
                created_at: d.created_at
            }));

            setArchives(mappedNotes);
        } catch (e) {
            console.error(e);
        } finally {
            setFetchingArchives(false);
        }
    };

    const handleRecycle = (note: LessonNote) => {
        setTopic(note.topic);
        setSubject(note.subject);
        setLevel(note.level);
        setResult(note.content);

        // Restore options
        setPersonalization(note.personalization);
        setIncludeTranslation(note.translation);
        setWaecFocus(note.waecFocus);

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
        <div className="space-y-6 bg-dark-bg p-8 min-h-screen text-gray-100">
            <header className="flex items-center justify-between">
                <div>
                    <div className="text-teal-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                        NERDC Online
                    </div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-teal-400" />
                        Lesson Planner
                    </h1>
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
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-dark-card border border-white/5 rounded-xl p-3">
                            <label className="text-gray-500 text-xs font-bold block mb-1">Class Level</label>
                            <select
                                className="w-full bg-transparent text-white outline-none font-medium [&>option]:text-black"
                                value={level} onChange={e => setLevel(e.target.value)}
                                disabled={fetchingMetadata}
                            >
                                {fetchingMetadata ? (
                                    <option>Loading classes...</option>
                                ) : (
                                    classes.map(c => (
                                        <option key={c.id} value={c.name}>{c.name}</option>
                                    ))
                                )}
                            </select>
                        </div>
                        <div className="bg-dark-card border border-white/5 rounded-xl p-3">
                            <label className="text-gray-500 text-xs font-bold block mb-1">Subject</label>
                            <select
                                className="w-full bg-transparent text-white outline-none font-medium [&>option]:text-black"
                                value={subject} onChange={e => setSubject(e.target.value)}
                                disabled={fetchingMetadata}
                            >
                                {fetchingMetadata ? (
                                    <option>Loading subjects...</option>
                                ) : (
                                    subjects.map(s => (
                                        <option key={s.id} value={s.name}>{s.name}</option>
                                    ))
                                )}
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
                                className="bg-dark-bg border border-white/10 text-white rounded-lg px-3 py-1 text-sm outline-none focus:border-teal-500/50 [&>option]:text-black"
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
                                                <span>{new Date(note.created_at).toLocaleDateString()}</span>
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
