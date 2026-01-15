import { useState, useEffect } from 'react';
import {
    Calculator,
    BookOpen,
    ChevronRight,
    Save,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    serverTimestamp,
    doc,
    setDoc
} from 'firebase/firestore';

export const GradeEntry = () => {
    const { schoolId, user } = useAuth();
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [scores, setScores] = useState<Record<string, { ca: string; exam: string }>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!schoolId) return;

        const fetchMetadata = async () => {
            setLoading(true);
            try {
                // Fetch classes
                const classQ = query(collection(db, 'classes'), where('schoolId', '==', schoolId));
                const classSnap = await getDocs(classQ);
                setClasses(classSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                // Fetch subjects
                const subjectQ = query(collection(db, 'subjects'), where('schoolId', '==', schoolId));
                const subjectSnap = await getDocs(subjectQ);
                setSubjects(subjectSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (err) {
                console.error("Error fetching metadata:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMetadata();
    }, [schoolId]);

    useEffect(() => {
        if (!selectedClass || !selectedSubject) return;

        const fetchStudents = async () => {
            setLoading(true);
            try {
                const q = query(
                    collection(db, 'users'),
                    where('schoolId', '==', schoolId),
                    where('role', '==', 'student')
                );
                const snap = await getDocs(q);
                const studentsList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setStudents(studentsList);

                // Initialize scores
                const initial: Record<string, { ca: string; exam: string }> = {};
                studentsList.forEach(s => initial[s.id] = { ca: '', exam: '' });
                setScores(initial);

                // Fetch existing scores if any for this term/session (simplified)
                const scoreQ = query(
                    collection(db, 'results'),
                    where('schoolId', '==', schoolId),
                    where('classId', '==', selectedClass),
                    where('subjectId', '==', selectedSubject)
                );
                const scoreSnap = await getDocs(scoreQ);
                const existingScores: Record<string, { ca: string; exam: string }> = { ...initial };
                scoreSnap.docs.forEach(doc => {
                    const data = doc.data();
                    existingScores[data.studentId] = {
                        ca: data.caScore?.toString() || '',
                        exam: data.examScore?.toString() || ''
                    };
                });
                setScores(existingScores);

            } catch (err) {
                console.error("Error fetching students/scores:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [selectedClass, selectedSubject, schoolId]);

    const handleScoreChange = (studentId: string, field: 'ca' | 'exam', value: string) => {
        setScores(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [field]: value
            }
        }));
    };

    const handleSave = async () => {
        if (!selectedClass || !selectedSubject || !user) return;
        setSaving(true);
        setSuccess(false);
        try {
            const batch = Object.entries(scores).map(([studentId, data]) => {
                const resultId = `${selectedClass}_${selectedSubject}_${studentId}`;
                return setDoc(doc(db, 'results', resultId), {
                    schoolId,
                    studentId,
                    classId: selectedClass,
                    subjectId: selectedSubject,
                    teacherId: user.uid,
                    caScore: parseFloat(data.ca) || 0,
                    examScore: parseFloat(data.exam) || 0,
                    totalScore: (parseFloat(data.ca) || 0) + (parseFloat(data.exam) || 0),
                    term: '1st Term', // Should be dynamic
                    session: '2025/2026', // Should be dynamic
                    updatedAt: serverTimestamp()
                }, { merge: true });
            });
            await Promise.all(batch);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error("Error saving grades:", err);
            alert("Failed to save grades");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-white mb-2">Grade Entry</h1>
                <p className="text-gray-400">Record assessment and examination scores for your students.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Selection Sidebar */}
                <div className="space-y-6">
                    <section className="space-y-4">
                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest px-2">Select Class</h2>
                        <div className="space-y-2">
                            {classes.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => setSelectedClass(c.id)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${selectedClass === c.id
                                        ? 'bg-teal-500/10 border-teal-500/50 text-teal-400'
                                        : 'bg-dark-card border-white/5 text-gray-400 hover:bg-white/5'
                                        }`}
                                >
                                    <span className="font-bold">{c.name}</span>
                                    <ChevronRight className={`w-4 h-4 transition-transform ${selectedClass === c.id ? 'rotate-90' : ''}`} />
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest px-2">Select Subject</h2>
                        <div className="space-y-2">
                            {subjects.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => setSelectedSubject(s.id)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${selectedSubject === s.id
                                        ? 'bg-blue-500/10 border-blue-500/50 text-blue-400'
                                        : 'bg-dark-card border-white/5 text-gray-400 hover:bg-white/5'
                                        }`}
                                >
                                    <span className="font-bold">{s.name}</span>
                                    <ChevronRight className={`w-4 h-4 transition-transform ${selectedSubject === s.id ? 'rotate-90' : ''}`} />
                                </button>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="lg:col-span-3">
                    {loading ? (
                        <div className="h-full min-h-[500px] border border-white/5 rounded-[32px] flex flex-col items-center justify-center p-8">
                            <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading records...</p>
                        </div>
                    ) : (!selectedClass || !selectedSubject) ? (
                        <div className="h-full min-h-[500px] border-2 border-dashed border-white/5 rounded-[32px] flex flex-col items-center justify-center text-gray-600 p-8">
                            <Calculator className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-lg font-medium text-center">Select both a class and a subject to begin recording scores</p>
                        </div>
                    ) : (
                        <div className="bg-dark-card border border-white/5 rounded-[32px] overflow-hidden flex flex-col h-full">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-gray-500 text-xs font-bold uppercase tracking-widest">Recording Scores for</div>
                                        <div className="text-white font-bold">
                                            {classes.find(c => c.id === selectedClass)?.name} • {subjects.find(s => s.id === selectedSubject)?.name}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="hidden md:flex items-center gap-2 text-gray-500 text-sm">
                                        <AlertCircle className="w-4 h-4" />
                                        <span>Max CA: 40 | Max Exam: 60</span>
                                    </div>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving || !students.length}
                                        className="flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-400 text-dark-bg font-bold rounded-xl transition-all disabled:opacity-50"
                                    >
                                        {saving ? <div className="w-5 h-5 border-2 border-dark-bg border-t-transparent rounded-full animate-spin" />
                                            : success ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                                        <span>{success ? 'Saved!' : 'Save Scores'}</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="space-y-4">
                                    {/* Table Header */}
                                    <div className="grid grid-cols-12 gap-4 px-4 pb-2 text-gray-500 text-xs font-bold uppercase tracking-widest">
                                        <div className="col-span-6">Student Name</div>
                                        <div className="col-span-2 text-center">CA (40)</div>
                                        <div className="col-span-2 text-center">Exam (60)</div>
                                        <div className="col-span-2 text-center">Total</div>
                                    </div>

                                    {/* Student Rows */}
                                    {students.map(s => {
                                        const ca = parseFloat(scores[s.id]?.ca) || 0;
                                        const exam = parseFloat(scores[s.id]?.exam) || 0;
                                        const total = ca + exam;

                                        return (
                                            <div key={s.id} className="grid grid-cols-12 gap-4 items-center p-4 bg-dark-bg rounded-2xl border border-white/5 group hover:border-teal-500/30 transition-all">
                                                <div className="col-span-6 flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 font-bold group-hover:text-teal-400 transition-colors">
                                                        {s.fullName?.charAt(0) || 'S'}
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-bold">{s.fullName}</div>
                                                        <div className="text-gray-500 text-xs font-mono">{s.admissionNumber}</div>
                                                    </div>
                                                </div>

                                                <div className="col-span-2">
                                                    <input
                                                        type="number"
                                                        value={scores[s.id]?.ca}
                                                        onChange={(e) => handleScoreChange(s.id, 'ca', e.target.value)}
                                                        placeholder="0"
                                                        max="40"
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-center text-white font-bold focus:outline-none focus:border-teal-500/50 transition-colors"
                                                    />
                                                </div>

                                                <div className="col-span-2">
                                                    <input
                                                        type="number"
                                                        value={scores[s.id]?.exam}
                                                        onChange={(e) => handleScoreChange(s.id, 'exam', e.target.value)}
                                                        placeholder="0"
                                                        max="60"
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-center text-white font-bold focus:outline-none focus:border-teal-500/50 transition-colors"
                                                    />
                                                </div>

                                                <div className="col-span-2">
                                                    <div className={`w-full py-3 text-center rounded-xl font-black ${total >= 50 ? 'text-emerald-400 bg-emerald-500/5' : 'text-orange-400 bg-orange-500/5'
                                                        }`}>
                                                        {total}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {students.length === 0 && (
                                        <div className="text-center py-20 text-gray-600 font-medium">
                                            No students found. Load students in the Admin Dashboard first.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
