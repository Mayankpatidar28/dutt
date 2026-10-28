import prisma from '../../config/db.js';
import { aiService } from './ai.service.js';
import { NotFoundError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { agentService } from '../agent/agent.service.js';

export class ConversationService {
  async startConversation({ userId, mode = 'FREE', topic = 'General Conversation' }) {
    const conversation = await prisma.conversation.create({
      data: {
        userId,
        mode,
        topic,
        startedAt: new Date(),
      },
    });

    // Provide initial welcoming message from Dutt based on mode
    let initialGreeting = "Hey! I'm Dutt 👋 Let's practice English together. What's on your mind today?";
    if (mode === 'INTERVIEW') {
      initialGreeting = "Hello! I am Dutt, your interviewer today. Welcome to your interview practice. When you're ready, tell me a little bit about yourself and your background.";
    } else if (mode === 'ROLEPLAY') {
      initialGreeting = `Welcome to our ${topic} roleplay! I'm Dutt. How can I assist you today?`;
    } else if (mode === 'DEBATE') {
      initialGreeting = `Welcome to our debate session on "${topic}". What is your core position on this issue?`;
    }

    const firstMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        sender: 'DUTT',
        messageText: initialGreeting,
      },
    });

    return {
      conversation,
      initialMessage: firstMessage,
    };
  }

  async processUserMessage({ userId, conversationId, messageText }) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 20,
        },
        user: {
          include: { profile: true },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    // 1. Save user's incoming message
    const userMessage = await prisma.message.create({
      data: {
        conversationId,
        sender: 'USER',
        messageText,
      },
    });

    // 2. Fetch user's recent mistakes to pass as AI context
    const recentMistakes = await prisma.grammarMistake.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { grammarTopic: true, originalText: true, correctedText: true },
    });

    // 3. AI chat request with rich context
    const context = {
      userLevel: conversation.user.englishLevel || 'B1',
      mode: conversation.mode,
      topic: conversation.topic,
      recentMistakes,
      nativeLanguage: conversation.user.profile?.nativeLanguage || 'Hindi',
      goal: conversation.user.profile?.learningGoal || 'General Fluency',
      userName: conversation.user.name || conversation.user.profile?.name || '',
      userId,
      conversationId,
    };

    if (process.env.NODE_ENV !== 'production') {
      console.log('\n================ [DUTT AI DEBUG] ================');
      console.log(`[USER MESSAGE]\n${messageText}`);
      console.log(`[CONVERSATION ID]\n${conversationId}`);
      console.log(`[HISTORY LENGTH]\n${conversation.messages.length}`);
      console.log(`[AI REQUEST]\n${JSON.stringify({
        lastUserMessage: messageText,
        historyCount: conversation.messages.length,
        userLevel: context.userLevel,
        userName: context.userName,
        mode: context.mode,
        topic: context.topic,
      }, null, 2)}`);
    }

    const aiResponse = await aiService.chat({
      messages: [...conversation.messages, userMessage],
      context,
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AI RESPONSE]\n${JSON.stringify(aiResponse, null, 2)}`);
      console.log(`[TOOL CALL]\n${aiResponse.toolCall ? JSON.stringify(aiResponse.toolCall, null, 2) : 'NONE'}`);
      console.log(`[TOOL RESULT]\n${aiResponse.toolResult ? JSON.stringify(aiResponse.toolResult, null, 2) : 'NONE'}`);
      console.log('=================================================\n');
    }

    // 4. Save Dutt's response message
    const duttMessage = await prisma.message.create({
      data: {
        conversationId,
        sender: 'DUTT',
        messageText: aiResponse.reply,
      },
    });

    // 5. If a grammar correction occurred, save it
    let savedMistake = null;
    if (aiResponse.correction && aiResponse.correction.hasCorrection) {
      savedMistake = await prisma.grammarMistake.create({
        data: {
          userId,
          conversationId,
          messageId: userMessage.id,
          originalText: aiResponse.correction.original || messageText,
          correctedText: aiResponse.correction.corrected || '',
          explanation: aiResponse.correction.explanation || '',
          grammarTopic: aiResponse.correction.topic || 'general',
          severity: 'MEDIUM',
        },
      });
    }

    // 6. If vocabulary was extracted, save new vocabulary and associate with user
    const savedVocabList = [];
    if (Array.isArray(aiResponse.vocabulary)) {
      for (const item of aiResponse.vocabulary) {
        if (!item.word) continue;
        try {
          const vocabRecord = await prisma.vocabulary.upsert({
            where: { word: item.word.toLowerCase().trim() },
            update: {},
            create: {
              word: item.word.toLowerCase().trim(),
              meaning: item.meaning || '',
              exampleSentence: item.example || '',
              difficulty: aiResponse.difficulty || 'B1',
            },
          });

          await prisma.userVocabulary.upsert({
            where: {
              userId_vocabularyId: {
                userId,
                vocabularyId: vocabRecord.id,
              },
            },
            update: {},
            create: {
              userId,
              vocabularyId: vocabRecord.id,
              status: 'NEW',
              masteryScore: 0,
            },
          });

          savedVocabList.push(vocabRecord);
        } catch (vErr) {
          logger.warn(`Failed to save vocabulary [${item.word}]: ${vErr.message}`);
        }
      }
    }

    // 7. Check if an agent action was planned and requires user confirmation
    let pendingApproval = null;
    if (aiResponse.toolCall) {
      let toolName = (aiResponse.toolCall.action || '').toLowerCase();
      if (toolName.includes('resume')) toolName = 'send_resume';
      else if (toolName.includes('job')) toolName = 'search_jobs';
      else if (toolName.includes('project')) toolName = 'inspect_project';

      const plan = agentService.planAction({
        userId,
        conversationId,
        toolName,
        params: { ...aiResponse.toolCall },
        proposalMessage: aiResponse.reply,
      });

      if (plan.requiresApproval) {
        pendingApproval = {
          actionId: plan.actionId,
          toolName: plan.toolName,
          riskLevel: plan.riskLevel,
          proposalMessage: plan.proposalMessage,
        };
      }
    }

    return {
      duttMessage,
      correction: savedMistake,
      vocabulary: savedVocabList,
      followUpQuestion: aiResponse.followUpQuestion,
      difficulty: aiResponse.difficulty,
      pendingApproval,
    };
  }

  async handleActionApproval({ userId, conversationId, actionId, decision }) {
    const resolution = await agentService.resolveApproval({ userId, actionId, decision });

    const messageText = resolution.status === 'COMPLETED'
      ? `✅ [Action Completed] ${resolution.report}`
      : `❌ [Action Cancelled] ${resolution.report}`;

    const duttMessage = await prisma.message.create({
      data: {
        conversationId,
        sender: 'DUTT',
        messageText,
      },
    });

    return {
      resolution,
      duttMessage,
    };
  }

  async endConversation({ userId, conversationId }) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: true,
        grammarMistakes: true,
      },
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    const endedAt = new Date();
    const durationSeconds = Math.max(
      30,
      Math.round((endedAt.getTime() - new Date(conversation.startedAt).getTime()) / 1000)
    );

    // Calculate session report metrics
    const userMessages = conversation.messages.filter((m) => m.sender === 'USER');
    const fullTranscript = userMessages.map((m) => m.messageText).join(' ');

    const evaluation = await aiService.evaluateSpeaking({
      transcript: fullTranscript || 'Good conversation practice session with Dutt.',
      context: { durationSeconds, messageCount: userMessages.length },
    });

    // Update conversation record
    const updatedConversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        endedAt,
        durationSeconds,
        summary: `Session duration: ${Math.round(durationSeconds / 60)} mins. ${userMessages.length} user exchanges.`,
      },
    });

    // Count new vocabulary learned in this conversation
    const vocabCount = await prisma.userVocabulary.count({
      where: {
        userId,
        createdAt: { gte: conversation.startedAt },
      },
    });

    // Identify main weakness topic
    const mistakeCounts = {};
    for (const m of conversation.grammarMistakes) {
      mistakeCounts[m.grammarTopic] = (mistakeCounts[m.grammarTopic] || 0) + 1;
    }
    const mainWeakness = Object.keys(mistakeCounts).sort(
      (a, b) => mistakeCounts[b] - mistakeCounts[a]
    )[0] || 'past_tense';

    // Record or update daily learning progress
    const today = new Date().toISOString().split('T')[0];
    const minutesPracticed = Math.max(1, Math.round(durationSeconds / 60));

    await prisma.learningProgress.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      update: {
        speakingScore: evaluation.speakingScore,
        grammarScore: evaluation.grammarScore,
        vocabularyScore: evaluation.vocabularyScore,
        pronunciationScore: evaluation.pronunciationScore,
        overallScore: evaluation.overallScore,
        minutesPracticed: { increment: minutesPracticed },
      },
      create: {
        userId,
        date: today,
        speakingScore: evaluation.speakingScore,
        grammarScore: evaluation.grammarScore,
        vocabularyScore: evaluation.vocabularyScore,
        pronunciationScore: evaluation.pronunciationScore,
        overallScore: evaluation.overallScore,
        minutesPracticed,
      },
    });

    // Increment user streak if this is first practice today
    await prisma.user.update({
      where: { id: userId },
      data: { streak: { increment: 1 } },
    });

    return {
      conversation: updatedConversation,
      sessionReport: {
        durationSeconds,
        speakingScore: evaluation.speakingScore,
        grammarScore: evaluation.grammarScore,
        vocabularyScore: evaluation.vocabularyScore,
        pronunciationScore: evaluation.pronunciationScore,
        overallScore: evaluation.overallScore,
        mistakesCount: conversation.grammarMistakes.length,
        newVocabularyCount: vocabCount,
        mainWeakness: mainWeakness.replace(/_/g, ' '),
        recommendedNextPractice: `${mainWeakness.replace(/_/g, ' ')} conversation`,
        estimatedLevel: evaluation.estimatedLevel,
        strengths: evaluation.strengths,
      },
    };
  }
}

export const conversationService = new ConversationService();
