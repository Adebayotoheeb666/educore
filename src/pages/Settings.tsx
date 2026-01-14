
import { useState } from 'react';
import { ToggleLeft, ToggleRight, Wifi } from 'lucide-react';

const Toggle = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <button onClick={onChange} className={`transition-colors text-3xl ${checked ? 'text-teal-500' : 'text-gray-600'}`}>
        {checked ? <ToggleRight className="w-12 h-12 fill-current" /> : <ToggleLeft className="w-12 h-12" />}
    </button>
);

export const Settings = () => {
    const [dataSaver, setDataSaver] = useState(false);
    const [geminiNano, setGeminiNano] = useState(false);
    const [autoSync, setAutoSync] = useState(true);

    const [classes, setClasses] = useState(['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3']);
    const [newClass, setNewClass] = useState('');
    const [subjects, setSubjects] = useState(['Mathematics', 'English', 'Basic Science', 'Physics', 'Chemistry']);
    const [newSubject, setNewSubject] = useState('');

    const handleAddClass = () => {
        if (newClass.trim()) {
            setClasses([...classes, newClass.trim()]);
            setNewClass('');
        }
    };

    const handleRemoveClass = (c: string) => {
        setClasses(classes.filter(item => item !== c));
    };

    const handleAddSubject = () => {
        if (newSubject.trim()) {
            setSubjects([...subjects, newSubject.trim()]);
            setNewSubject('');
        }
    };

    const handleRemoveSubject = (s: string) => {
        setSubjects(subjects.filter(item => item !== s));
    };

    return (
        <div className="max-w-xl mx-auto space-y-8">
            <header className="flex items-center gap-4 mb-8">
                <button className="text-white text-2xl">‹</button>
                <h1 className="text-xl font-bold text-white">Connectivity & Storage</h1>
            </header>

            {/* Network Viz (Static placeholder for the cool graph) */}
            <div className="bg-gradient-to-br from-orange-400/20 to-dark-card rounded-3xl p-6 h-48 relative overflow-hidden border border-white/5">
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                    {/* Simplified network text rep */}
                    <Wifi className="w-24 h-24 text-white" />
                </div>
                <div className="absolute bottom-6 left-6">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_10px_teal]"></div>
                        <span className="text-white text-xs font-bold uppercase tracking-widest">SYSTEM OPTIMIZED</span>
                    </div>
                    <h2 className="text-white font-bold text-lg">Sync Status</h2>
                    <p className="text-gray-400 text-sm">Last synced: 2 minutes ago</p>
                </div>

                <button className="absolute bottom-6 right-6 bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 py-2 rounded-xl text-sm transition-colors shadow-lg shadow-teal-900/50">
                    SYNC NOW
                </button>
            </div>

            <section>
                <div className="text-teal-500 text-xs font-bold uppercase tracking-wider mb-4">NETWORK & AI CONTROLS</div>
                <div className="space-y-4">
                    <div className="bg-dark-card border border-white/5 p-4 rounded-2xl flex justify-between items-center">
                        <div>
                            <div className="text-white font-bold mb-1">Data Saver Mode</div>
                            <p className="text-gray-500 text-xs w-48">Disables images and heavy media to reduce bandwidth costs.</p>
                        </div>
                        <Toggle checked={dataSaver} onChange={() => setDataSaver(!dataSaver)} />
                    </div>

                    <div className="bg-dark-card border border-white/5 p-4 rounded-2xl flex justify-between items-center">
                        <div>
                            <div className="text-white font-bold mb-1 flex items-center gap-2">
                                Gemini Nano (Local AI)
                                <span className="bg-teal-900 text-teal-400 text-[10px] px-1 rounded">PRO</span>
                            </div>
                            <p className="text-gray-500 text-xs w-48">Generate lesson notes without internet using on-device processing.</p>
                        </div>
                        <Toggle checked={geminiNano} onChange={() => setGeminiNano(!geminiNano)} />
                    </div>

                    <div className="bg-dark-card border border-white/5 p-4 rounded-2xl flex justify-between items-center">
                        <div>
                            <div className="text-white font-bold mb-1">Auto-sync on Wi-Fi</div>
                            <p className="text-gray-500 text-xs w-48">Background data upload only when connected to unlimited networks.</p>
                        </div>
                        <Toggle checked={autoSync} onChange={() => setAutoSync(!autoSync)} />
                    </div>
                </div>
            </section>

            <section>
                <div className="text-teal-500 text-xs font-bold uppercase tracking-wider mb-4">STORAGE MANAGEMENT</div>
                <div className="bg-dark-card border border-white/5 p-6 rounded-2xl">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <div className="text-3xl font-bold text-white">1.65 GB</div>
                            <div className="text-gray-500 text-sm">Total space used</div>
                        </div>
                        <button className="border border-teal-500/30 text-teal-400 px-4 py-2 rounded-lg text-sm font-bold hover:bg-teal-500/10 transition-colors">
                            Clear Cache
                        </button>
                    </div>

                    {/* Bar */}
                    <div className="h-4 bg-gray-800 rounded-full overflow-hidden flex mb-4">
                        <div className="w-[30%] bg-teal-500" />
                        <div className="w-[50%] bg-slate-600" />
                    </div>

                    <div className="flex gap-8">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-teal-500" />
                            <div>
                                <div className="text-white text-xs font-bold">Local Content</div>
                                <div className="text-gray-500 text-[10px]">450 MB</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-slate-600" />
                            <div>
                                <div className="text-white text-xs font-bold">Cloud Assets</div>
                                <div className="text-gray-500 text-[10px]">1.2 GB</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Academic Settings - Custom Classes & Subjects */}
            <section className="pb-20">
                <div className="text-teal-500 text-xs font-bold uppercase tracking-wider mb-4">ACADEMIC SETTINGS</div>
                <div className="space-y-6">
                    {/* Classes */}
                    <div className="bg-dark-card border border-white/5 p-6 rounded-2xl">
                        <h3 className="text-white font-bold mb-4">My Classes</h3>
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                placeholder="Add class (e.g. SS 3 Science)"
                                value={newClass}
                                onChange={(e) => setNewClass(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddClass()}
                                className="flex-1 bg-dark-bg border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:border-teal-500/50 outline-none"
                            />
                            <button
                                onClick={handleAddClass}
                                className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 rounded-xl text-sm transition-colors"
                            >
                                Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {classes.map(c => (
                                <span key={c} className="px-3 py-1 bg-white/5 text-gray-300 rounded-lg text-sm font-bold flex items-center gap-2">
                                    {c}
                                    <button onClick={() => handleRemoveClass(c)} className="hover:text-red-400 font-bold transition-colors">×</button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Subjects */}
                    <div className="bg-dark-card border border-white/5 p-6 rounded-2xl">
                        <h3 className="text-white font-bold mb-4">My Subjects</h3>
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                placeholder="Add subject (e.g. Data Processing)"
                                value={newSubject}
                                onChange={(e) => setNewSubject(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                                className="flex-1 bg-dark-bg border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:border-teal-500/50 outline-none"
                            />
                            <button
                                onClick={handleAddSubject}
                                className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 rounded-xl text-sm transition-colors"
                            >
                                Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {subjects.map(s => (
                                <span key={s} className="px-3 py-1 bg-white/5 text-gray-300 rounded-lg text-sm font-bold flex items-center gap-2">
                                    {s}
                                    <button onClick={() => handleRemoveSubject(s)} className="hover:text-red-400 font-bold transition-colors">×</button>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
