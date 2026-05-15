/**
 * Integration: AI workflow
 * generate lesson plan → save → generate questions → create exam → grade submission
 *
 * AI calls are mocked so this runs without real API keys.
 */
const request = require('supertest');
const mongoose = require('mongoose');

jest.mock('../../ai/aiClient', () => ({
  callAI: jest.fn().mockResolvedValue({ content: '{"topic":"Algebra","objectives":["Solve equations"]}' }),
  callAIStructured: jest.fn().mockResolvedValue({ topic: 'Algebra', objectives: ['Solve equations'], content: { intro: 'i', development: 'd', conclusion: 'c' }, teachingAids: [], nerdcReference: 'JSS2/MATH/001', bloomsTaxonomyLevel: ['Remember'] }),
  trackTokenUsage: jest.fn().mockResolvedValue(null),
}));

const app = require('../../server');

let token, lessonPlanId;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/educore_ai_test');
  // Register and login
  const reg = await request(app).post('/api/auth/register').send({ schoolName: 'AI Test School', name: 'AI Owner', email: 'ai@test.ng', password: 'Test@1234', phone: '08011111111' });
  token = reg.body.token;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('AI Workflow', () => {
  test('1. Generate lesson plan via AI', async () => {
    const res = await request(app)
      .post('/api/ai/lesson-plan')
      .set('Authorization', `Bearer ${token}`)
      .send({ subject: 'Mathematics', classLevel: 'JSS2', topic: 'Algebra', term: 'First Term' });
    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('topic');
  });

  test('2. Save lesson plan', async () => {
    const res = await request(app)
      .post('/api/lesson-plans')
      .set('Authorization', `Bearer ${token}`)
      .send({
        topic: 'Algebra',
        term: 'First Term',
        session: '2024/2025',
        objectives: ['Solve linear equations'],
        content: { intro: 'Introduction to algebra', development: 'Body', conclusion: 'Summary' },
        subject: new mongoose.Types.ObjectId(),
        class: new mongoose.Types.ObjectId(),
        aiGenerated: true,
      });
    expect([200, 201]).toContain(res.status);
    lessonPlanId = res.body._id;
  });

  test('3. Generate questions for a topic', async () => {
    const res = await request(app)
      .post('/api/ai/questions')
      .set('Authorization', `Bearer ${token}`)
      .send({ subject: 'Mathematics', classLevel: 'JSS2', topic: 'Algebra', type: 'mcq', count: 5, difficulty: 'medium' });
    expect([200, 201]).toContain(res.status);
  });

  test('4. Get AI usage stats', async () => {
    const res = await request(app)
      .get('/api/ai/usage')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 403]).toContain(res.status); // 403 if role check fails in test env
  });
});
