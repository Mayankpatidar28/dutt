import prisma from '../../config/db.js';
import { NotFoundError } from '../../utils/errors.js';

export class VocabularyService {
  /**
   * Retrieves user vocabulary categorized by status and review urgency.
   */
  async getUserVocabulary(userId, filter = 'ALL') {
    const now = new Date();

    const userVocabList = await prisma.userVocabulary.findMany({
      where: { userId },
      include: { vocabulary: true },
      orderBy: { updatedAt: 'desc' },
    });

    const categorized = {
      new: [],
      learning: [],
      mastered: [],
      reviewToday: [],
    };

    for (const item of userVocabList) {
      const entry = {
        id: item.id,
        vocabularyId: item.vocabularyId,
        word: item.vocabulary.word,
        meaning: item.vocabulary.meaning,
        exampleSentence: item.vocabulary.exampleSentence,
        difficulty: item.vocabulary.difficulty,
        status: item.status,
        masteryScore: item.masteryScore,
        lastReviewedAt: item.lastReviewedAt,
        nextReviewAt: item.nextReviewAt,
      };

      if (item.status === 'NEW') categorized.new.push(entry);
      else if (item.status === 'LEARNING') categorized.learning.push(entry);
      else if (item.status === 'MASTERED') categorized.mastered.push(entry);

      // Check if due for review today (nextReviewAt is past or null for learning)
      if (item.nextReviewAt && new Date(item.nextReviewAt) <= now) {
        categorized.reviewToday.push(entry);
      } else if (item.status === 'LEARNING' && !item.nextReviewAt) {
        categorized.reviewToday.push(entry);
      }
    }

    if (filter === 'NEW') return categorized.new;
    if (filter === 'LEARNING') return categorized.learning;
    if (filter === 'MASTERED') return categorized.mastered;
    if (filter === 'REVIEW_TODAY') return categorized.reviewToday;

    return {
      all: userVocabList.map((uv) => ({
        id: uv.id,
        vocabularyId: uv.vocabularyId,
        word: uv.vocabulary.word,
        meaning: uv.vocabulary.meaning,
        exampleSentence: uv.vocabulary.exampleSentence,
        difficulty: uv.vocabulary.difficulty,
        status: uv.status,
        masteryScore: uv.masteryScore,
        lastReviewedAt: uv.lastReviewedAt,
        nextReviewAt: uv.nextReviewAt,
      })),
      counts: {
        total: userVocabList.length,
        new: categorized.new.length,
        learning: categorized.learning.length,
        mastered: categorized.mastered.length,
        reviewToday: categorized.reviewToday.length,
      },
      lists: categorized,
    };
  }

  /**
   * Spaced repetition review update.
   * Promotes mastery based on correct answers and schedules next review.
   */
  async reviewWord(userId, userVocabularyId, remembered = true) {
    const entry = await prisma.userVocabulary.findFirst({
      where: { id: userVocabularyId, userId },
    });

    if (!entry) {
      throw new NotFoundError('Vocabulary entry not found');
    }

    const now = new Date();
    let newScore = entry.masteryScore;
    let newStatus = entry.status;
    let nextReviewDays = 1;

    if (remembered) {
      newScore = Math.min(100, entry.masteryScore + 25);
      if (newScore >= 75) {
        newStatus = 'MASTERED';
        nextReviewDays = 7;
      } else {
        newStatus = 'LEARNING';
        nextReviewDays = Math.max(2, Math.round(newScore / 20));
      }
    } else {
      newScore = Math.max(0, entry.masteryScore - 15);
      newStatus = 'LEARNING';
      nextReviewDays = 1;
    }

    const nextReviewAt = new Date(now.getTime() + nextReviewDays * 24 * 60 * 60 * 1000);

    const updated = await prisma.userVocabulary.update({
      where: { id: userVocabularyId },
      data: {
        masteryScore: newScore,
        status: newStatus,
        lastReviewedAt: now,
        nextReviewAt,
      },
      include: { vocabulary: true },
    });

    return updated;
  }
}

export const vocabularyService = new VocabularyService();
