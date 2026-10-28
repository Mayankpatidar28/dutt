import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/db.js';
import { env } from '../../config/env.js';
import { ConflictError, AuthenticationError } from '../../utils/errors.js';

export class AuthService {
  async register({
    name,
    email,
    password,
    englishLevel = 'B1',
    targetLevel = 'C1',
    dailyGoalMinutes = 15,
    nativeLanguage = 'Hindi',
    learningGoal = 'General Fluency',
  }) {
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictError('An account with this email address already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        englishLevel,
        targetLevel,
        dailyGoalMinutes,
        profile: {
          create: {
            nativeLanguage,
            learningGoal,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        englishLevel: user.englishLevel,
        targetLevel: user.targetLevel,
        dailyGoalMinutes: user.dailyGoalMinutes,
        streak: user.streak,
        profile: user.profile,
      },
      token,
    };
  }

  async login({ email, password }) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { profile: true },
    });

    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AuthenticationError('Invalid email or password');
    }

    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        englishLevel: user.englishLevel,
        targetLevel: user.targetLevel,
        dailyGoalMinutes: user.dailyGoalMinutes,
        streak: user.streak,
        profile: user.profile,
      },
      token,
    };
  }

  generateToken(userId) {
    return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
  }
}

export const authService = new AuthService();
