import prisma from '../../config/db.js';

export async function getProgressSummary(req, res, next) {
  try {
    const userId = req.user.id;

    // Get user and total sessions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { streak: true, englishLevel: true, targetLevel: true },
    });

    const sessionsCount = await prisma.conversation.count({
      where: { userId, durationSeconds: { gt: 0 } },
    });

    const totalSecondsResult = await prisma.conversation.aggregate({
      where: { userId },
      _sum: { durationSeconds: true },
    });
    const totalMinutesPracticed = Math.round((totalSecondsResult._sum.durationSeconds || 0) / 60);

    const progressRecords = await prisma.learningProgress.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 30,
    });

    const latest = progressRecords[0] || null;

    res.json({
      success: true,
      data: {
        hasData: progressRecords.length > 0 || sessionsCount > 0,
        englishLevel: user.englishLevel,
        targetLevel: user.targetLevel,
        streak: user.streak,
        sessionsCompleted: sessionsCount,
        totalMinutesPracticed,
        currentScores: latest
          ? {
              speaking: latest.speakingScore,
              grammar: latest.grammarScore,
              vocabulary: latest.vocabularyScore,
              pronunciation: latest.pronunciationScore,
              overall: latest.overallScore,
            }
          : null,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getWeeklyProgress(req, res, next) {
  try {
    const userId = req.user.id;
    const progressList = await prisma.learningProgress.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
      take: 7,
    });

    res.json({
      success: true,
      data: progressList,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMonthlyProgress(req, res, next) {
  try {
    const userId = req.user.id;
    const progressList = await prisma.learningProgress.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
      take: 30,
    });

    res.json({
      success: true,
      data: progressList,
    });
  } catch (err) {
    next(err);
  }
}
