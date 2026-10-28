import request from 'supertest';
import { createApp } from '../src/app.js';
import prisma from '../src/config/db.js';

const app = createApp();

describe('English Learning Dutt API Integration Tests', () => {
  let authToken = '';
  let testUserId = '';
  let conversationId = '';
  const testEmail = `test.learner.${Date.now()}@dutt.ai`;

  afterAll(async () => {
    // Cleanup test user and associated records
    if (testUserId) {
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }
    await prisma.$disconnect();
  });

  // Health check
  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.service).toContain('English Learning Dutt');
    });
  });

  // Auth: Register & Login
  describe('Authentication Module', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Priya Sharma',
          email: testEmail,
          password: 'Password123!',
          englishLevel: 'B1',
          targetLevel: 'C1',
          dailyGoalMinutes: 15,
          nativeLanguage: 'Hindi',
          learningGoal: 'Job Interview',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testEmail.toLowerCase());
      expect(res.body.data.token).toBeDefined();

      authToken = res.body.data.token;
      testUserId = res.body.data.user.id;
    });

    it('should fail to register user with same email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate User',
          email: testEmail,
          password: 'Password123!',
        });

      expect(res.status).toBe(409);
      expect(res.body.errorCode).toBe('CONFLICT_ERROR');
    });

    it('should log in with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('should fail to log in with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.errorCode).toBe('AUTHENTICATION_REQUIRED');
    });

    it('should retrieve current user with GET /api/auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(testUserId);
      expect(res.body.data.name).toBe('Priya Sharma');
    });
  });

  // Diagnostic Assessment Module
  describe('Assessment Module', () => {
    it('should return initial assessment questions', async () => {
      const res = await request(app)
        .post('/api/assessment/start')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.questions).toBeInstanceOf(Array);
      expect(res.body.data.questions.length).toBeGreaterThan(0);
    });

    it('should submit assessment and estimate level', async () => {
      const res = await request(app)
        .post('/api/assessment/submit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          answers: [
            { questionId: 1, selectedOptionIndex: 1 },
            { questionId: 2, selectedOptionIndex: 1 },
            { questionId: 3, selectedOptionIndex: 1 },
            { questionId: 4, selectedOptionIndex: 1 },
          ],
          spokenTranscript: 'I enjoy practicing speaking English every morning with my coach Dutt.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.result.level).toBeDefined();
      expect(res.body.data.result.overallScore).toBeGreaterThan(0);
      expect(res.body.data.result.disclaimer).toContain('AI-generated proficiency estimate');
    });
  });

  // Conversations & AI
  describe('Conversations Module', () => {
    it('should start a new conversation with Dutt', async () => {
      const res = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mode: 'DAILY_PRACTICE',
          topic: 'Daily Routine and Hobbies',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.conversation.id).toBeDefined();
      expect(res.body.data.initialMessage.sender).toBe('DUTT');

      conversationId = res.body.data.conversation.id;
    });

    it('should send user message, get Dutt reply, and detect grammar mistakes', async () => {
      const res = await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          messageText: 'I go to the market yesterday and bought vegetables.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.duttMessage.sender).toBe('DUTT');
      expect(res.body.data.duttMessage.messageText).toBeDefined();
      // Notice "I go yesterday" triggers past tense correction
      expect(res.body.data.correction).toBeDefined();
      expect(res.body.data.correction.grammarTopic).toBe('past_tense');
      expect(res.body.data.correction.correctedText).toContain('went');
    });

    it('should end conversation and generate session report', async () => {
      const res = await request(app)
        .post(`/api/conversations/${conversationId}/end`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.sessionReport).toBeDefined();
      expect(res.body.data.sessionReport.speakingScore).toBeGreaterThan(0);
      expect(res.body.data.sessionReport.mistakesCount).toBeGreaterThanOrEqual(1);
    });
  });

  // Learning & Dashboard Module
  describe('Learning Dashboard Module', () => {
    it('should return complete dashboard payload', async () => {
      const res = await request(app)
        .get('/api/learning/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.name).toBe('Priya Sharma');
      expect(res.body.data.scores.speaking).toBeDefined();
      expect(res.body.data.recentConversations).toBeInstanceOf(Array);
      expect(res.body.data.recentMistakes).toBeInstanceOf(Array);
    });

    it('should return categorized mistakes grouped by topic', async () => {
      const res = await request(app)
        .get('/api/learning/mistakes')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      const pastTense = res.body.data.find((m) => m.topic === 'past_tense');
      expect(pastTense).toBeDefined();
      expect(pastTense.count).toBeGreaterThanOrEqual(1);
    });

    it('should return pre-seeded English lessons', async () => {
      const res = await request(app)
        .get('/api/learning/lessons')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(5);
    });
  });

  // Voice Module
  describe('Voice & Pronunciation Module', () => {
    it('should evaluate word pronunciation accuracy', async () => {
      const res = await request(app)
        .post('/api/voice/pronunciation')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          targetWord: 'articulate',
          spokenWord: 'articulate',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.score).toBeGreaterThanOrEqual(95);
      expect(res.body.data.feedback).toBeDefined();
    });
  });

  // Progress Module
  describe('Progress Module', () => {
    it('should return real progress statistics from database', async () => {
      const res = await request(app)
        .get('/api/progress')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.hasData).toBe(true);
      expect(res.body.data.sessionsCompleted).toBeGreaterThanOrEqual(1);
    });
  });
});
