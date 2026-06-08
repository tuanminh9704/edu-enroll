import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import * as controller from './admin.controller';

const router = Router();
const adminOnly = [authenticate, authorize(['admin', 'super_admin'])];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get('/stats', ...adminOnly, controller.getStats);
router.get('/users', ...adminOnly, controller.getUsers);
router.get('/enrollments', ...adminOnly, controller.getEnrollments);
router.put('/enrollments/:id/status', ...adminOnly, controller.updateEnrollmentStatus);
router.get('/exam-schedules', ...adminOnly, controller.getExamSchedules);
router.post('/exam-schedules', ...adminOnly, controller.createExamSchedule);
router.get('/exam-schedules/:id/rooms', ...adminOnly, controller.getExamRooms);
router.post('/exam-schedules/:id/rooms', ...adminOnly, controller.createExamRoom);
router.post('/exam-schedules/:id/auto-create-rooms', ...adminOnly, controller.autoCreateExamRooms);
router.post('/exam-schedules/:id/auto-assign-rooms', ...adminOnly, controller.autoAssignExamRooms);
router.post('/exam-schedules/:id/setup-exam-process', ...adminOnly, controller.setupExamProcess);
router.post('/exam-schedules/:id/generate-bags', ...adminOnly, controller.generateExamBagsAndAnonymousCodes);
router.post('/exam-rooms/publish', ...adminOnly, controller.publishExamRooms);
router.post('/exam-scores', ...adminOnly, controller.enterExamScore);
router.get('/programs', ...adminOnly, controller.getPrograms);
router.post('/programs', ...adminOnly, controller.createProgram);
router.put('/programs/:id', ...adminOnly, controller.updateProgram);
router.delete('/programs/:id', ...adminOnly, controller.deleteProgram);
router.get('/classes', ...adminOnly, controller.getClasses);
router.post('/classes', ...adminOnly, controller.createClass);
router.put('/classes/:id', ...adminOnly, controller.updateClass);
router.get('/classes/:id/students', ...adminOnly, controller.getClassStudents);
router.get('/classes/:id/eligible-enrollments', ...adminOnly, controller.getEligibleClassEnrollments);
router.post('/classes/:id/assign-enrollment', ...adminOnly, controller.assignEnrollmentToClass);
router.post('/classes/:id/auto-assign', ...adminOnly, controller.autoAssignClassByLevel);
router.delete('/classes/:id/students/:enrollmentId', ...adminOnly, controller.removeEnrollmentFromClass);

router.patch('/users/:id/toggle-active', ...adminOnly, controller.toggleUserActive);
router.patch('/users/:id/role', ...adminOnly, controller.changeUserRole);
router.get('/export/enrollments', ...adminOnly, controller.exportEnrollments);
router.get('/export/users', ...adminOnly, controller.exportUsers);
router.get('/export/programs', ...adminOnly, controller.exportPrograms);
router.get('/export/exam-schedules', ...adminOnly, controller.exportExamSchedules);
router.get('/export/exam-scores', ...adminOnly, controller.exportExamScores);
router.post('/import/users', ...adminOnly, upload.single('file'), controller.importUsers);
router.post('/import/programs', ...adminOnly, upload.single('file'), controller.importPrograms);
router.post('/import/exam-schedules', ...adminOnly, upload.single('file'), controller.importExamSchedules);
router.post('/import/exam-scores', ...adminOnly, upload.single('file'), controller.importExamScores);

router.post('/exam-schedules/:id/close', ...adminOnly, controller.closeExamSchedule);
router.get('/exam-schedules/:id/eligible-enrollments', ...adminOnly, controller.getEligibleExamEnrollments);
router.post('/exam-schedules/:id/assign-enrollment', ...adminOnly, controller.assignEnrollmentToExam);
router.post('/exam-schedules/:id/assign-by-date', ...adminOnly, controller.assignEnrollmentsByExamDate);
router.post('/exam-schedules/:id/sync-scores', ...adminOnly, controller.syncExamScoresBySchedule);
router.post('/exam-registrations/:registrationId/process', ...adminOnly, controller.updateExamProcess);
router.post('/exam-registrations/:registrationId/score-draft', ...adminOnly, controller.saveExamScoreDraft);
router.post('/exam-registrations/:registrationId/sync-score', ...adminOnly, controller.syncExamScore);
router.post('/exam-registrations/:registrationId/score', ...adminOnly, controller.enterExamScoreForReg);
router.get('/exam-registrations', ...adminOnly, controller.getExamRegistrations);
router.get('/enrollments/:id/logs', ...adminOnly, controller.getEnrollmentLogs);
router.post('/notifications/broadcast', ...adminOnly, controller.broadcastNotification);
router.get('/rechecks', ...adminOnly, controller.getRechecks);
router.put('/rechecks/:id', ...adminOnly, controller.resolveRecheck);
router.get('/interviews', ...adminOnly, controller.getInterviews);
router.post('/interviews', ...adminOnly, controller.createInterview);
router.patch('/interviews/:id/status', ...adminOnly, controller.updateInterviewStatus);
router.get('/invoices', ...adminOnly, controller.getInvoices);
router.patch('/invoices/:id/status', ...adminOnly, controller.updateInvoiceStatus);
router.get('/banners', ...adminOnly, controller.getBanners);
router.post('/banners', ...adminOnly, controller.createBanner);
router.put('/banners/:id', ...adminOnly, controller.updateBanner);
router.delete('/banners/:id', ...adminOnly, controller.deleteBanner);
router.get('/news', ...adminOnly, controller.getNews);
router.post('/news', ...adminOnly, controller.createNews);
router.put('/news/:id', ...adminOnly, controller.updateNews);
router.delete('/news/:id', ...adminOnly, controller.deleteNews);
router.get('/configs', ...adminOnly, controller.getConfigs);
router.post('/configs', ...adminOnly, controller.upsertConfig);

export default router;
