import { authService } from './auth.service.js';
import prisma from '../../config/db.js';

export async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    res.json({
      success: true,
      message: 'Logged in successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res) {
  // Clear any client session cookie if used
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
}

export async function getMe(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { profile: true },
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        englishLevel: user.englishLevel,
        targetLevel: user.targetLevel,
        dailyGoalMinutes: user.dailyGoalMinutes,
        streak: user.streak,
        profile: user.profile,
      },
    });
  } catch (err) {
    next(err);
  }
}
