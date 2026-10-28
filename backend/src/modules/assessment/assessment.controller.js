import { evaluationService } from '../../services/ai/evaluation.service.js';
import prisma from '../../config/db.js';
import { NotFoundError } from '../../utils/errors.js';

export async function startAssessment(req, res, next) {
  try {
    const questions = evaluationService.getAssessmentQuestions();
    res.json({
      success: true,
      data: {
        assessmentId: 'diag_' + Date.now(),
        instructions: 'Please answer these questions to help Dutt calibrate your personalized English speaking journey.',
        questions,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function submitAssessment(req, res, next) {
  try {
    const { answers, spokenTranscript } = req.body;
    const result = await evaluationService.evaluateInitialAssessment(req.user.id, {
      answers,
      spokenTranscript,
    });

    res.json({
      success: true,
      message: 'Assessment completed successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getAssessmentResult(req, res, next) {
  try {
    const latest = await prisma.assessment.findFirst({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!latest) {
      throw new NotFoundError('No assessment found for this user');
    }

    res.json({
      success: true,
      data: {
        ...latest,
        result: JSON.parse(latest.result),
      },
    });
  } catch (err) {
    next(err);
  }
}
