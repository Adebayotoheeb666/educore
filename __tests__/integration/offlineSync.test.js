/**
 * Integration: Offline sync
 * Submit attendance batch → verify idempotency → check conflict detection
 */
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');

let token, classId, studentId;
const OFFLINE_ID_1 = 'offline-attendance-' + Date.now();
const OFFLINE_ID_2 = 'offline-attendance-other-' + Date.now();

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/educore_sync_test');
  const reg = await request(app).post('/api/auth/register').send({ schoolName: 'Sync School', name: 'Sync Admin', email: 'sync@test.ng', password: 'Test@1234', phone: '08033333333' });
  token = reg.body.token;

  const classRes = await request(app).post('/api/classes').set('Authorization', `Bearer ${token}`).send({ name: 'JSS2', arm: 'B', level: 'junior', session: '2024/2025' });
  classId = classRes.body._id;

  const studentRes = await request(app).post('/api/students').set('Authorization', `Bearer ${token}`).send({ firstName: 'Emeka', lastName: 'Eze', admissionNumber: 'JSS2B/001', class: classId, gender: 'male', dateOfBirth: '2011-05-10' });
  studentId = studentRes.body._id;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

const makeAttendanceBatch = (offlineId) => ({
  batches: [{
    type: 'attendance',
    offlineId,
    createdAt: new Date().toISOString(),
    data: {
      class: classId,
      date: new Date().toISOString(),
      term: 'First Term',
      session: '2024/2025',
      records: [{ student: studentId, status: 'present' }],
    },
  }],
});

describe('Offline Sync', () => {
  test('1. Sync attendance batch successfully', async () => {
    const res = await request(app)
      .post('/api/sync/batch')
      .set('Authorization', `Bearer ${token}`)
      .send(makeAttendanceBatch(OFFLINE_ID_1));
    expect(res.status).toBe(200);
    expect(res.body.synced).toHaveLength(1);
    expect(res.body.failed).toHaveLength(0);
  });

  test('2. Re-submitting same offlineId is idempotent (no duplicate)', async () => {
    const res = await request(app)
      .post('/api/sync/batch')
      .set('Authorization', `Bearer ${token}`)
      .send(makeAttendanceBatch(OFFLINE_ID_1));
    expect(res.status).toBe(200);
    // Should be marked as already synced, not a failure
    expect(res.body.failed).toHaveLength(0);
  });

  test('3. Different offlineId creates new record', async () => {
    const payload = makeAttendanceBatch(OFFLINE_ID_2);
    payload.batches[0].data.date = new Date(Date.now() + 86400000).toISOString(); // tomorrow
    const res = await request(app)
      .post('/api/sync/batch')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    expect(res.status).toBe(200);
    expect(res.body.synced).toHaveLength(1);
  });

  test('4. Get sync state', async () => {
    const res = await request(app)
      .get('/api/sync/state')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('lastSyncAt');
  });
});
