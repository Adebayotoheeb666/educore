import { supabase } from './supabase';

export interface StorageStats {
  totalSpace: number;
  usedSpace: number;
  cacheSpace: number;
  cloudAssets: number;
  percentUsed: number;
}

export interface SyncStatus {
  isSynced: boolean;
  lastSyncTime: Date | null;
  pendingItems: number;
  isOnline: boolean;
}

export const storageService = {
  /**
   * Get local storage space estimation
   */
  async getStorageStats(): Promise<StorageStats> {
    try {
      // Estimate storage from localStorage
      let totalStorageUsed = 0;

      if (typeof localStorage !== 'undefined') {
        for (let key in localStorage) {
          if (localStorage.hasOwnProperty(key)) {
            totalStorageUsed += localStorage[key].length + key.length;
          }
        }
      }

      // Estimate IndexedDB space (used by Supabase offline persistence or browser default)
      let indexedDBSize = 0;
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        try {
          const estimate = await (navigator as any).storage?.estimate?.();
          indexedDBSize = estimate?.usage || 0;
        } catch (e) {
          // Fallback estimation
          indexedDBSize = totalStorageUsed * 2;
        }
      }

      const cacheSpace = totalStorageUsed;
      const cloudAssets = indexedDBSize;
      const usedSpace = cacheSpace + cloudAssets;
      const totalSpace = 50 * 1024 * 1024; // 50MB total allocation

      return {
        totalSpace,
        usedSpace,
        cacheSpace,
        cloudAssets,
        percentUsed: (usedSpace / totalSpace) * 100,
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        totalSpace: 50 * 1024 * 1024,
        usedSpace: 0,
        cacheSpace: 0,
        cloudAssets: 0,
        percentUsed: 0,
      };
    }
  },

  /**
   * Clear application cache
   */
  async clearCache(): Promise<boolean> {
    try {
      // Clear localStorage
      const keysToPreserve = ['isAuthenticated', 'user', 'theme'];

      if (typeof localStorage !== 'undefined') {
        const keysToDelete = [];
        for (let key in localStorage) {
          if (localStorage.hasOwnProperty(key) && !keysToPreserve.includes(key)) {
            keysToDelete.push(key);
          }
        }
        keysToDelete.forEach(key => localStorage.removeItem(key));
      }

      // Clear service worker cache if available
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter(name => !name.includes('static'))
            .map(name => caches.delete(name))
        );
      }

      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw new Error('Failed to clear cache');
    }
  },

  /**
   * Get current sync status
   */
  getSyncStatus(): SyncStatus {
    const isOnline = navigator.onLine;
    const lastSync = localStorage.getItem('lastSyncTime');
    const lastSyncTime = lastSync ? new Date(JSON.parse(lastSync)) : null;

    // Get pending items from localStorage
    const pendingItems = JSON.parse(localStorage.getItem('pendingSync') || '[]').length;

    return {
      isSynced: pendingItems === 0,
      lastSyncTime,
      pendingItems,
      isOnline,
    };
  },

  /**
   * Manually trigger sync
   */
  async triggerSync(): Promise<boolean> {
    try {
      if (!navigator.onLine) {
        throw new Error('No internet connection. Please check your connection and try again.');
      }

      // Get pending items from localStorage
      const pendingSync = JSON.parse(localStorage.getItem('pendingSync') || '[]');

      if (pendingSync.length === 0) {
        localStorage.setItem('lastSyncTime', JSON.stringify(new Date()));
        return true;
      }

      // Process pending items (this is a placeholder for actual sync logic)

      let itemsProcessed = 0;

      for (const item of pendingSync) {
        if (item.type === 'grade') {
          try {
            // Using direct Supabase insert instead of batch for now (e.g., instead of Firestore)
            await supabase.from('results').insert(item.data);
            itemsProcessed++;
          } catch (e) {
            console.error('Error syncing item:', e);
          }
        }
      }

      // Clear pending items and update last sync
      localStorage.setItem('pendingSync', JSON.stringify([]));
      localStorage.setItem('lastSyncTime', JSON.stringify(new Date()));

      return true;
    } catch (error) {
      console.error('Error during sync:', error);
      throw error;
    }
  },

  /**
   * Enable offline mode (data saver)
   */
  setDataSaverMode(enabled: boolean) {
    localStorage.setItem('dataSaverMode', JSON.stringify(enabled));
    window.dispatchEvent(new CustomEvent('dataSaverModeChanged', { detail: { enabled } }));
  },

  /**
   * Check if data saver mode is enabled
   */
  isDataSaverEnabled(): boolean {
    return JSON.parse(localStorage.getItem('dataSaverMode') || 'false');
  },

  /**
   * Enable Gemini Nano (local AI)
   */
  setGeminiNanoMode(enabled: boolean) {
    localStorage.setItem('geminiNanoMode', JSON.stringify(enabled));
    window.dispatchEvent(new CustomEvent('geminiNanoModeChanged', { detail: { enabled } }));
  },

  /**
   * Check if Gemini Nano is enabled
   */
  isGeminiNanoEnabled(): boolean {
    return JSON.parse(localStorage.getItem('geminiNanoMode') || 'false');
  },

  /**
   * Enable auto-sync on Wi-Fi
   */
  setAutoSyncOnWifi(enabled: boolean) {
    localStorage.setItem('autoSyncOnWifi', JSON.stringify(enabled));
  },

  /**
   * Check if auto-sync on Wi-Fi is enabled
   */
  isAutoSyncOnWifiEnabled(): boolean {
    return JSON.parse(localStorage.getItem('autoSyncOnWifi') || 'true');
  },

  /**
   * Add item to pending sync queue
   */
  addToPendingSync(item: any) {
    const pending = JSON.parse(localStorage.getItem('pendingSync') || '[]');
    pending.push({ ...item, timestamp: Date.now() });
    localStorage.setItem('pendingSync', JSON.stringify(pending));
  },

  /**
   * Get storage usage by category
   */
  getStorageBreakdown(): { [key: string]: number } {
    const breakdown: { [key: string]: number } = {
      lessons: 0,
      exams: 0,
      results: 0,
      other: 0,
    };

    if (typeof localStorage !== 'undefined') {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          const size = localStorage[key].length + key.length;

          if (key.includes('lesson')) breakdown.lessons += size;
          else if (key.includes('exam')) breakdown.exams += size;
          else if (key.includes('result')) breakdown.results += size;
          else breakdown.other += size;
        }
      }
    }

    return breakdown;
  },
};
