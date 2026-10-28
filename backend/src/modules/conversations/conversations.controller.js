import prisma from '../../config/db.js';
import { conversationService } from '../../services/ai/conversation.service.js';
import { NotFoundError } from '../../utils/errors.js';

export async function createConversation(req, res, next) {
  try {
    const { mode, topic } = req.body;
    const result = await conversationService.startConversation({
      userId: req.user.id,
      mode: mode || 'FREE',
      topic: topic || 'General Conversation',
    });

    res.status(201).json({
      success: true,
      message: 'Conversation started',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function listConversations(req, res, next) {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { userId: req.user.id },
      orderBy: { startedAt: 'desc' },
      include: {
        _count: {
          select: { messages: true, grammarMistakes: true },
        },
      },
    });

    res.json({
      success: true,
      data: conversations,
    });
  } catch (err) {
    next(err);
  }
}

export async function getConversation(req, res, next) {
  try {
    const { id } = req.params;
    const conversation = await prisma.conversation.findFirst({
      where: { id, userId: req.user.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        grammarMistakes: true,
      },
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    res.json({
      success: true,
      data: conversation,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteConversation(req, res, next) {
  try {
    const { id } = req.params;
    await prisma.conversation.deleteMany({
      where: { id, userId: req.user.id },
    });

    res.json({
      success: true,
      message: 'Conversation deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function sendMessage(req, res, next) {
  try {
    const { id } = req.params;
    const { messageText } = req.body;

    if (!messageText || !messageText.trim()) {
      return res.status(400).json({
        success: false,
        message: 'messageText is required',
        errorCode: 'VALIDATION_ERROR',
      });
    }

    const result = await conversationService.processUserMessage({
      userId: req.user.id,
      conversationId: id,
      messageText: messageText.trim(),
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function endConversation(req, res, next) {
  try {
    const { id } = req.params;
    const result = await conversationService.endConversation({
      userId: req.user.id,
      conversationId: id,
    });

    res.json({
      success: true,
      message: 'Session ended successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function approveAction(req, res, next) {
  try {
    const { id } = req.params;
    const { actionId, decision } = req.body;

    if (!actionId || !decision) {
      return res.status(400).json({
        success: false,
        message: 'actionId and decision ("ALLOW_ONCE", "ALWAYS_ALLOW", "REJECT") are required.',
      });
    }

    const result = await conversationService.handleActionApproval({
      userId: req.user.id,
      conversationId: id,
      actionId,
      decision,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

