import { useState, useEffect } from 'react';
import { ToggleLeft, ToggleRight, Wifi, CheckCircle, AlertCircle, Trash2, RefreshCw } from 'lucide-react';
import { storageService, type StorageStats, type SyncStatus } from '../lib/storageService';
import { auth } from '../lib/firebase';

const Toggle = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <button onClick={onChange} className={`transition-colors text-3xl ${checked ? 'text-teal-500' : 'text-gray-600'}`}>
        {checked ? <ToggleRight className="w-12 h-12 fill-current" /> : <ToggleLeft className="w-12 h-12" />}
    </button>
);

export const Settings = () => {
    const [dataSaver, setDataSaver] = useState(false);
    const [geminiNano, setGeminiNano] = useState(false);
    const [autoSync, setAutoSync] = useState(true);
    const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
    const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [classes, setClasses] = useState(['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3']);
    const [newClass, setNewClass] = useState('');
    const [subjects, setSubjects] = useState(['Mathematics', 'English', 'Basic Science', 'Physics', 'Chemistry']);
    const [newSubject, setNewSubject] = useState('');

    useEffect(() => {
        loadSettings();
        const interval = setInterval(loadSettings, 5000); // Refresh every 5 seconds

        window.addEventListener('online', loadSettings);
        window.addEventListener('offline', loadSettings);

        return () => {
            clearInterval(interval);
            window.removeEventListener('online', loadSettings);
            window.removeEventListener('offline', loadSettings);
        };
    }, []);

    const loadSettings = async () => {
        try {
            const stats = await storageService.getStorageStats();
            const sync = storageService.getSyncStatus();
            setStorageStats(stats);
            setSyncStatus(sync);

            // Load persisted settings
            setDataSaver(storageService.isDataSaverEnabled());
            setGeminiNano(storageService.isGeminiNanoEnabled());
            setAutoSync(storageService.isAutoSyncOnWifiEnabled());
        } catch (err) {
            console.error('Error loading settings:', err);
        }
    };

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

    const handleToggleDataSaver = () => {
        const newValue = !dataSaver;
        setDataSaver(newValue);
        storageService.setDataSaverMode(newValue);
    };

    const handleToggleGeminiNano = () => {
        const newValue = !geminiNano;
        setGeminiNano(newValue);
        storageService.setGeminiNanoMode(newValue);
    };

    const handleToggleAutoSync = () => {
        const newValue = !autoSync;
        setAutoSync(newValue);
        storageService.setAutoSyncOnWifi(newValue);
    };

    const handleClearCache = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await storageService.clearCache();
            setSuccess('Cache cleared successfully! Freeing up space...');
            setTimeout(() => loadSettings(), 1000);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to clear cache');
        } finally {
            setLoading(false);
        }
    };

    const handleManualSync = async () => {
        if (!auth.currentUser) {
            setError('Please sign in to sync data.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await storageService.triggerSync(auth.currentUser.uid);
            setSuccess('Sync completed successfully!');
            setTimeout(() => loadSettings(), 1000);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Sync failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-8">
            <header className="flex items-center gap-4 mb-8">
                <h1 className="text-xl font-bold text-white">Connectivity & Storage</h1>
            </header>

            {/* Success Alert */}
            {success && (
                <div className="bg-teal-500/10 border border-teal-500/30 rounded-2xl p-4 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" />
                    <p className="text-teal-300 text-sm">{success}</p>
                </div>
            )}

            {/* Error Alert */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-red-300 text-sm">{error}</p>
                </div>
            )}

            {/* Sync Status Card */}
            <div className={`rounded-3xl p-8 relative overflow-hidden border ${
                syncStatus?.isOnline
                    ? 'bg-gradient-to-br from-teal-600/20 to-dark-card border-teal-500/30'
                    : 'bg-gradient-to-br from-orange-600/20 to-dark-card border-orange-500/30'
            }`}>
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <Wifi className="w-24 h-24 text-white" />
                </div>
                <div className="absolute top-6 left-6 right-6 relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        {syncStatus?.isOnline ? (
                            <>
                                <div className="w-3 h-3 rounded-full bg-teal-500 shadow-[0_0_10px_rgba(0,150,136,1)]"></div>
                                <span className="text-teal-400 text-xs font-bold uppercase tracking-wider">ONLINE</span>
                            </>
                        ) : (
                            <>
                                <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse"></div>
                                <span className="text-orange-400 text-xs font-bold uppercase tracking-wider">OFFLINE MODE</span>
                            </>
                        )}
                    </div>

                    <h2 className="text-white font-bold text-xl mb-1">Sync Status</h2>
                    <div className="space-y-2 mb-6">
                        {syncStatus?.isSynced ? (
                            <p className="text-teal-300 text-sm flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Everything is synced
                            </p>
                        ) : (
                            <p className="text-orange-300 text-sm">{syncStatus?.pendingItems} items waiting to sync</p>
                        )}
                        {syncStatus?.lastSyncTime && (
                            <p className="text-gray-400 text-xs">
                                Last synced: {new Date(syncStatus.lastSyncTime).toLocaleString('en-NG')}
                            </p>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleManualSync}
                    disabled={loading || syncStatus?.isSynced}
                    className="absolute bottom-6 right-6 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-2 rounded-xl text-sm transition-colors shadow-lg shadow-teal-900/50 flex items-center gap-2 relative z-10"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Syncing...' : 'SYNC NOW'}
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
                        <Toggle checked={dataSaver} onChange={handleToggleDataSaver} />
                    </div>

                    <div className="bg-dark-card border border-white/5 p-4 rounded-2xl flex justify-between items-center">
                        <div>
                            <div className="text-white font-bold mb-1 flex items-center gap-2">
                                Gemini Nano (Local AI)
                                <span className="bg-teal-900 text-teal-400 text-[10px] px-1 rounded">PRO</span>
                            </div>
                            <p className="text-gray-500 text-xs w-48">Generate lesson notes without internet using on-device processing.</p>
                        </div>
                        <Toggle checked={geminiNano} onChange={handleToggleGeminiNano} />
                    </div>

                    <div className="bg-dark-card border border-white/5 p-4 rounded-2xl flex justify-between items-center">
                        <div>
                            <div className="text-white font-bold mb-1">Auto-sync on Wi-Fi</div>
                            <p className="text-gray-500 text-xs w-48">Background data upload only when connected to unlimited networks.</p>
                        </div>
                        <Toggle checked={autoSync} onChange={handleToggleAutoSync} />
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
