import request from 'supertest';
import app from '../src/index';
import { setupDB, teardownDB, clearDB } from './mongoHelper';
import { User } from '../src/models/User';
import { TrainingProgram } from '../src/models/TrainingProgram';
import { ExamSchedule } from '../src/models/ExamSchedule';
import { EnrollmentForm } from '../src/models/EnrollmentForm';
import { EnrollmentLog } from '../src/models/EnrollmentLog';
import { ExamRegistration } from '../src/models/ExamRegistration';
import bcrypt from 'bcryptjs';

beforeAll(setupDB);
afterAll(teardownDB);
afterEach(clearDB);

const studentUser = {
  email: 'student@apex-language.vn',
  password: 'password123',
  phone: '0901234568',
  full_name: 'Student Test',
};

async function createAdmin(): Promise<string> {
  const hash = await bcrypt.hash('Admin@1234', 10);
  await User.create({
    email: 'admin@apex-language.vn',
    password_hash: hash,
    full_name: 'Admin Test',
    role: 'admin',
    is_active: true,
  });
  const res = await request(app).post('/api/auth/login').send({ email: 'admin@apex-language.vn', password: 'Admin@1234' });
  return res.body.data.accessToken;
}

async function registerAndLogin(): Promise<string> {
  await request(app).post('/api/auth/register').send(studentUser);
  await User.updateOne({ email: studentUser.email }, { is_active: true });
  const res = await request(app).post('/api/auth/login').send({ email: studentUser.email, password: studentUser.password });
  return res.body.data.accessToken;
}

