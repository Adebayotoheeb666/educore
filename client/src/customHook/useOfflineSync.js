import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSyncStatus, setLastSyncAt } from '../redux/features/offlineSync/offlineSyncSlice';
import { syncPendingData, registerBackgroundSync } from '../utils/offlineSync';
import { getPendingCount } from '../utils/offlineDB';

const useOfflineSync = () => {
  const dispatch = useDispatch();
  const { syncStatus } = useSelector((state) => state.offlineSync);
  const isSyncing = useRef(false);

  const sync = useCallback(async () => {
    if (isSyncing.current || !navigator.onLine) return;
    isSyncing.current = true;
    dispatch(setSyncStatus('syncing'));

    try {
      const result = await syncPendingData();
      dispatch(setLastSyncAt(new Date().toISOString()));
      dispatch(setSyncStatus(result.failed > 0 ? 'partial' : 'idle'));
    } catch {
      dispatch(setSyncStatus('error'));
    } finally {
      isSyncing.current = false;
    }
  }, [dispatch]);

  useEffect(() => {
    registerBackgroundSync();

    const handleOnline = () => sync();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [sync]);

  const getPending = useCallback(() => getPendingCount(), []);

  return { sync, syncStatus, getPending, isOnline: navigator.onLine };
};

export default useOfflineSync;
