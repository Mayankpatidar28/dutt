import { aiService } from '../../services/ai/ai.service.js';

export async function chat(req, res, next) {
  try {
    const { messages, context } = req.body;
    const response = await aiService.chat({
      messages: messages || [],
      context: {
        ...(context || {}),
        userLevel: context?.userLevel || req.user?.englishLevel || 'B1',
      },
    });

    res.json({
      success: true,
      data: response,
    });
  } catch (err) {
    next(err);
  }
}

export async function correct(req, res, next) {
  try {
    const { text, userLevel } = req.body;
    const mistakes = await aiService.analyzeGrammar({
      text,
      userLevel: userLevel || req.user?.englishLevel || 'B1',
    });

    res.json({
      success: true,
      data: {
        originalText: text,
        mistakes,
        hasMistakes: mistakes.length > 0,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function evaluate(req, res, next) {
  try {
    const { transcript, context } = req.body;
    const evaluation = await aiService.evaluateSpeaking({
      transcript,
      context,
    });

    res.json({
      success: true,
      data: evaluation,
    });
  } catch (err) {
    next(err);
  }
}

export async function extractVocab(req, res, next) {
  try {
    const { text, userLevel } = req.body;
    const vocab = await aiService.extractVocabulary({
      text,
      userLevel: userLevel || req.user?.englishLevel || 'B1',
    });

    res.json({
      success: true,
      data: vocab,
    });
  } catch (err) {
    next(err);
  }
}
