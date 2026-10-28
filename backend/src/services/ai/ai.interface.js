/**
 * Abstract AI Provider Interface
 * Every AI provider (Mock, Gemini, OpenAI, Groq) must adhere to this interface.
 */
export class AIProvider {
  /**
   * Generates a conversational response along with optional grammar corrections, vocabulary extraction, and follow-up question.
   * @param {Object} params
   * @param {Array} params.messages - History of conversation messages
   * @param {Object} params.context - User profile, English level, goal, recent mistakes, mode, topic
   * @returns {Promise<{
   *   reply: string,
   *   correction: { hasCorrection: boolean, original?: string, corrected?: string, explanation?: string, topic?: string } | null,
   *   vocabulary: Array<{ word: string, meaning: string, example: string }>,
   *   followUpQuestion?: string,
   *   difficulty: string
   * }>}
   */
  async chat({ messages, context }) {
    throw new Error('chat() must be implemented by subclass');
  }

  /**
   * Analyzes text specifically for grammar mistakes, severity, and explanation.
   * @param {Object} params
   * @param {string} params.text
   * @param {string} params.userLevel
   * @returns {Promise<Array<{
   *   original: string,
   *   corrected: string,
   *   explanation: string,
   *   topic: string,
   *   severity: 'LOW' | 'MEDIUM' | 'HIGH'
   * }>>}
   */
  async analyzeGrammar({ text, userLevel }) {
    throw new Error('analyzeGrammar() must be implemented by subclass');
  }

  /**
   * Evaluates speaking ability and yields level estimation and breakdown.
   * @param {Object} params
   * @param {string} params.transcript
   * @param {Object} params.context
   * @returns {Promise<{
   *   speakingScore: number,
   *   grammarScore: number,
   *   vocabularyScore: number,
   *   pronunciationScore: number,
   *   overallScore: number,
   *   estimatedLevel: string,
   *   strengths: string[],
   *   weaknesses: string[],
   *   recommendations: string[]
   * }>}
   */
  async evaluateSpeaking({ transcript, context }) {
    throw new Error('evaluateSpeaking() must be implemented by subclass');
  }

  /**
   * Extracts useful vocabulary from user text or conversation text.
   * @param {Object} params
   * @param {string} params.text
   * @param {string} params.userLevel
   * @returns {Promise<Array<{ word: string, meaning: string, example: string, difficulty: string }>>}
   */
  async extractVocabulary({ text, userLevel }) {
    throw new Error('extractVocabulary() must be implemented by subclass');
  }

  /**
   * Generates a personalized practice lesson based on user's weak areas and current level.
   * @param {Object} params
   * @param {string} params.topic
   * @param {string} params.level
   * @param {Array} params.userMistakes
   * @returns {Promise<Object>}
   */
  async generateLesson({ topic, level, userMistakes }) {
    throw new Error('generateLesson() must be implemented by subclass');
  }
}
