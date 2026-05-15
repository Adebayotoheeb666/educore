/**
 * Integration: Full student lifecycle
 * register school → create class → add student → mark attendance → create exam → enter scores → compute results
 */
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');

let token, schoolId, classId, studentId, examId;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/educore_test');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('Student Lifecycle', () => {
  test('1. Register school and get token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      schoolName: 'Test Academy',
      name: 'Test Owner',
      email: 'owner@test.ng',
      password: 'Test@1234',
      phone: '08012345678',
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
    schoolId = res.body.schoolId;
  });

  test('2. Create a class', async () => {
    const res = await request(app)
      .post('/api/classes')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'JSS1', arm: 'A', level: 'junior', session: '2024/2025' });
    expect(res.status).toBe(201);
    classId = res.body._id;
  });

  test('3. Add a student', async () => {
    const res = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Chukwuemeka',
        lastName: 'Obi',
        admissionNumber: 'JSS1/001/2024',
        class: classId,
        gender: 'male',
        dateOfBirth: '2012-03-15',
      });
    expect(res.status).toBe(201);
    studentId = res.body._id;
  });

  test('4. Mark attendance', async () => {
    const res = await request(app)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${token}`)
      .send({
        class: classId,
        date: new Date().toISOString(),
        term: 'First Term',
        session: '2024/2025',
        records: [{ student: studentId, status: 'present' }],
      });
    expect(res.status).toBe(201);
  });

  test('5. Create and publish exam', async () => {
    const res = await request(app)
      .post('/api/exams')
      .set('Authorization', `Bearer ${token}`)
      .send({
        class: classId,
        term: 'First Term',
        type: 'exam',
        totalMarks: 100,
        subject: new mongoose.Types.ObjectId(),
      });
    expect(res.status).toBe(201);
    examId = res.body._id;
  });

  test('6. Enter scores', async () => {
    const res = await request(app)
      .post(`/api/exams/${examId}/scores`)
      .set('Authorization', `Bearer ${token}`)
      .send({ scores: [{ student: studentId, score: 72 }] });
    expect([200, 201]).toContain(res.status);
  });

  test('7. Compute results', async () => {
    const res = await request(app)
      .post('/api/results/compute')
      .set('Authorization', `Bearer ${token}`)
      .send({ classId, term: 'First Term', session: '2024/2025' });
    expect([200, 201]).toContain(res.status);
  });
});
