import request from 'supertest';
import app from '../src/index';
import { setupDB, teardownDB, clearDB } from './mongoHelper';

beforeAll(setupDB);
afterAll(teardownDB);
afterEach(clearDB);

const testUser = {
  email: 'student@apex-language.vn',
  password: 'password123',
  phone: '0901234568',
  full_name: 'Student Test',
};

async function registerAndLogin(): Promise<string> {
  await request(app).post('/api/auth/register').send(testUser);
  const { User } = await import('../src/models/User');
  await User.updateOne({ email: testUser.email }, { is_active: true });
  const res = await request(app).post('/api/auth/login').send({ email: testUser.email, password: testUser.password });
  return res.body.data.accessToken;
}

describe('Enrollment API', () => {
  describe('Authentication guard', () => {
    it('GET /api/enrollments returns 401 without token', async () => {
      expect((await request(app).get('/api/enrollments')).status).toBe(401);
    });

    it('POST /api/enrollments/sign-policy returns 401 without token', async () => {
      expect((await request(app).post('/api/enrollments/sign-policy')).status).toBe(401);
    });

    it('GET /api/admin/stats returns 401 without token', async () => {
      expect((await request(app).get('/api/admin/stats')).status).toBe(401);
    });
  });

  describe('Enrollment flow', () => {
    let token: string;

    beforeEach(async () => {
      token = await registerAndLogin();
    });

    it('GET /api/enrollments inits and returns step_1 enrollment', async () => {
      const res = await request(app).get('/api/enrollments').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.current_step).toBe(1);
      expect(res.body.data.status).toBe('step_1');
    });

    it('POST /api/enrollments/sign-policy rejects missing signature_data', async () => {
      const res = await request(app)
        .post('/api/enrollments/sign-policy')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it('POST /api/enrollments/sign-policy succeeds with valid signature', async () => {
      const res = await request(app)
        .post('/api/enrollments/sign-policy')
        .set('Authorization', `Bearer ${token}`)
        .send({ signature_data: 'data:image/png;base64,abc123' });
      expect(res.status).toBe(200);
      // Verify step advanced
      const enr = await request(app).get('/api/enrollments').set('Authorization', `Bearer ${token}`);
      expect(enr.body.data.current_step).toBe(2);
    });

    it('GET /api/enrollments/exam-schedules returns 400 without language param', async () => {
      const res = await request(app)
        .get('/api/enrollments/exam-schedules')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    it('GET /api/enrollments/exam-schedules returns empty array for unknown language', async () => {
      const res = await request(app)
        .get('/api/enrollments/exam-schedules?language=unknown')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/enrollments/programs returns empty array initially', async () => {
      const res = await request(app)
        .get('/api/enrollments/programs')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Admin role guard', () => {
    let studentToken: string;

    beforeEach(async () => {
      studentToken = await registerAndLogin();
    });

    it('GET /api/admin/stats returns 403 for student', async () => {
      expect((await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${studentToken}`)).status).toBe(403);
    });

    it('GET /api/admin/enrollments returns 403 for student', async () => {
      expect((await request(app).get('/api/admin/enrollments').set('Authorization', `Bearer ${studentToken}`)).status).toBe(403);
    });

    it('GET /api/admin/users returns 403 for student', async () => {
      expect((await request(app).get('/api/admin/users').set('Authorization', `Bearer ${studentToken}`)).status).toBe(403);
    });
  });

  describe('Payment endpoint', () => {
    it('GET /api/payments/mock-vnpay returns 400 without enrollmentId', async () => {
      expect((await request(app).get('/api/payments/mock-vnpay')).status).toBe(400);
    });
  });
});
