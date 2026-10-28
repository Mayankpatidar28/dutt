import prisma from '../../config/db.js';
import { aiService } from './ai.service.js';

export class GrammarService {
  /**
   * Returns aggregated mistake statistics for a user grouped by topic.
   */
  async getUserMistakesGrouped(userId) {
    const mistakes = await prisma.grammarMistake.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const groups = {};
    for (const m of mistakes) {
      if (!groups[m.grammarTopic]) {
        groups[m.grammarTopic] = {
          topic: m.grammarTopic,
          displayName: m.grammarTopic
            .split('_')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' '),
          count: 0,
          examples: [],
        };
      }
      groups[m.grammarTopic].count += 1;
      if (groups[m.grammarTopic].examples.length < 5) {
        groups[m.grammarTopic].examples.push({
          id: m.id,
          original: m.originalText,
          corrected: m.correctedText,
          explanation: m.explanation,
          severity: m.severity,
          createdAt: m.createdAt,
        });
      }
    }

    // Convert object to sorted array by count descending
    return Object.values(groups).sort((a, b) => b.count - a.count);
  }

  /**
   * Generates a targeted practice lesson or conversation prompt for a specific grammar mistake topic.
   */
  async getTopicPracticeLesson(userId, topic) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { englishLevel: true },
    });

    const recentTopicMistakes = await prisma.grammarMistake.findMany({
      where: { userId, grammarTopic: topic },
      take: 5,
    });

    const lesson = await aiService.generateLesson({
      topic,
      level: user?.englishLevel || 'B1',
      userMistakes: recentTopicMistakes.map((m) => ({
        original: m.originalText,
        corrected: m.correctedText,
      })),
    });

    return lesson;
  }
}

export const grammarService = new GrammarService();
