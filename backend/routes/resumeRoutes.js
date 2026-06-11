import express from 'express';
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

// Env var safety check on startup
const LATEX_API_URL = process.env.LATEX_API_URL || 'https://latexonline.cc/compile';
if (!process.env.LATEX_API_URL) {
  console.warn('⚠️  LATEX_API_URL is not set in .env — defaulting to https://latexonline.cc/compile');
}

// Proxy LaTeX compilation to avoid CORS issues
// Uses POST with text body to avoid URL length limits on production
router.post('/compile-latex', async (req, res) => {
  try {
    const { latex } = req.body;
    if (!latex || !latex.trim()) {
      return res.status(400).json({ message: 'No LaTeX content provided' });
    }

    // Use native fetch with POST — no disk I/O, no fs module, fully in-memory
    const response = await fetch(`${LATEX_API_URL}?text=${encodeURIComponent(latex)}`, {
      method: 'GET',
      headers: { 'Accept': 'application/pdf' },
      signal: AbortSignal.timeout(60000), // 60 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error from LaTeX service');
      console.error(`❌ LaTeX API returned ${response.status}:`, errorText);
      return res.status(502).json({
        message: `LaTeX compilation failed (upstream ${response.status})`,
        detail: errorText.substring(0, 2000) // cap error length
      });
    }

    // Capture PDF as Buffer directly in memory — zero disk I/O
    const arrayBuffer = await response.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    if (pdfBuffer.length < 100) {
      console.error('❌ LaTeX API returned suspiciously small response:', pdfBuffer.length, 'bytes');
      return res.status(502).json({
        message: 'LaTeX service returned an empty or invalid PDF',
        detail: `Response was only ${pdfBuffer.length} bytes`
      });
    }

    // Send PDF with proper headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);

  } catch (err) {
    // Extract the most useful error info possible
    const detail = err.cause?.message || err.message || 'Unknown error';
    console.error('❌ LaTeX compilation error:', detail);

    if (err.name === 'TimeoutError' || err.code === 'UND_ERR_CONNECT_TIMEOUT') {
      return res.status(504).json({
        message: 'LaTeX compilation timed out. The external service may be slow or down.',
        detail
      });
    }

    res.status(500).json({
      message: 'LaTeX compilation failed',
      detail
    });
  }
});

export default router;

