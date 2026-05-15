import { openDB } from 'idb';

const DB_NAME = 'educore_offline_v1';
const DB_VERSION = 1;

const getDB = () =>
  openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('attendance_pending')) {
        const store = db.createObjectStore('attendance_pending', { keyPath: 'offlineId' });
        store.createIndex('createdAt', 'createdAt');
      }
      if (!db.objectStoreNames.contains('submissions_pending')) {
        const store = db.createObjectStore('submissions_pending', { keyPath: 'offlineId' });
        store.createIndex('examId', 'examId');
      }
      if (!db.objectStoreNames.contains('lesson_plans_cache')) {
        const store = db.createObjectStore('lesson_plans_cache', { keyPath: 'id' });
        store.createIndex('cachedAt', 'cachedAt');
      }
      if (!db.objectStoreNames.contains('results_cache')) {
        const store = db.createObjectStore('results_cache', { keyPath: 'id' });
        store.createIndex('studentId', 'studentId');
      }
    },
  });

// Attendance
export const addPendingAttendance = async (record) => {
  const db = await getDB();
  return db.put('attendance_pending', { ...record, createdAt: Date.now() });
};

export const getPendingAttendance = async () => {
  const db = await getDB();
  return db.getAll('attendance_pending');
};

export const clearPendingAttendance = async (offlineIds) => {
  const db = await getDB();
  const tx = db.transaction('attendance_pending', 'readwrite');
  await Promise.all(offlineIds.map((id) => tx.store.delete(id)));
  await tx.done;
};

// Submissions
export const addPendingSubmission = async (record) => {
  const db = await getDB();
  return db.put('submissions_pending', { ...record, createdAt: Date.now() });
};

export const getPendingSubmissions = async () => {
  const db = await getDB();
  return db.getAll('submissions_pending');
};

export const clearPendingSubmissions = async (offlineIds) => {
  const db = await getDB();
  const tx = db.transaction('submissions_pending', 'readwrite');
  await Promise.all(offlineIds.map((id) => tx.store.delete(id)));
  await tx.done;
};

// Lesson plans cache
export const cacheLessonPlan = async (plan) => {
  const db = await getDB();
  return db.put('lesson_plans_cache', { ...plan, cachedAt: Date.now() });
};

export const getCachedLessonPlan = async (id) => {
  const db = await getDB();
  return db.get('lesson_plans_cache', id);
};

export const getAllCachedLessonPlans = async () => {
  const db = await getDB();
  return db.getAll('lesson_plans_cache');
};

// Results cache
export const cacheResult = async (result) => {
  const db = await getDB();
  return db.put('results_cache', { ...result, cachedAt: Date.now() });
};

export const getCachedResult = async (id) => {
  const db = await getDB();
  return db.get('results_cache', id);
};

export const getCachedResultsByStudent = async (studentId) => {
  const db = await getDB();
  return db.getAllFromIndex('results_cache', 'studentId', studentId);
};

export const getPendingCount = async () => {
  const db = await getDB();
  const [attendanceCount, submissionsCount] = await Promise.all([
    db.count('attendance_pending'),
    db.count('submissions_pending'),
  ]);
  return { attendance: attendanceCount, submissions: submissionsCount, total: attendanceCount + submissionsCount };
};
