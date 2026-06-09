import express from 'express';
import { sendMessage, getConversations, getConversation, deleteConversation } from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/message', protect, sendMessage);
router.get('/conversations', protect, getConversations);
router.get('/conversations/:id', protect, getConversation);
router.delete('/conversations/:id', protect, deleteConversation);

export default router;
