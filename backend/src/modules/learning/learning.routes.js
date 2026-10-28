import { Router } from 'express';
import {
  getDashboard,
  getRecommendations,
  getMistakes,
  getVocabulary,
  reviewVocabulary,
  getLessons,
} from './learning.controller.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/dashboard', getDashboard);
router.get('/recommendations', getRecommendations);
router.get('/mistakes', getMistakes);
router.get('/vocabulary', getVocabulary);
router.post('/vocabulary/:id/review', reviewVocabulary);
router.get('/lessons', getLessons);

export default router;
