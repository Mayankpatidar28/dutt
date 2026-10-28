import { Router } from 'express';
import { getProfile, updateProfile } from './users.controller.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

export default router;
