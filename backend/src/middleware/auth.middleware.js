import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AuthenticationError } from '../utils/errors.js';
import prisma from '../config/db.js';

export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      throw new AuthenticationError('No authorization header provided');
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : authHeader.trim();

    if (!token) {
      throw new AuthenticationError('Bearer token is missing');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AuthenticationError('Token has expired. Please log in again.');
      }
      throw new AuthenticationError('Invalid token signature or payload.');
    }

    // Verify user exists in DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        englishLevel: true,
        targetLevel: true,
        dailyGoalMinutes: true,
        streak: true,
      },
    });

    if (!user) {
      throw new AuthenticationError('User associated with this token no longer exists.');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
