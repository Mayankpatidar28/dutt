import { Router } from 'express';
import { startAssessment, submitAssessment, getAssessmentResult } from './assessment.controller.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.post('/start', startAssessment);
router.post('/submit', submitAssessment);
router.get('/result', getAssessmentResult);

export default router;
