import express from 'express';
import { startInterview, respondToQuestion, endInterview, getInterviewHistory, getInterviewReport } from '../controllers/interviewController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/start', protect, startInterview);
router.post('/respond', protect, respondToQuestion);
router.post('/end', protect, endInterview);
router.get('/history', protect, getInterviewHistory);
router.get('/report/:id', protect, getInterviewReport);

export default router;
