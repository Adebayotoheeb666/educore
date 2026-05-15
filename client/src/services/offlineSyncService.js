import axios from 'axios';
import { syncPendingData } from '../utils/offlineSync';
import { getPendingCount } from '../utils/offlineDB';

export const processSyncBatch = (batches) =>
  axios.post('/api/sync/batch', { batches });

export const getSyncState = () => axios.get('/api/sync/state');

export const runSync = syncPendingData;

export const getPendingItemCount = getPendingCount;
