/**
 * Integration: Payment flow
 * create fee schedule → record payment → verify balance updated → check defaulters
 */
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');

let token, feeId, studentId, paymentId;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/educore_payment_test');
  const reg = await request(app).post('/api/auth/register').send({ schoolName: 'Finance School', name: 'Bursar Admin', email: 'bursar@test.ng', password: 'Test@1234', phone: '08022222222' });
  token = reg.body.token;

  // Create a student to pay for
  const classRes = await request(app).post('/api/classes').set('Authorization', `Bearer ${token}`).send({ name: 'SS1', arm: 'A', level: 'senior', session: '2024/2025' });
  const studentRes = await request(app).post('/api/students').set('Authorization', `Bearer ${token}`).send({ firstName: 'Amaka', lastName: 'Nwosu', admissionNumber: 'SS1/001', class: classRes.body._id, gender: 'female', dateOfBirth: '2008-01-01' });
  studentId = studentRes.body._id;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('Payment Flow', () => {
  test('1. Create fee schedule', async () => {
    const res = await request(app)
      .post('/api/fees')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'First Term Fees 2024/2025',
        term: 'First Term',
        session: '2024/2025',
        dueDate: '2024-11-30',
        items: [{ name: 'Tuition', amount: 45000, mandatory: true }, { name: 'Development Levy', amount: 5000, mandatory: true }],
        totalAmount: 50000,
      });
    expect([200, 201]).toContain(res.status);
    feeId = res.body._id;
  });

  test('2. Record partial payment', async () => {
    const res = await request(app)
      .post('/api/fees/payment')
      .set('Authorization', `Bearer ${token}`)
      .send({ student: studentId, fee: feeId, amountPaid: 25000, method: 'cash' });
    expect([200, 201]).toContain(res.status);
    paymentId = res.body._id;
    expect(res.body.status).toBe('partial');
    expect(res.body.balance).toBe(25000);
  });

  test('3. Record remaining payment', async () => {
    const res = await request(app)
      .post('/api/fees/payment')
      .set('Authorization', `Bearer ${token}`)
      .send({ student: studentId, fee: feeId, amountPaid: 25000, method: 'bank_transfer' });
    expect([200, 201]).toContain(res.status);
    expect(res.body.status).toBe('paid');
    expect(res.body.balance).toBe(0);
  });

  test('4. Student no longer in defaulters', async () => {
    const res = await request(app)
      .get('/api/fees/defaulters')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const defaulterIds = (res.body || []).map(d => d.student?._id?.toString());
    expect(defaulterIds).not.toContain(studentId?.toString());
  });

  test('5. Get student fee statement', async () => {
    const res = await request(app)
      .get(`/api/fees/statement/${studentId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
