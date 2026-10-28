import { speechService } from '../../services/speech/speech.service.js';
import { logger } from '../../utils/logger.js';
import prisma from '../../config/db.js';

export async function transcribeAudio(req, res, next) {
  try {
    let buffer = null;
    let mimeType = 'audio/webm';
    let originalname = 'recording.webm';

    // 1. Check if multipart file upload was received via multer
    if (req.file) {
      buffer = req.file.buffer;
      mimeType = req.file.mimetype || 'audio/webm';
      originalname = req.file.originalname || 'recording.webm';

      logger.info('STT audio file received via multipart/form-data', {
        receivedFilename: originalname,
        mimeType,
        fileSize: buffer.length,
      });
    } else if (req.body?.audioBase64) {
      // 2. Base64 payload support
      buffer = Buffer.from(req.body.audioBase64, 'base64');
      mimeType = req.body.mimeType || 'audio/webm';
      originalname = req.body.filename || 'recording.webm';

      logger.info('STT audio received via base64', {
        receivedFilename: originalname,
        mimeType,
        fileSize: buffer.length,
      });
    }

    // Verify non-empty audio
    if (!buffer || buffer.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No audio data received or audio file is empty',
        errorCode: 'EMPTY_AUDIO_FILE',
      });
    }

    // Forward to STT provider
    try {
      const transcript = await speechService.transcribeAudio({
        buffer,
        mimeType,
        originalname,
      });

      if (!transcript || !transcript.trim()) {
        return res.status(200).json({
          success: true,
          transcript: '',
          message: 'No intelligible speech could be recognized in the audio',
        });
      }

      return res.status(200).json({
        success: true,
        transcript: transcript.trim(),
      });
    } catch (sttErr) {
      logger.error('Transcription provider error:', { error: sttErr.message });
      return res.status(502).json({
        success: false,
        message: sttErr.message || 'Speech-to-text service failed',
        errorCode: 'STT_PROVIDER_ERROR',
      });
    }
  } catch (err) {
    next(err);
  }
}

export async function synthesizeSpeech(req, res, next) {
  try {
    const { text, voice } = req.body;
    const config = speechService.getSynthesizerConfig();

    res.json({
      success: true,
      data: {
        text,
        config: {
          ...config,
          selectedVoice: voice || config.voiceName,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function evaluatePronunciation(req, res, next) {
  try {
    const { targetWord, spokenWord, conversationId } = req.body;
    const result = speechService.evaluatePronunciation(targetWord, spokenWord);

    // Record pronunciation score in DB
    if (req.user?.id && targetWord) {
      await prisma.pronunciationScore.create({
        data: {
          userId: req.user.id,
          conversationId: conversationId || null,
          word: targetWord,
          score: result.score,
          feedback: result.feedback,
        },
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
