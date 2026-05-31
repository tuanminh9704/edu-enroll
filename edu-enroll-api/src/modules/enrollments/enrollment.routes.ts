import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import * as schemas from './enrollment.schema';
import * as controller from './enrollment.controller';

const router = Router();

router.use(authenticate);

router.get('/', controller.getMyEnrollment);
router.post('/sign-policy', validate(schemas.signPolicySchema), controller.signPolicy);
router.get('/payment-url', controller.getPaymentUrl);
router.post('/form', validate(schemas.studentFormSchema), controller.submitForm);
router.get('/exam-schedules', controller.getExamSchedules);
router.post('/exam/register', validate(schemas.registerExamSchema), controller.registerExam);
router.post('/exam/skip', controller.skipExam);
router.get('/exam/result', controller.getExamResult);
router.post('/exam/advance', controller.advanceToStep5);
router.get('/programs', controller.getAvailablePrograms);
router.post('/program/select', validate(schemas.selectProgramSchema), controller.selectProgram);
router.post('/original-docs', validate(schemas.submitOriginalDocsSchema), controller.submitOriginalDocs);
router.post('/recheck', controller.submitRecheck);
router.get('/recheck', controller.getMyRecheck);
router.get('/interviews', controller.getMyInterviews);
router.post('/interviews/:id/respond', controller.respondInterview);
router.get('/invoices', controller.getMyInvoices);

export default router;
