import express from 'express';
import {
  uploadResume, createResume, getResumes, getResume,
  updateResume, analyzeResumeById, optimizeResumeById, deleteResume, parseResumeHandler
} from '../controllers/resumeController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post('/parse-resume', protect, upload.single('resume'), parseResumeHandler);
router.post('/upload', protect, upload.single('resume'), uploadResume);
router.post('/create', protect, createResume);
router.get('/', protect, getResumes);
router.get('/:id', protect, getResume);
router.put('/:id', protect, updateResume);
router.post('/:id/analyze', protect, analyzeResumeById);
router.post('/:id/optimize', protect, optimizeResumeById);
router.delete('/:id', protect, deleteResume);

export default router;
