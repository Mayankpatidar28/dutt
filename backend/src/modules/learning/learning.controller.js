import prisma from '../../config/db.js';
import { grammarService } from '../../services/ai/grammar.service.js';
import { vocabularyService } from '../../services/ai/vocabulary.service.js';

export async function getDashboard(req, res, next) {
  try {
    const userId = req.user.id;

    // Fetch user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    // Fetch latest learning progress record or defaults
    const today = new Date().toISOString().split('T')[0];
    const todayProgress = await prisma.learningProgress.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    const latestProgress = await prisma.learningProgress.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch recent conversations
    const recentConversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 5,
      include: {
        _count: { select: { messages: true, grammarMistakes: true } },
      },
    });

    // Fetch top mistakes
    const groupedMistakes = await grammarService.getUserMistakesGrouped(userId);

    // Fetch recommended lesson
    const topWeakTopic = groupedMistakes[0]?.topic || 'past_tense';
    const recommendedLesson = await prisma.lesson.findFirst({
      where: {
        level: user.englishLevel,
      },
    }) || {
      id: 'rec_1',
      title: `Practice ${topWeakTopic.replace(/_/g, ' ').toUpperCase()}`,
      description: `Targeted practice to eliminate recurring ${topWeakTopic.replace(/_/g, ' ')} mistakes in everyday conversation.`,
      category: 'Grammar',
      level: user.englishLevel,
    };

    // Calculate vocabulary summary
    const vocabCounts = await prisma.userVocabulary.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
    });
    const vocabSummary = {
      new: 0,
      learning: 0,
      mastered: 0,
    };
    for (const v of vocabCounts) {
      if (v.status === 'NEW') vocabSummary.new = v._count;
      if (v.status === 'LEARNING') vocabSummary.learning = v._count;
      if (v.status === 'MASTERED') vocabSummary.mastered = v._count;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          englishLevel: user.englishLevel,
          targetLevel: user.targetLevel,
          dailyGoalMinutes: user.dailyGoalMinutes,
          streak: user.streak,
          nativeLanguage: user.profile?.nativeLanguage || 'Hindi',
          learningGoal: user.profile?.learningGoal || 'General Fluency',
        },
        scores: {
          speaking: latestProgress?.speakingScore || 72,
          grammar: latestProgress?.grammarScore || 68,
          vocabulary: latestProgress?.vocabularyScore || 74,
          pronunciation: latestProgress?.pronunciationScore || 69,
          overall: latestProgress?.overallScore || 71,
        },
        dailyGoalMinutes: user.dailyGoalMinutes,
        minutesPracticedToday: todayProgress?.minutesPracticed || 0,
        streak: user.streak,
        recentMistakes: groupedMistakes.slice(0, 3),
        recommendedLesson,
        recentConversations,
        vocabSummary,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getRecommendations(req, res, next) {
  try {
    const userId = req.user.id;
    const groupedMistakes = await grammarService.getUserMistakesGrouped(userId);
    const topWeakTopic = groupedMistakes[0]?.topic || 'past_tense';

    const lesson = await grammarService.getTopicPracticeLesson(userId, topWeakTopic);

    res.json({
      success: true,
      data: {
        topic: topWeakTopic,
        lesson,
        action: `Practice ${topWeakTopic.replace(/_/g, ' ')} with Dutt`,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getMistakes(req, res, next) {
  try {
    const mistakes = await grammarService.getUserMistakesGrouped(req.user.id);
    res.json({
      success: true,
      data: mistakes,
    });
  } catch (err) {
    next(err);
  }
}

export async function getVocabulary(req, res, next) {
  try {
    const filter = req.query.filter || 'ALL';
    const vocab = await vocabularyService.getUserVocabulary(req.user.id, filter);
    res.json({
      success: true,
      data: vocab,
    });
  } catch (err) {
    next(err);
  }
}

export async function reviewVocabulary(req, res, next) {
  try {
    const { id } = req.params;
    const { remembered } = req.body;
    const updated = await vocabularyService.reviewWord(req.user.id, id, remembered !== false);

    res.json({
      success: true,
      message: 'Vocabulary review updated',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function getLessons(req, res, next) {
  try {
    const lessons = await prisma.lesson.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({
      success: true,
      data: lessons,
    });
  } catch (err) {
    next(err);
  }
}
