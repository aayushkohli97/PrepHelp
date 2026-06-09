import express from 'express';
import { protect } from '../middleware/auth.js';
import * as preptrackController from '../controllers/preptrackController.js';

const router = express.Router();

router.post('/create', protect, preptrackController.createPrepTrack);
router.post('/lock/:id', protect, preptrackController.lockAndStart);
router.put('/edit/:id', protect, preptrackController.editDraft);
router.put('/toggle-task/:id/:taskId', protect, preptrackController.toggleTask);
router.post('/evaluate/:id', protect, preptrackController.evaluateTrack);
router.get('/active', protect, preptrackController.getActiveTracks);
router.get('/history', protect, preptrackController.getHistory);
router.delete('/:id', protect, preptrackController.deleteDraft);

export default router;
