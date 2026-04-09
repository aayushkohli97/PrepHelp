import express from 'express';
import { fetchAllProfiles, getProfileStats, getProfileAnalysis, fetchSingleProfile, removeProfile, verifyPassword } from '../controllers/profileController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/fetch', protect, fetchAllProfiles);
router.post('/fetch-single', protect, fetchSingleProfile);
router.post('/remove', protect, removeProfile);
router.post('/verify-password', protect, verifyPassword);
router.get('/stats', protect, getProfileStats);
router.get('/analysis', protect, getProfileAnalysis);

export default router;
