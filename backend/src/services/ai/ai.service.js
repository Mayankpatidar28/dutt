import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { MockAIProvider } from './mock.provider.js';
import { GeminiProvider } from './gemini.provider.js';

class AIService {
  constructor() {
    this.fallbackProvider = new MockAIProvider();
    this.provider = this.fallbackProvider;
    this.initializeProvider();
  }

  initializeProvider() {
    const selected = (env.AI_PROVIDER || 'mock').toLowerCase();
    logger.info(`Initializing AI Provider: [${selected}]`);

    if (selected === 'gemini' && env.GEMINI_API_KEY) {
      this.provider = new GeminiProvider(env.GEMINI_API_KEY);
    } else {
      // Default to intelligent fallback provider
      this.provider = this.fallbackProvider;
      if (selected !== 'mock') {
        logger.warn(`AI Provider "${selected}" requested but API key not supplied. Using intelligent MockAIProvider fallback.`);
      }
    }
  }

  async chat({ messages, context = {} }) {
    const startTime = Date.now();
    try {
      const result = await this.provider.chat({ messages, context });
      logger.info('AI Chat response generated', { durationMs: Date.now() - startTime, provider: this.provider.name });
      return this.validateChatResponse(result);
    } catch (err) {
      logger.warn(`Primary AI provider failed: ${err.message}. Falling back to internal engine.`);
      const result = await this.fallbackProvider.chat({ messages, context });
      return this.validateChatResponse(result);
    }
  }

  async analyzeGrammar({ text, userLevel = 'B1' }) {
    try {
      return await this.provider.analyzeGrammar({ text, userLevel });
    } catch (err) {
      logger.warn(`Primary AI grammar analysis failed: ${err.message}. Falling back.`);
      return await this.fallbackProvider.analyzeGrammar({ text, userLevel });
    }
  }

  async evaluateSpeaking({ transcript, context = {} }) {
    try {
      return await this.provider.evaluateSpeaking({ transcript, context });
    } catch (err) {
      logger.warn(`Primary AI speaking evaluation failed: ${err.message}. Falling back.`);
      return await this.fallbackProvider.evaluateSpeaking({ transcript, context });
    }
  }

  async extractVocabulary({ text, userLevel = 'B1' }) {
    try {
      return await this.provider.extractVocabulary({ text, userLevel });
    } catch (err) {
      return await this.fallbackProvider.extractVocabulary({ text, userLevel });
    }
  }

  async generateLesson({ topic, level = 'B1', userMistakes = [] }) {
    try {
      return await this.provider.generateLesson({ topic, level, userMistakes });
    } catch (err) {
      return await this.fallbackProvider.generateLesson({ topic, level, userMistakes });
    }
  }

  validateChatResponse(res) {
    if (!res || typeof res !== 'object') {
      return {
        reply: "I'm here to assist you. Could you share a bit more context about what you'd like to do?",
        correction: { hasCorrection: false },
        vocabulary: [],
        followUpQuestion: 'What would you like to work on?',
        difficulty: 'B1',
        toolCall: null,
      };
    }

    return {
      reply: res.reply || "I'm here to assist you. Could you share a bit more context?",
      correction: res.correction && res.correction.hasCorrection
        ? {
            hasCorrection: true,
            original: res.correction.original || '',
            corrected: res.correction.corrected || '',
            explanation: res.correction.explanation || '',
            topic: res.correction.topic || 'general',
          }
        : { hasCorrection: false },
      vocabulary: Array.isArray(res.vocabulary) ? res.vocabulary : [],
      followUpQuestion: res.followUpQuestion || '',
      difficulty: res.difficulty || 'B1',
      toolCall: res.toolCall || null,
    };
  }
}

export const aiService = new AIService();
