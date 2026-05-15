/**
 * Integration: Subject CRUD
 */
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const User = require('../../models/userModel');

let token;
let subjectId;
let schoolId;
let assignedTeacherId;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/educore_test_subjects');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('Subject CRUD', () => {
  test('register school and obtain token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      schoolName: 'Subject Test Academy',
      name: 'Subject Admin',
      email: `subject-admin-${Date.now()}@test.ng`,
      password: 'Test@1234',
      phone: '08012345679',
    });
    expect(res.status).toBe(201);
    token = res.body.token;
    const owner = await User.findById(res.body._id);
    schoolId = owner.schoolId;
  });

  test('create subject', async () => {
    const res = await request(app)
      .post('/api/subjects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Mathematics', code: 'MTH', category: 'core' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Mathematics');
    subjectId = res.body._id;
  });

  test('list subjects', async () => {
    const res = await request(app)
      .get('/api/subjects')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some(s => s._id === subjectId)).toBe(true);
  });

  test('get single subject', async () => {
    const res = await request(app)
      .get(`/api/subjects/${subjectId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe('MTH');
  });

  test('update subject', async () => {
    const res = await request(app)
      .patch(`/api/subjects/${subjectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Further Mathematics', code: 'FMT' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Further Mathematics');
    expect(res.body.code).toBe('FMT');
  });

  test('seed teacher for assignment', async () => {
    const teacher = await User.create({
      name: 'Ada Okafor',
      email: `ada-${Date.now()}@test.ng`,
      password: 'Test@1234',
      role: 'subject_teacher',
      schoolId,
    });
    assignedTeacherId = teacher._id.toString();
  });

  test('assign teacher to subject', async () => {
    const res = await request(app)
      .post(`/api/subjects/${subjectId}/assign`)
      .set('Authorization', `Bearer ${token}`)
      .send({ teacherId: assignedTeacherId });
    expect(res.status).toBe(200);
    expect(res.body.teachers).toHaveLength(1);
    expect(res.body.teachers[0].name).toBe('Ada Okafor');
  });

  test('unassign teacher from subject', async () => {
    const res = await request(app)
      .post(`/api/subjects/${subjectId}/unassign`)
      .set('Authorization', `Bearer ${token}`)
      .send({ teacherId: assignedTeacherId });
    expect(res.status).toBe(200);
    expect(res.body.teachers).toHaveLength(0);
  });

  test('delete subject', async () => {
    const res = await request(app)
      .delete(`/api/subjects/${subjectId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test('get deleted subject returns 404', async () => {
    const res = await request(app)
      .get(`/api/subjects/${subjectId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
