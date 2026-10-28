import { Router } from 'express';
import { getProgressSummary, getWeeklyProgress, getMonthlyProgress } from './progress.controller.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getProgressSummary);
router.get('/weekly', getWeeklyProgress);
router.get('/monthly', getMonthlyProgress);

export default router;
