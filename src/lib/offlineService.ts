import { supabase } from './supabase';

/**
 * Offline Service
 * Manages offline state detection, action queuing, and background sync
 */

export interface QueuedAction {
    id: string;
    type: 'attendance' | 'grade' | 'results' | 'message' | 'payment' | 'other';
    action: string;
    payload: any;
    timestamp: number;
    retryCount: number;
}

const DB_NAME = 'educore_offline';
const DB_VERSION = 1;
const STORE_NAME = 'queued_actions';
const MAX_RETRIES = 3;

// Online/Offline state
let isOnline = navigator.onLine;
const onlineCallbacks: Array<() => void> = [];
const offlineCallbacks: Array<() => void> = [];

/**
 * Initialize offline service
 */
export const initOfflineService = () => {
    // Listen for online/offline events for fast detection
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initialize IndexedDB
    initDB();

    // Start heartbeat for connectivity check (more reliable than just listeners)
    startHeartbeat();

    console.log('Offline service initialized. Online:', isOnline);
};

/**
 * Perform a connectivity check - relies on browser's navigator.onLine
 * which is reliable for detecting online/offline status
 */
export const checkConnection = async (): Promise<boolean> => {
    return navigator.onLine;
};

const startHeartbeat = () => {
    setInterval(async () => {
        try {
            const status = await checkConnection();
            if (status !== isOnline) {
                status ? handleOnline() : handleOffline();
            }
        } catch (error) {
            // Silently handle errors in heartbeat to prevent console spam
            console.debug('Heartbeat check error:', error);
        }
    }, 10000); // Check every 10 seconds
};

/**
 * Clean up offline service
 */
export const cleanupOfflineService = () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
};

/**
 * Handle online event
 */
const handleOnline = () => {
    console.log('Connection restored');
    isOnline = true;
    onlineCallbacks.forEach(cb => cb());

    // Trigger background sync
    syncQueuedActions();
};

/**
 * Handle offline event
 */
const handleOffline = () => {
    console.log('Connection lost');
    isOnline = false;
    offlineCallbacks.forEach(cb => cb());
};

/**
 * Subscribe to online events
 */
export const onOnline = (callback: () => void) => {
    onlineCallbacks.push(callback);
    return () => {
        const index = onlineCallbacks.indexOf(callback);
        if (index > -1) onlineCallbacks.splice(index, 1);
    };
};

/**
 * Subscribe to offline events
 */
export const onOffline = (callback: () => void) => {
    offlineCallbacks.push(callback);
    return () => {
        const index = offlineCallbacks.indexOf(callback);
        if (index > -1) offlineCallbacks.splice(index, 1);
    };
};

/**
 * Check if currently online
 */
export const getOnlineStatus = () => isOnline;

/**
 * Initialize IndexedDB for offline queue
 */
const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                store.createIndex('type', 'type', { unique: false });
            }
        };
    });
};

/**
 * Get IndexedDB instance
 */
const getDB = async (): Promise<IDBDatabase> => {
    return initDB();
};

/**
 * Queue an action for later execution
 */
