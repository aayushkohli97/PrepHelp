import express from 'express';
import { protect } from '../middleware/auth.js';
import * as leaderboardController from '../controllers/leaderboardController.js';

const router = express.Router();

router.get('/global', protect, leaderboardController.getGlobalLeaderboard);
router.get('/rivals', protect, leaderboardController.getRivalsLeaderboard);
router.post('/rival', protect, leaderboardController.addRival);
router.delete('/rival/:id', protect, leaderboardController.removeRival);

export default router;
