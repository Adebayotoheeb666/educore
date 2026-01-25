import { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import {
    getOnlineStatus,
    onOnline,
    onOffline,
    getQueuedActionsCount,
    syncQueuedActions,
} from '../../lib/offlineService';

export const OfflineIndicator = () => {
    const [isOnline, setIsOnline] = useState(getOnlineStatus());
    const [queuedCount, setQueuedCount] = useState(0);
    const [syncing, setSyncing] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

    useEffect(() => {
        // Update queued count
        const updateCount = async () => {
            const count = await getQueuedActionsCount();
            setQueuedCount(count);
        };

        updateCount();
        const countInterval = setInterval(updateCount, 5000);

        // Subscribe to online/offline events
        const unsubOnline = onOnline(() => {
            setIsOnline(true);
            showNotification('Back online! Syncing pending actions...', 'success');
            handleSync();
        });

        const unsubOffline = onOffline(() => {
            setIsOnline(false);
            showNotification('You are offline. Actions will be queued.', 'info');
        });

        return () => {
            clearInterval(countInterval);
            unsubOnline();
            unsubOffline();
        };
    }, []);

    const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
    };

    const handleSync = async () => {
        if (!isOnline || syncing) return;

        setSyncing(true);
        try {
            const result = await syncQueuedActions();

            if (result.total === 0) {
                showNotification('No pending actions to sync', 'info');
            } else if (result.failed === 0) {
                showNotification(`Successfully synced ${result.success} action(s)`, 'success');
            } else {
                showNotification(
                    `Synced ${result.success} action(s), ${result.failed} failed`,
                    'error'
                );
            }

            // Update count
            const count = await getQueuedActionsCount();
            setQueuedCount(count);
        } catch (error) {
            console.error('Sync error:', error);
            showNotification('Failed to sync actions', 'error');
        } finally {
            setSyncing(false);
        }
    };

    return (
        <>
            {/* Toast Notification */}
            {showToast && (
                <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-2 duration-300">
                    <div
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border backdrop-blur-xl ${toastType === 'success'
                                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200'
                                : toastType === 'error'
                                    ? 'bg-red-500/20 border-red-500/30 text-red-200'
                                    : 'bg-blue-500/20 border-blue-500/30 text-blue-200'
                            }`}
                    >
                        {toastType === 'success' ? (
                            <CheckCircle2 className="w-5 h-5" />
                        ) : toastType === 'error' ? (
                            <AlertCircle className="w-5 h-5" />
                        ) : (
                            <WifiOff className="w-5 h-5" />
                        )}
                        <p className="text-sm font-medium">{toastMessage}</p>
                    </div>
                </div>
            )}

            {/* Persistent Offline Indicator */}
            {!isOnline && (
                <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-dark-card border border-orange-500/30 rounded-xl p-4 shadow-2xl backdrop-blur-xl">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                                <WifiOff className="w-5 h-5 text-orange-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-orange-200 mb-1">
                                    You're offline
                                </h4>
                                <p className="text-xs text-gray-400 mb-3">
                                    {queuedCount > 0
                                        ? `${queuedCount} action(s) queued for sync`
                                        : 'Your actions will be saved and synced when you reconnect'}
                                </p>
                                {queuedCount > 0 && (
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-dark-bg rounded-full overflow-hidden">
                                            <div className="h-full bg-orange-500 rounded-full w-full animate-pulse" />
                                        </div>
                                        <span className="text-xs text-orange-300 font-medium">
                                            {queuedCount}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sync Button (when online and has queued actions) */}
            {isOnline && queuedCount > 0 && (
                <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 duration-300">
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="flex items-center gap-2 px-4 py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-500/50 text-white rounded-xl shadow-lg transition-all duration-200 font-medium text-sm"
                    >
                        <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? 'Syncing...' : `Sync ${queuedCount} action(s)`}
                    </button>
                </div>
            )}

            {/* Status Badge in Top Bar */}
            <div className="flex items-center gap-2">
                {isOnline ? (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <Wifi className="w-3 h-3 text-emerald-400" />
                        <span className="text-xs font-medium text-emerald-300">Online</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
                        <WifiOff className="w-3 h-3 text-orange-400" />
                        <span className="text-xs font-medium text-orange-300">Offline</span>
                    </div>
                )}
            </div>
        </>
    );
};
