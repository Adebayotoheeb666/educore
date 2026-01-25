import { useState, useEffect } from 'react';
import { ToggleLeft, ToggleRight, Wifi, CheckCircle, AlertCircle, Trash2, RefreshCw, Bell, X } from 'lucide-react';
import { storageService, type StorageStats, type SyncStatus } from '../lib/storageService';
import { getNotifications, markAsRead, markAllAsRead, type Notification } from '../lib/notificationService';
import { useAuth } from '../hooks/useAuth';

const Toggle = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <button onClick={onChange} className={`transition-colors text-3xl ${checked ? 'text-teal-500' : 'text-gray-600'}`}>
        {checked ? <ToggleRight className="w-12 h-12 fill-current" /> : <ToggleLeft className="w-12 h-12" />}
    </button>
);

export const Settings = () => {
    const { user } = useAuth();
    const [dataSaver, setDataSaver] = useState(false);
    const [dataSaverLoading, setDataSaverLoading] = useState(false);
    const [geminiNano, setGeminiNano] = useState(false);
    const [geminiLoading, setGeminiLoading] = useState(false);
    const [autoSync, setAutoSync] = useState(true);
    const [autoSyncLoading, setAutoSyncLoading] = useState(false);
    const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
    const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notificationsLoading, setNotificationsLoading] = useState(false);

    const [classes, setClasses] = useState<string[]>([]);
    const [newClass, setNewClass] = useState('');
    const [subjects, setSubjects] = useState<string[]>([]);
    const [newSubject, setNewSubject] = useState('');

    useEffect(() => {
        loadSettings();
        loadAcademicSettings();
        loadNotifications();
        const interval = setInterval(loadSettings, 5000); // Refresh every 5 seconds
        const notifInterval = setInterval(loadNotifications, 30000); // Refresh notifications every 30 seconds

        window.addEventListener('online', loadSettings);
        window.addEventListener('offline', loadSettings);

        return () => {
            clearInterval(interval);
            clearInterval(notifInterval);
            window.removeEventListener('online', loadSettings);
            window.removeEventListener('offline', loadSettings);
        };
    }, [user]);

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

    const loadAcademicSettings = () => {
        try {
            const savedClasses = localStorage.getItem('academicClasses');
            const savedSubjects = localStorage.getItem('academicSubjects');

            if (savedClasses) {
                setClasses(JSON.parse(savedClasses));
            } else {
                setClasses(['Nursery 1', 'Nursery 2', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6', 'JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3']);
            }

            if (savedSubjects) {
                setSubjects(JSON.parse(savedSubjects));
            } else {
                setSubjects(['Mathematics', 'English', 'Basic Science', 'Physics', 'Chemistry']);
            }
        } catch (err) {
            console.error('Error loading academic settings:', err);
            setClasses(['Nursery 1', 'Nursery 2', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6', 'JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3']);
            setSubjects(['Mathematics', 'English', 'Basic Science', 'Physics', 'Chemistry']);
        }
    };

    const loadNotifications = async () => {
        if (!user?.schoolId || !user?.id) return;

        setNotificationsLoading(true);
        try {
            const notifs = await getNotifications(user.schoolId, user.id, 10);
            setNotifications(notifs);
        } catch (err) {
            console.error('Error loading notifications:', err);
        } finally {
            setNotificationsLoading(false);
        }
    };

    const handleAddClass = () => {
        if (newClass.trim() && !classes.includes(newClass.trim())) {
            const updatedClasses = [...classes, newClass.trim()];
            setClasses(updatedClasses);
            localStorage.setItem('academicClasses', JSON.stringify(updatedClasses));
            setNewClass('');
            setSuccess('Class added successfully');
            setTimeout(() => setSuccess(''), 2000);
        }
    };

    const handleRemoveClass = (c: string) => {
        const updatedClasses = classes.filter(item => item !== c);
        setClasses(updatedClasses);
        localStorage.setItem('academicClasses', JSON.stringify(updatedClasses));
        setSuccess('Class removed successfully');
        setTimeout(() => setSuccess(''), 2000);
    };

    const handleAddSubject = () => {
        if (newSubject.trim() && !subjects.includes(newSubject.trim())) {
            const updatedSubjects = [...subjects, newSubject.trim()];
            setSubjects(updatedSubjects);
            localStorage.setItem('academicSubjects', JSON.stringify(updatedSubjects));
            setNewSubject('');
            setSuccess('Subject added successfully');
            setTimeout(() => setSuccess(''), 2000);
        }
    };

    const handleRemoveSubject = (s: string) => {
        const updatedSubjects = subjects.filter(item => item !== s);
        setSubjects(updatedSubjects);
        localStorage.setItem('academicSubjects', JSON.stringify(updatedSubjects));
        setSuccess('Subject removed successfully');
        setTimeout(() => setSuccess(''), 2000);
    };

    const handleToggleDataSaver = async () => {
        setDataSaverLoading(true);
        try {
            const newValue = !dataSaver;
            setDataSaver(newValue);
            storageService.setDataSaverMode(newValue);
            setSuccess(`Data Saver Mode ${newValue ? 'enabled' : 'disabled'}`);
            setTimeout(() => setSuccess(''), 2000);
        } catch (err) {
            setError('Failed to update Data Saver Mode');
            setDataSaver(dataSaver);
        } finally {
            setDataSaverLoading(false);
        }
    };

    const handleToggleGeminiNano = async () => {
        setGeminiLoading(true);
        try {
            const newValue = !geminiNano;
            setGeminiNano(newValue);
            storageService.setGeminiNanoMode(newValue);
            setSuccess(`Gemini Nano (Local AI) ${newValue ? 'enabled' : 'disabled'}`);
            setTimeout(() => setSuccess(''), 2000);
        } catch (err) {
            setError('Failed to update Gemini Nano setting');
            setGeminiNano(geminiNano);
        } finally {
            setGeminiLoading(false);
        }
    };

    const handleToggleAutoSync = async () => {
        setAutoSyncLoading(true);
        try {
            const newValue = !autoSync;
            setAutoSync(newValue);
            storageService.setAutoSyncOnWifi(newValue);
            setSuccess(`Auto-sync on Wi-Fi ${newValue ? 'enabled' : 'disabled'}`);
            setTimeout(() => setSuccess(''), 2000);
        } catch (err) {
            setError('Failed to update Auto-sync setting');
            setAutoSync(autoSync);
        } finally {
            setAutoSyncLoading(false);
        }
    };

    const handleNotificationRead = async (notificationId: string) => {
        try {
            await markAsRead(notificationId);
            setNotifications(notifications.map(n =>
                n.id === notificationId ? { ...n, read: true } : n
            ));
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const handleMarkAllNotificationsRead = async () => {
        try {
            const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
            if (unreadIds.length > 0) {
                await markAllAsRead(unreadIds);
                setNotifications(notifications.map(n => ({ ...n, read: true })));
                setSuccess('All notifications marked as read');
                setTimeout(() => setSuccess(''), 2000);
            }
        } catch (err) {
            console.error('Error marking notifications as read:', err);
        }
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
        if (!user) {
            setError('Please sign in to sync data.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await storageService.triggerSync();
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
            <header className="flex items-center justify-between gap-4 mb-8">
                <h1 className="text-xl font-bold text-white">Connectivity & Storage</h1>
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 text-white hover:text-teal-400 transition-colors"
                    >
                        <Bell className="w-6 h-6" />
                        {notifications.some(n => !n.read) && (
                            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 top-12 w-80 max-h-96 bg-dark-card border border-white/10 rounded-2xl overflow-hidden shadow-lg z-50">
                            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                <h3 className="text-white font-bold">Notifications</h3>
                                {notifications.some(n => !n.read) && (
                                    <button
                                        onClick={handleMarkAllNotificationsRead}
                                        className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>
                            <div className="overflow-y-auto max-h-80">
                                {notificationsLoading ? (
                                    <div className="p-4 text-gray-400 text-sm text-center">Loading...</div>
                                ) : notifications.length === 0 ? (
                                    <div className="p-4 text-gray-400 text-sm text-center">No notifications</div>
                                ) : (
                                    notifications.map(notif => (
                                        <div
                                            key={notif.id}
                                            className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${
                                                !notif.read ? 'bg-teal-500/5' : ''
                                            }`}
                                            onClick={() => handleNotificationRead(notif.id)}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <div className="text-white font-bold text-sm">{notif.title}</div>
                                                    <div className="text-gray-400 text-xs mt-1">{notif.message}</div>
                                                    {notif.createdAt && (
                                                        <div className="text-gray-500 text-[10px] mt-2">
                                                            {new Date(notif.createdAt).toLocaleString('en-NG')}
                                                        </div>
                                                    )}
                                                </div>
                                                {!notif.read && (
                                                    <div className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0 mt-1.5"></div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
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
            <div className={`rounded-3xl p-8 relative overflow-hidden border ${syncStatus?.isOnline
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
                        <button
                            onClick={handleToggleDataSaver}
                            disabled={dataSaverLoading}
                            className="transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {dataSaverLoading ? (
                                <div className="w-12 h-12 flex items-center justify-center">
                                    <div className="w-4 h-4 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin"></div>
                                </div>
                            ) : (
                                <Toggle checked={dataSaver} onChange={() => {}} />
                            )}
                        </button>
                    </div>

                    <div className="bg-dark-card border border-white/5 p-4 rounded-2xl flex justify-between items-center">
                        <div>
                            <div className="text-white font-bold mb-1 flex items-center gap-2">
                                Gemini Nano (Local AI)
                                <span className="bg-teal-900 text-teal-400 text-[10px] px-1 rounded">PRO</span>
                            </div>
                            <p className="text-gray-500 text-xs w-48">Generate lesson notes without internet using on-device processing.</p>
                        </div>
                        <button
                            onClick={handleToggleGeminiNano}
                            disabled={geminiLoading}
                            className="transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {geminiLoading ? (
                                <div className="w-12 h-12 flex items-center justify-center">
                                    <div className="w-4 h-4 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin"></div>
                                </div>
                            ) : (
                                <Toggle checked={geminiNano} onChange={() => {}} />
                            )}
                        </button>
                    </div>

                    <div className="bg-dark-card border border-white/5 p-4 rounded-2xl flex justify-between items-center">
                        <div>
                            <div className="text-white font-bold mb-1">Auto-sync on Wi-Fi</div>
                            <p className="text-gray-500 text-xs w-48">Background data upload only when connected to unlimited networks.</p>
                        </div>
                        <button
                            onClick={handleToggleAutoSync}
                            disabled={autoSyncLoading}
                            className="transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {autoSyncLoading ? (
                                <div className="w-12 h-12 flex items-center justify-center">
                                    <div className="w-4 h-4 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin"></div>
                                </div>
                            ) : (
                                <Toggle checked={autoSync} onChange={() => {}} />
                            )}
                        </button>
                    </div>
                </div>
            </section>

            <section>
                <div className="text-teal-500 text-xs font-bold uppercase tracking-wider mb-4">STORAGE MANAGEMENT</div>
                <div className="bg-dark-card border border-white/5 p-6 rounded-2xl">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <div className="text-3xl font-bold text-white">
                                {storageStats ? `${(storageStats.usedSpace / (1024 * 1024)).toFixed(2)} MB` : 'Loading...'}
                            </div>
                            <div className="text-gray-500 text-sm">Total space used</div>
                        </div>
                        <button
                            onClick={handleClearCache}
                            disabled={loading}
                            className="border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            {loading ? 'Clearing...' : 'Clear Cache'}
                        </button>
                    </div>

                    {/* Storage Bar */}
                    {storageStats && (
                        <>
                            <div className="h-4 bg-gray-800 rounded-full overflow-hidden flex mb-4">
                                <div
                                    className="bg-teal-500 transition-all"
                                    style={{ width: `${Math.min(50, storageStats.percentUsed)}%` }}
                                />
                                <div
                                    className="bg-slate-600"
                                    style={{ width: `${Math.max(0, 100 - storageStats.percentUsed)}%` }}
                                />
                            </div>

                            <div className="flex gap-8">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-teal-500" />
                                    <div>
                                        <div className="text-white text-xs font-bold">Local Cache</div>
                                        <div className="text-gray-500 text-[10px]">{(storageStats.cacheSpace / (1024 * 1024)).toFixed(2)} MB</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-slate-600" />
                                    <div>
                                        <div className="text-white text-xs font-bold">Firestore Cache</div>
                                        <div className="text-gray-500 text-[10px]">{(storageStats.cloudAssets / (1024 * 1024)).toFixed(2)} MB</div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
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