describe('Admin API', () => {
  describe('Stats endpoint', () => {
    it('GET /api/admin/stats returns stats for admin', async () => {
      const token = await createAdmin();
      const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('totalUsers');
      expect(res.body.data).toHaveProperty('totalEnrollments');
      expect(res.body.data).toHaveProperty('totalRevenue');
    });
  });

  describe('Users management', () => {
    it('GET /api/admin/users returns paginated users', async () => {
      const token = await createAdmin();
      await registerAndLogin();
      const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data).toHaveProperty('total');
    });

    it('PATCH /api/admin/users/:id/toggle-active toggles user status', async () => {
      const adminToken = await createAdmin();
      await registerAndLogin();
      const userRes = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${adminToken}`);
      const student = userRes.body.data.data.find((u: { role: string }) => u.role === 'student');
      expect(student).toBeDefined();

      const res = await request(app)
        .patch(`/api/admin/users/${student._id}/toggle-active`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('is_active');
    });

    it('PATCH /api/admin/users/:id/role changes user role', async () => {
      const adminToken = await createAdmin();
      await registerAndLogin();
      const userRes = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${adminToken}`);
      const student = userRes.body.data.data.find((u: { role: string }) => u.role === 'student');

      const res = await request(app)
        .patch(`/api/admin/users/${student._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'staff' });
      expect(res.status).toBe(200);
    });

    it('PATCH /api/admin/users/:id/role rejects invalid role', async () => {
      const adminToken = await createAdmin();
      await registerAndLogin();
      const userRes = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${adminToken}`);
      const student = userRes.body.data.data.find((u: { role: string }) => u.role === 'student');

      const res = await request(app)
        .patch(`/api/admin/users/${student._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'super_admin' });
      expect(res.status).toBe(400);
    });
  });

  describe('Programs management', () => {
    it('POST /api/admin/programs creates a program', async () => {
      const token = await createAdmin();
      const res = await request(app)
        .post('/api/admin/programs')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Program',
          language: 'english',
          level_code: 'B1',
          duration_months: 4,
          sessions_per_week: 3,
          tuition_fee: 4500000,
          is_active: true,
        });
      expect(res.status).toBe(201);
    });

    it('GET /api/admin/programs returns all programs', async () => {
      const token = await createAdmin();
      await TrainingProgram.create({ name: 'P1', language: 'english', level_code: 'A1', duration_months: 3, sessions_per_week: 3, tuition_fee: 3600000, is_active: true });
      const res = await request(app).get('/api/admin/programs').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/admin/export/programs returns CSV', async () => {
      const token = await createAdmin();
      await TrainingProgram.create({ name: 'P1', language: 'english', level_code: 'A1', duration_months: 3, sessions_per_week: 3, tuition_fee: 3600000, is_active: true });
      const res = await request(app).get('/api/admin/export/programs').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.text).toContain('level_code');
      expect(res.text).toContain('P1');
    });

    it('POST /api/admin/import/programs imports CSV rows', async () => {
      const token = await createAdmin();
      const csv = 'name,language,level_code,duration_months,sessions_per_week,tuition_fee,min_score,is_active\nImported Program,english,B2,4,3,5200000,70,true\n';
      const res = await request(app)
        .post('/api/admin/import/programs')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from(csv), 'programs.csv');
      expect(res.status).toBe(200);
      expect(res.body.data.created).toBe(1);
      expect(await TrainingProgram.findOne({ level_code: 'B2', language: 'english' })).toBeTruthy();
    });

    it('PUT /api/admin/programs/:id updates a program', async () => {
      const token = await createAdmin();
      const p = await TrainingProgram.create({ name: 'P1', language: 'english', level_code: 'A1', duration_months: 3, sessions_per_week: 3, tuition_fee: 3600000, is_active: true });
      const res = await request(app)
        .put(`/api/admin/programs/${p._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ tuition_fee: 4000000 });
      expect(res.status).toBe(200);
    });

    it('DELETE /api/admin/programs/:id deactivates a program', async () => {
      const token = await createAdmin();
      const p = await TrainingProgram.create({ name: 'P1', language: 'english', level_code: 'A1', duration_months: 3, sessions_per_week: 3, tuition_fee: 3600000, is_active: true });
      const res = await request(app).delete(`/api/admin/programs/${p._id}`).set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      const updated = await TrainingProgram.findById(p._id);
      expect(updated?.is_active).toBe(false);
    });
  });

  describe('Exam schedules management', () => {
    it('POST /api/admin/exam-schedules creates a schedule', async () => {
      const token = await createAdmin();
      const res = await request(app)
        .post('/api/admin/exam-schedules')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Exam',
          language: 'english',
          exam_date: new Date(Date.now() + 86400000 * 7).toISOString(),
          location: 'Room 101',
          format: 'offline',
          max_slots: 30,
          status: 'open',
        });
      expect(res.status).toBe(201);
    });

    it('GET /api/admin/exam-schedules returns list', async () => {
      const token = await createAdmin();
      const res = await request(app).get('/api/admin/exam-schedules').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('POST /api/admin/import/exam-schedules imports CSV rows', async () => {
      const token = await createAdmin();
      const csv = 'title,language,exam_date,location,format,max_slots,status\nImported Exam,english,2026-07-10,Room 201,offline,25,open\n';
      const res = await request(app)
        .post('/api/admin/import/exam-schedules')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from(csv), 'exam-schedules.csv');
      expect(res.status).toBe(200);
      expect(res.body.data.created).toBe(1);
      expect(await ExamSchedule.findOne({ title: 'Imported Exam' })).toBeTruthy();
    });

    it('POST /api/admin/exam-schedules/:id/close closes a schedule', async () => {
      const token = await createAdmin();
      const s = await ExamSchedule.create({
        title: 'Test', language: 'english', exam_date: new Date(), location: 'Room 1', format: 'offline', max_slots: 30, registered_slots: 0, status: 'open',
      });
      const res = await request(app)
        .post(`/api/admin/exam-schedules/${s._id}/close`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it('POST /api/admin/exam-schedules/:id/assign-by-date assigns students using the displayed exam date', async () => {
      const adminToken = await createAdmin();
      const student = await User.create({
        email: 'date-student@apex-language.vn',
        password_hash: await bcrypt.hash('password123', 10),
        full_name: 'Date Student',
        role: 'student',
        is_active: true,
      });
      const schedule = await ExamSchedule.create({
        title: 'Placement Test',
        language: 'english',
        exam_date: new Date('2026-05-31T17:00:00.000Z'),
        location: 'Room 1',
        format: 'offline',
        max_slots: 30,
        registered_slots: 0,
        status: 'open',
      });
      const enrollment = await EnrollmentForm.create({
        user_id: student._id,
        current_step: 4,
        status: 'step_4',
        language: 'english',
        level: 'B1',
        signed_policy: true,
        payment_status: 'success',
        exam_required: true,
        exam_confirmed: false,
        preferred_exam_date: '2026-06-01',
      });

      const res = await request(app)
        .post(`/api/admin/exam-schedules/${schedule._id}/assign-by-date`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.assigned).toBe(1);
      const registration = await ExamRegistration.findOne({ enrollment_id: enrollment._id, schedule_id: schedule._id });
      expect(registration).toBeTruthy();
      const updatedEnrollment = await EnrollmentForm.findById(enrollment._id);
      expect(updatedEnrollment?.exam_schedule_id?.toString()).toBe(schedule._id.toString());
    });
  });

  describe('Exam scores management', () => {
    it('POST /api/admin/exam-registrations/:registrationId/score syncs score to enrollment', async () => {
      const adminToken = await createAdmin();
      await registerAndLogin();
      const student = await User.findOne({ email: studentUser.email });
      expect(student).toBeTruthy();

      const schedule = await ExamSchedule.create({
        title: 'Placement Test',
        language: 'english',
        exam_date: new Date(),
        location: 'Room 1',
        format: 'offline',
        max_slots: 30,
        registered_slots: 1,
        status: 'open',
      });
      const enrollment = await EnrollmentForm.create({
        user_id: student!._id,
        current_step: 4,
        status: 'step_4',
        language: 'english',
        level: 'B1',
        signed_policy: true,
        payment_status: 'success',
        exam_required: true,
        exam_confirmed: true,
        exam_schedule_id: schedule._id,
      });
      const registration = await ExamRegistration.create({
        user_id: student!._id,
        enrollment_id: enrollment._id,
        schedule_id: schedule._id,
        exam_code: 'EN123456',
        status: 'confirmed',
      });

      const res = await request(app)
        .post(`/api/admin/exam-registrations/${registration._id}/score`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ score: 82, pass_threshold: 50 });

      expect(res.status).toBe(200);
      const updatedEnrollment = await EnrollmentForm.findById(enrollment._id);
      expect(updatedEnrollment?.exam_score).toBe(82);
      expect(updatedEnrollment?.exam_level_passed).toBe('B2');
      expect(updatedEnrollment?.exam_pass_status).toBe('passed');
      expect(updatedEnrollment?.exam_pass_threshold).toBe(50);
      expect(updatedEnrollment?.exam_scored_at).toBeTruthy();

      const log = await EnrollmentLog.findOne({ enrollment_id: enrollment._id, action: 'EXAM_SCORE_ENTERED' });
      expect(log?.new_value).toBe('82/B2/passed');
    });

    it('POST /api/admin/exam-registrations/:registrationId/score marks failed when below threshold', async () => {
      const adminToken = await createAdmin();
      await registerAndLogin();
      const student = await User.findOne({ email: studentUser.email });
      const schedule = await ExamSchedule.create({
        title: 'Placement Test',
        language: 'english',
        exam_date: new Date(),
        location: 'Room 1',
        format: 'offline',
        max_slots: 30,
        registered_slots: 1,
        status: 'open',
      });
      const enrollment = await EnrollmentForm.create({
        user_id: student!._id,
        current_step: 4,
        status: 'step_4',
        language: 'english',
        level: 'B1',
        signed_policy: true,
        payment_status: 'success',
        exam_required: true,
        exam_confirmed: true,
        exam_schedule_id: schedule._id,
      });
      const registration = await ExamRegistration.create({
        user_id: student!._id,
        enrollment_id: enrollment._id,
        schedule_id: schedule._id,
        exam_code: 'EN654321',
        status: 'confirmed',
      });

      const res = await request(app)
        .post(`/api/admin/exam-registrations/${registration._id}/score`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ score: 45, pass_threshold: 50 });

      expect(res.status).toBe(200);
      const updatedEnrollment = await EnrollmentForm.findById(enrollment._id);
      expect(updatedEnrollment?.exam_score).toBe(45);
      expect(updatedEnrollment?.exam_pass_status).toBe('failed');
    });
  });

  describe('Export endpoints', () => {
    it('GET /api/admin/export/enrollments returns CSV', async () => {
      const token = await createAdmin();
      const res = await request(app).get('/api/admin/export/enrollments').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
    });

    it('GET /api/admin/export/users returns CSV', async () => {
      const token = await createAdmin();
      const res = await request(app).get('/api/admin/export/users').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
    });
  });

  describe('Enrollments management', () => {
    it('GET /api/admin/enrollments returns paginated list', async () => {
      const token = await createAdmin();
      const res = await request(app).get('/api/admin/enrollments').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('GET /api/admin/enrollments supports status filter', async () => {
      const token = await createAdmin();
      const res = await request(app)
        .get('/api/admin/enrollments?status=completed')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it('GET /api/admin/enrollments supports search query', async () => {
      const token = await createAdmin();
      const res = await request(app)
        .get('/api/admin/enrollments?search=nguyen')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });

  describe('Student cannot access admin endpoints', () => {
    it('GET /api/admin/stats returns 403 for student', async () => {
      const token = await registerAndLogin();
      expect((await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${token}`)).status).toBe(403);
    });
  });
});
