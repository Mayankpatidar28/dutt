import { Router } from 'express';
import multer from 'multer';
import { transcribeAudio, synthesizeSpeech, evaluatePronunciation } from './voice.controller.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max
  },
});

const router = Router();

router.use(authenticateToken);

router.post('/transcribe', upload.single('audio'), transcribeAudio);
router.post('/synthesize', synthesizeSpeech);
router.post('/pronunciation', evaluatePronunciation);

export default router;
