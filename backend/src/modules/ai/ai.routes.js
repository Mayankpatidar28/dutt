import { Router } from 'express';
import { chat, correct, evaluate, extractVocab } from './ai.controller.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.post('/chat', chat);
router.post('/correct', correct);
router.post('/evaluate', evaluate);
router.post('/vocabulary', extractVocab);

export default router;
