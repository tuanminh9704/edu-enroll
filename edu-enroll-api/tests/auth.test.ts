import request from 'supertest';
import app from '../src/index';
import { setupDB, teardownDB, clearDB } from './mongoHelper';

beforeAll(setupDB);
afterAll(teardownDB);
afterEach(clearDB);

const testUser = {
  email: 'test@apex-language.vn',
  password: 'password123',
  phone: '0901234567',
  full_name: 'Nguyen Van Test',
};

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should register successfully and return 201', async () => {
      const res = await request(app).post('/api/auth/register').send(testUser);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Đăng ký thành công');
    });

    it('should resend OTP for duplicate unverified email', async () => {
      await request(app).post('/api/auth/register').send(testUser);
      const res = await request(app).post('/api/auth/register').send(testUser);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should reject duplicate verified email', async () => {
      await request(app).post('/api/auth/register').send(testUser);
      const { User } = await import('../src/models/User');
      await User.updateOne({ email: testUser.email }, { is_active: true });
      const res = await request(app).post('/api/auth/register').send(testUser);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid email format', async () => {
      const res = await request(app).post('/api/auth/register').send({ ...testUser, email: 'not-an-email' });
      expect(res.status).toBe(400);
    });

    it('should reject short password', async () => {
      const res = await request(app).post('/api/auth/register').send({ ...testUser, password: '123' });
      expect(res.status).toBe(400);
    });

    it('should reject invalid phone number', async () => {
      const res = await request(app).post('/api/auth/register').send({ ...testUser, phone: '12345' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(testUser);
      const { User } = await import('../src/models/User');
      await User.updateOne({ email: testUser.email }, { is_active: true });
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: testUser.email, password: testUser.password });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user.email).toBe(testUser.email);
    });

    it('should reject wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: testUser.email, password: 'wrongpass' });
      expect(res.status).toBe(401);
    });

    it('should reject non-existent email', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'nobody@test.com', password: 'pass123' });
      expect(res.status).toBe(401);
    });

    it('should reject unverified account', async () => {
      const { User } = await import('../src/models/User');
      await User.updateOne({ email: testUser.email }, { is_active: false });
      const res = await request(app).post('/api/auth/login').send({ email: testUser.email, password: testUser.password });
      expect(res.status).toBe(401);
    });
  });

  describe('OTP verification', () => {
    it('should verify register OTP with code payload', async () => {
      await request(app).post('/api/auth/register').send(testUser);
      const { OtpCode } = await import('../src/models/OtpCode');
      const otp = await OtpCode.findOne({ email: testUser.email, type: 'register' }).sort({ created_at: -1 });

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: testUser.email, code: otp?.otp, type: 'register' });

      expect(res.status).toBe(200);
      const { User } = await import('../src/models/User');
      const user = await User.findOne({ email: testUser.email });
      expect(user?.is_active).toBe(true);
    });

    it('should verify register OTP with otp payload for API clients', async () => {
      await request(app).post('/api/auth/register').send(testUser);
      const { OtpCode } = await import('../src/models/OtpCode');
      const otp = await OtpCode.findOne({ email: testUser.email, type: 'register' }).sort({ created_at: -1 });

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: testUser.email, otp: otp?.otp, type: 'register' });

      expect(res.status).toBe(200);
    });

    it('should verify manually inserted OTP document using code field', async () => {
      await request(app).post('/api/auth/register').send(testUser);
      const { OtpCode } = await import('../src/models/OtpCode');
      await OtpCode.deleteMany({ email: testUser.email, type: 'register' });
      await OtpCode.collection.insertOne({
        email: testUser.email,
        code: '123456',
        type: 'register',
        expires_at: new Date(Date.now() + 60_000),
        is_used: false,
        created_at: new Date(),
      });

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: testUser.email, code: '123456', type: 'register' });

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/auth/me', () => {
    let token: string;

    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(testUser);
      const { User } = await import('../src/models/User');
      await User.updateOne({ email: testUser.email }, { is_active: true });
      const res = await request(app).post('/api/auth/login').send({ email: testUser.email, password: testUser.password });
      token = res.body.data.accessToken;
    });

    it('should return user profile with valid token', async () => {
      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(testUser.email);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer fake.token.here');
      expect(res.status).toBe(401);
    });
  });

  describe('Forgot/Reset password flow', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(testUser);
      const { User } = await import('../src/models/User');
      await User.updateOne({ email: testUser.email }, { is_active: true });
    });

    it('should send OTP for registered email', async () => {
      const res = await request(app).post('/api/auth/forgot-password').send({ email: testUser.email });
      expect(res.status).toBe(200);
    });

    it('should reject unknown email', async () => {
      const res = await request(app).post('/api/auth/forgot-password').send({ email: 'nobody@test.com' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /health', () => {
    it('should return status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });
});
