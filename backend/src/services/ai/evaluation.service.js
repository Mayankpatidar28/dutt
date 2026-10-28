import prisma from '../../config/db.js';
import { aiService } from './ai.service.js';

export class EvaluationService {
  /**
   * Diagnostic assessment questions covering grammar, vocabulary, sentence formation, and speaking.
   */
  static ASSESSMENT_QUESTIONS = [
    {
      id: 1,
      type: 'grammar',
      category: 'Tenses',
      question: 'Choose the correct sentence to describe yesterday:',
      options: [
        'I have went to the office yesterday.',
        'I went to the office yesterday.',
        'I go to the office yesterday.',
        'I did went to the office yesterday.',
      ],
      correctAnswerIndex: 1,
      difficulty: 'A2',
    },
    {
      id: 2,
      type: 'grammar',
      category: 'Subject-Verb Agreement',
      question: 'Complete the sentence: "Neither of the team members ______ the meeting link."',
      options: ['have', 'has', 'having', 'are having'],
      correctAnswerIndex: 1,
      difficulty: 'B1',
    },
    {
      id: 3,
      type: 'vocabulary',
      category: 'Word Choice',
      question: 'Select the word that best completes: "Her explanation was so ______ that everyone understood immediately."',
      options: ['ambiguous', 'articulate', 'hesitant', 'obscure'],
      correctAnswerIndex: 1,
      difficulty: 'B2',
    },
    {
      id: 4,
      type: 'sentence_formation',
      category: 'Prepositions & Phrasing',
      question: 'Which of the following is natural English phrasing?',
      options: [
        'We will discuss about this project later.',
        'We will discuss this project later.',
        'We will discuss regarding this project later.',
        'We will revert back you about this project later.',
      ],
      correctAnswerIndex: 1,
      difficulty: 'B1',
    },
    {
      id: 5,
      type: 'speaking_prompt',
      category: 'Spoken Fluency',
      question: 'In 2-3 spoken sentences, describe what you enjoy doing in your free time and why.',
      difficulty: 'B1',
    },
  ];

  getAssessmentQuestions() {
    return EvaluationService.ASSESSMENT_QUESTIONS;
  }

  /**
   * Evaluates submitted answers and generates estimated CEFR level and detailed score breakdowns.
   */
  async evaluateInitialAssessment(userId, { answers = [], spokenTranscript = '' }) {
    let grammarCorrect = 0;
    let totalMCQ = 0;

    for (const q of EvaluationService.ASSESSMENT_QUESTIONS) {
      if (q.type !== 'speaking_prompt') {
        totalMCQ += 1;
        const userAnswer = answers.find((a) => a.questionId === q.id);
        if (userAnswer && userAnswer.selectedOptionIndex === q.correctAnswerIndex) {
          grammarCorrect += 1;
        }
      }
    }

    const mcqRatio = totalMCQ > 0 ? grammarCorrect / totalMCQ : 0.7;
    const grammarScore = Math.round(50 + mcqRatio * 45); // 50 to 95
    const vocabularyScore = Math.round(55 + mcqRatio * 40);

    // Evaluate spoken transcript if provided
    let speakingEval = {
      speakingScore: 68,
      pronunciationScore: 66,
      strengths: ['Clear enthusiasm to communicate', 'Good foundational understanding'],
      weaknesses: ['Minor tense consistency adjustments needed'],
    };

    if (spokenTranscript && spokenTranscript.trim().length > 5) {
      speakingEval = await aiService.evaluateSpeaking({ transcript: spokenTranscript });
    }

    const speakingScore = speakingEval.speakingScore || 70;
    const pronunciationScore = speakingEval.pronunciationScore || 68;

    const overallScore = Math.round(
      speakingScore * 0.35 +
      grammarScore * 0.3 +
      vocabularyScore * 0.2 +
      pronunciationScore * 0.15
    );

    let level = 'B1';
    let levelTitle = 'Intermediate';
    if (overallScore < 50) {
      level = 'A1';
      levelTitle = 'Beginner';
    } else if (overallScore < 65) {
      level = 'A2';
      levelTitle = 'Elementary';
    } else if (overallScore < 78) {
      level = 'B1';
      levelTitle = 'Intermediate';
    } else if (overallScore < 88) {
      level = 'B2';
      levelTitle = 'Upper Intermediate';
    } else {
      level = 'C1';
      levelTitle = 'Advanced';
    }

    const resultPayload = {
      speakingScore,
      grammarScore,
      vocabularyScore,
      pronunciationScore,
      overallScore,
      level,
      levelTitle,
      disclaimer: 'This assessment is an AI-generated proficiency estimate designed to personalize your learning journey, not an official CEFR certificate.',
      strengths: speakingEval.strengths || ['Good conversational confidence'],
      weaknesses: speakingEval.weaknesses || ['Past tense verbs and prepositions'],
    };

    // Save assessment to database
    const savedAssessment = await prisma.assessment.create({
      data: {
        userId,
        type: 'INITIAL',
        score: overallScore,
        level,
        result: JSON.stringify(resultPayload),
      },
    });

    // Update user's current English level
    await prisma.user.update({
      where: { id: userId },
      data: { englishLevel: level },
    });

    return {
      assessment: savedAssessment,
      result: resultPayload,
    };
  }
}

export const evaluationService = new EvaluationService();
