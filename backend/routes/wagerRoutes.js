import express from 'express';
import { protect } from '../middleware/auth.js';
import * as wagerController from '../controllers/wagerController.js';

const router = express.Router();

router.post('/create', protect, wagerController.createWager);
router.get('/active', protect, wagerController.getActiveWagers);
router.post('/resolve/:id', protect, wagerController.resolveWager);
router.get('/history', protect, wagerController.getWagerHistory);

export default router;
