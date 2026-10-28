import prisma from '../../config/db.js';
import { NotFoundError } from '../../utils/errors.js';

export class UsersService {
  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) throw new NotFoundError('User not found');

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      englishLevel: user.englishLevel,
      targetLevel: user.targetLevel,
      dailyGoalMinutes: user.dailyGoalMinutes,
      streak: user.streak,
      profile: user.profile,
    };
  }

  async updateProfile(userId, updateData) {
    const { name, englishLevel, targetLevel, dailyGoalMinutes, nativeLanguage, learningGoal, occupation, timezone } = updateData;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name ? { name } : {}),
        ...(englishLevel ? { englishLevel } : {}),
        ...(targetLevel ? { targetLevel } : {}),
        ...(dailyGoalMinutes ? { dailyGoalMinutes: parseInt(dailyGoalMinutes, 10) } : {}),
        profile: {
          upsert: {
            create: {
              nativeLanguage: nativeLanguage || 'Hindi',
              learningGoal: learningGoal || 'General Fluency',
              occupation: occupation || null,
              timezone: timezone || 'Asia/Kolkata',
            },
            update: {
              ...(nativeLanguage ? { nativeLanguage } : {}),
              ...(learningGoal ? { learningGoal } : {}),
              ...(occupation !== undefined ? { occupation } : {}),
              ...(timezone ? { timezone } : {}),
            },
          },
        },
      },
      include: { profile: true },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      englishLevel: user.englishLevel,
      targetLevel: user.targetLevel,
      dailyGoalMinutes: user.dailyGoalMinutes,
      streak: user.streak,
      profile: user.profile,
    };
  }
}

export const usersService = new UsersService();
