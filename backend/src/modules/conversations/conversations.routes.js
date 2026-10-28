import { Router } from 'express';
import {
  createConversation,
  listConversations,
  getConversation,
  deleteConversation,
  sendMessage,
  endConversation,
  approveAction,
} from './conversations.controller.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.post('/', createConversation);
router.get('/', listConversations);
router.get('/:id', getConversation);
router.delete('/:id', deleteConversation);
router.post('/:id/messages', sendMessage);
router.post('/:id/actions/approve', approveAction);
router.post('/:id/end', endConversation);

export default router;
