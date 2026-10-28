import { z } from 'zod';

export const registerSchema = {
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(60),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    englishLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1']).optional().default('B1'),
    targetLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1']).optional().default('C1'),
    dailyGoalMinutes: z.number().int().min(5).max(120).optional().default(15),
    nativeLanguage: z.string().optional().default('Hindi'),
    learningGoal: z.string().optional().default('General Fluency'),
  }),
};

export const loginSchema = {
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
};