export const queueAction = async (
    type: QueuedAction['type'],
    action: string,
    payload: any
): Promise<string> => {
    const queuedAction: QueuedAction = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        action,
        payload,
        timestamp: Date.now(),
        retryCount: 0,
    };

    try {
        const db = await getDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        await new Promise((resolve, reject) => {
            const request = store.add(queuedAction);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        console.log('Action queued:', queuedAction);

        // Try to sync if we're back online
        if (isOnline) {
            setTimeout(() => syncQueuedActions(), 1000);
        }

        return queuedAction.id;
    } catch (error) {
        console.error('Failed to queue action:', error);
        throw error;
    }
};

/**
 * Get all queued actions
 */
export const getQueuedActions = async (): Promise<QueuedAction[]> => {
    try {
        const db = await getDB();
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Failed to get queued actions:', error);
        return [];
    }
};

/**
 * Get queued actions count
 */
export const getQueuedActionsCount = async (): Promise<number> => {
    try {
        const db = await getDB();
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);

        return new Promise((resolve, reject) => {
            const request = store.count();
            request.onsuccess = () => resolve(request.result || 0);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Failed to get queued actions count:', error);
        return 0;
    }
};

/**
 * Remove a queued action
 */
const removeQueuedAction = async (id: string): Promise<void> => {
    try {
        const db = await getDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        await new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        console.log('Action removed from queue:', id);
    } catch (error) {
        console.error('Failed to remove queued action:', error);
    }
};

/**
 * Update a queued action (for retry count)
 */
const updateQueuedAction = async (action: QueuedAction): Promise<void> => {
    try {
        const db = await getDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        await new Promise((resolve, reject) => {
            const request = store.put(action);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Failed to update queued action:', error);
    }
};

/**
 * Sync all queued actions
 */
export const syncQueuedActions = async (): Promise<{
    success: number;
    failed: number;
    total: number;
}> => {
    if (!isOnline) {
        console.log('Cannot sync: offline');
        return { success: 0, failed: 0, total: 0 };
    }

    const actions = await getQueuedActions();

    if (actions.length === 0) {
        console.log('No actions to sync');
        return { success: 0, failed: 0, total: 0 };
    }

    console.log(`Syncing ${actions.length} queued actions...`);

    let successCount = 0;
    let failedCount = 0;

    for (const action of actions) {
        try {
            // Execute the action based on type
            await executeAction(action);

            // Remove from queue on success
            await removeQueuedAction(action.id);
            successCount++;

            console.log('Action synced successfully:', action.id);
        } catch (error) {
            console.error('Failed to sync action:', action.id, error);

            // Increment retry count
            action.retryCount++;

            if (action.retryCount >= MAX_RETRIES) {
                // Remove after max retries
                console.warn('Max retries reached, removing action:', action.id);
                await removeQueuedAction(action.id);
                failedCount++;
            } else {
                // Update retry count
                await updateQueuedAction(action);
                failedCount++;
            }
        }
    }

    console.log(`Sync complete: ${successCount} success, ${failedCount} failed`);

    return {
        success: successCount,
        failed: failedCount,
        total: actions.length,
    };
};

/**
 * Execute a queued action
 */
const executeAction = async (action: QueuedAction): Promise<void> => {
    const { type, action: actionName, payload } = action;

    switch (type) {
        case 'attendance':
            return executeAttendanceAction(actionName, payload);
        case 'grade':
            return executeGradeAction(actionName, payload);
        case 'results':
            return executeResultsAction(actionName, payload);
        case 'message':
            return executeMessageAction(actionName, payload);
        case 'payment':
            return executePaymentAction(actionName, payload);
        default:
            return executeGenericAction(actionName, payload);
    }
};

/**
 * Execute attendance action
 */
const executeAttendanceAction = async (action: string, payload: any): Promise<void> => {
    switch (action) {
        case 'mark_attendance':
            const { error } = await supabase
                .from('attendance')
                .insert(payload);

            if (error) throw error;
            break;

        case 'update_attendance':
            const { error: updateError } = await supabase
                .from('attendance')
                .update(payload.data)
                .eq('id', payload.id);

            if (updateError) throw updateError;
            break;

        default:
            throw new Error(`Unknown attendance action: ${action}`);
    }
};

/**
 * Execute grade action
 */
const executeGradeAction = async (action: string, payload: any): Promise<void> => {
    switch (action) {
        case 'submit_grade':
            const { error } = await supabase
                .from('results')
                .insert(payload);

            if (error) throw error;
            break;

        case 'update_grade':
            const { error: updateError } = await supabase
                .from('results')
                .update(payload.data)
                .eq('id', payload.id);

            if (updateError) throw updateError;
            break;

        default:
            throw new Error(`Unknown grade action: ${action}`);
    }
};

/**
 * Execute results action (for GradeEntry)
 */
const executeResultsAction = async (action: string, payload: any): Promise<void> => {
    switch (action) {
        case 'upsert_results':
            const { error } = await supabase
                .from('results')
                .upsert(payload);

            if (error) throw error;
            break;

        default:
            throw new Error(`Unknown results action: ${action}`);
    }
};

/**
 * Execute message action
 */
const executeMessageAction = async (action: string, payload: any): Promise<void> => {
    switch (action) {
        case 'send_message':
            const { error } = await supabase
                .from('messages')
                .insert(payload);

            if (error) throw error;
            break;

        default:
            throw new Error(`Unknown message action: ${action}`);
    }
};

/**
 * Execute payment action
 */
const executePaymentAction = async (action: string, payload: any): Promise<void> => {
    switch (action) {
        case 'process_payment':
            const { error } = await supabase
                .from('transactions')
                .insert(payload);

            if (error) throw error;
            break;

        default:
            throw new Error(`Unknown payment action: ${action}`);
    }
};

/**
 * Execute generic action
 */
const executeGenericAction = async (action: string, payload: any): Promise<void> => {
    console.warn('Executing generic action:', action, payload);
    // Generic actions can be extended as needed
    throw new Error(`Generic action not implemented: ${action}`);
};

/**
 * Clear all queued actions (use with caution)
 */
export const clearQueue = async (): Promise<void> => {
    try {
        const db = await getDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        await new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        console.log('Queue cleared');
    } catch (error) {
        console.error('Failed to clear queue:', error);
    }
};
