import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import {
  getPendingAttendance,
  clearPendingAttendance,
  getPendingSubmissions,
  clearPendingSubmissions,
} from './offlineDB';

export const syncPendingData = async () => {
  if (!navigator.onLine) return { synced: 0, failed: 0, skipped: 'offline' };

  const results = { synced: 0, failed: 0, conflicts: [] };

  // Sync attendance
  const pendingAttendance = await getPendingAttendance();
  if (pendingAttendance.length > 0) {
    try {
      const response = await axios.post('/api/sync/batch', {
        batches: pendingAttendance.map((record) => ({
          type: 'attendance',
          data: record.data,
          offlineId: record.offlineId,
          createdAt: new Date(record.createdAt).toISOString(),
        })),
      });
      const { synced = [], failed = [], conflicts = [] } = response.data;
      const syncedIds = synced.map((s) => s.offlineId);
      if (syncedIds.length > 0) await clearPendingAttendance(syncedIds);
      results.synced += synced.length;
      results.failed += failed.length;
      results.conflicts.push(...conflicts);
    } catch (err) {
      console.warn('[OfflineSync] Attendance sync failed:', err.message);
      results.failed += pendingAttendance.length;
    }
  }

  // Sync submissions
  const pendingSubmissions = await getPendingSubmissions();
  if (pendingSubmissions.length > 0) {
    try {
      const response = await axios.post('/api/sync/batch', {
        batches: pendingSubmissions.map((record) => ({
          type: 'submission',
          data: record.data,
          offlineId: record.offlineId,
          createdAt: new Date(record.createdAt).toISOString(),
        })),
      });
      const { synced = [], failed = [], conflicts = [] } = response.data;
      const syncedIds = synced.map((s) => s.offlineId);
      if (syncedIds.length > 0) await clearPendingSubmissions(syncedIds);
      results.synced += synced.length;
      results.failed += failed.length;
      results.conflicts.push(...conflicts);
    } catch (err) {
      console.warn('[OfflineSync] Submission sync failed:', err.message);
      results.failed += pendingSubmissions.length;
    }
  }

  return results;
};

export const generateOfflineId = () => `offline_${uuidv4()}`;

export const registerBackgroundSync = () => {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready
      .then((registration) => registration.sync.register('educore-sync'))
      .catch((err) => {
        console.warn('[OfflineSync] Background sync registration failed:', err.message);
        // Fallback: listen for online event and sync manually
        window.addEventListener('online', syncPendingData);
      });
  } else {
    // No background sync support — use online event fallback
    window.addEventListener('online', syncPendingData);
  }
};

export const unregisterBackgroundSync = () => {
  window.removeEventListener('online', syncPendingData);
};
