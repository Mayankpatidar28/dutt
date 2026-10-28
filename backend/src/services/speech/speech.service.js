import { logger } from '../../utils/logger.js';
import { env } from '../../config/env.js';

export class SpeechToTextProvider {
  /**
   * Transcribes an audio buffer to text using configured external STT provider (Gemini, Groq, OpenAI).
   * @param {Object} params
   * @param {Buffer} params.buffer
   * @param {string} params.mimeType
   * @param {string} params.originalname
   * @returns {Promise<string>}
   */
  async transcribe({ buffer, mimeType, originalname }) {
    if (!buffer || buffer.length === 0) {
      throw new Error('Empty audio buffer received');
    }

    // Try Gemini 1.5 Flash if GEMINI_API_KEY is available
    if (env.GEMINI_API_KEY) {
      logger.info('Forwarding audio to Gemini 1.5 STT provider');
      const base64Audio = buffer.toString('base64');
      const cleanMime = mimeType ? mimeType.split(';')[0] : 'audio/webm';

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: 'Accurately transcribe the spoken English words in this audio. Return ONLY the verbatim transcribed English text with no additional explanations, tags, or markdown.',
                  },
                  {
                    inlineData: {
                      mimeType: cleanMime,
                      data: base64Audio,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
            },
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini STT failed with status ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const transcript = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      return transcript;
    }

    // Try Groq Whisper if GROQ_API_KEY is available
    if (env.GROQ_API_KEY) {
      logger.info('Forwarding audio to Groq Whisper STT provider');
      const formData = new FormData();
      const blob = new Blob([buffer], { type: mimeType || 'audio/webm' });
      formData.append('file', blob, originalname || 'recording.webm');
      formData.append('model', 'whisper-large-v3-turbo');
      formData.append('language', 'en');

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.GROQ_API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq Whisper STT failed: ${response.status} ${errText}`);
      }

      const data = await response.json();
      return data.text?.trim() || '';
    }

    // Try OpenAI Whisper if OPENAI_API_KEY is available
    if (env.OPENAI_API_KEY) {
      logger.info('Forwarding audio to OpenAI Whisper STT provider');
      const formData = new FormData();
      const blob = new Blob([buffer], { type: mimeType || 'audio/webm' });
      formData.append('file', blob, originalname || 'recording.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI Whisper STT failed: ${response.status} ${errText}`);
      }

      const data = await response.json();
      return data.text?.trim() || '';
    }

    // No external provider configured
    throw new Error(
      'No external speech-to-text API key is configured (GEMINI_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY). Use browser Web Speech API or configure an API key in .env.'
    );
  }
}

/**
 * Intelligent Speech Service providing audio utilities, pronunciation scoring,
 * and text-to-speech phonetic cues for Dutt.
 */
export class SpeechService {
  constructor() {
    this.sttProvider = new SpeechToTextProvider();
  }

  async transcribeAudio(fileOrBufferInfo) {
    return await this.sttProvider.transcribe(fileOrBufferInfo);
  }

  /**
   * Pronunciation accuracy scoring using Levenshtein distance & phonetic heuristics
   */
  evaluatePronunciation(expectedWord, spokenWord) {
    if (!expectedWord || !spokenWord) {
      return { score: 70, feedback: 'Keep practicing clear enunciation' };
    }

    const exp = expectedWord.toLowerCase().trim();
    const act = spokenWord.toLowerCase().trim();

    if (exp === act) {
      return { score: 98, feedback: 'Perfect pronunciation and clear syllable emphasis!' };
    }

    // Levenshtein similarity
    const distance = this.levenshtein(exp, act);
    const maxLen = Math.max(exp.length, act.length);
    const similarity = Math.max(0, Math.round((1 - distance / maxLen) * 100));

    let feedback = 'Good attempt. Pay attention to vowel clarity.';
    if (similarity > 80) feedback = 'Very close! Focus slightly on the final consonant.';
    else if (similarity < 50) feedback = 'Try breaking the word into syllables and repeating slowly.';

    return {
      word: expectedWord,
      score: similarity,
      feedback,
    };
  }

  levenshtein(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  /**
   * Backend synthesizer metadata for client speech synthesis options
   */
  getSynthesizerConfig() {
    return {
      voiceName: 'Dutt (Indian English Natural)',
      pitch: 1.0,
      rate: 0.95,
      lang: 'en-IN',
      supportedLanguages: ['en-IN', 'en-US', 'en-GB'],
    };
  }
}

export const speechService = new SpeechService();
