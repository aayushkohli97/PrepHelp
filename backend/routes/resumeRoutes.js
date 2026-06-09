import express from 'express';
import axios from 'axios';
import {
  saveResumeHandler, getResumes, getResume, deleteResume, getResumeList
} from '../controllers/resumeController.js';
import { protect } from '../middleware/auth.js';
const router = express.Router();

router.post('/save-resume', protect, saveResumeHandler);
router.get('/list', protect, getResumeList);
router.get('/', protect, getResumes);
router.get('/:id', protect, getResume);
router.delete('/:id', protect, deleteResume);

// Proxy LaTeX compilation to avoid CORS issues
router.post('/compile-latex', async (req, res) => {
  try {
    const { latex } = req.body;
    if (!latex || !latex.trim()) {
      return res.status(400).json({ message: 'No LaTeX content provided' });
    }
    const encoded = encodeURIComponent(latex);
    const response = await axios.get(`https://latexonline.cc/compile?text=${encoded}`, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'Accept': 'application/pdf'
      }
    });
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', 'inline; filename="resume.pdf"');
    res.send(Buffer.from(response.data));
  } catch (err) {
    console.error('LaTeX compilation error:', err.message);
    res.status(500).json({ message: 'LaTeX compilation failed. Please check your template.' });
  }
});

export default router;
