import fs from 'fs';
import Resume from '../models/Resume.js';
import { extractTextFromPDF } from '../services/resumeParser.js';
import { analyzeResume, optimizeResume, parseResume, parseResumeFromBuffer } from '../services/geminiService.js';

// @route POST /api/resume/upload
export const uploadResume = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a file' });
  }

  try {
    const text = await extractTextFromPDF(req.file.path);
    const targetRole = req.body.targetRole || 'SDE-1';
    const pdfUrl = `/uploads/${req.file.filename}`;

    // Try parsing with Gemini, but don't fail if API is down
    let parsedSections = {};
    let latexTemplate = '';
    try {
      const parsedData = await parseResume(text);
      parsedSections = parsedData.sections || {};
      latexTemplate = parsedData.latexTemplate || '';
    } catch (aiErr) {
      console.error('⚠️ Gemini API failed during parsing, saving resume with empty sections:', aiErr.message);
    }

    const resume = await Resume.create({
      userId: req.user._id,
      title: req.file.originalname.replace(/\.[^/.]+$/, ''),
      targetRole,
      originalPdfText: text,
      pdfUrl,
      sections: parsedSections,
      latexTemplate
    });
    res.status(201).json(resume);
  } catch (err) {
    console.error('Upload failed:', err);
    res.status(500).json({ message: err.message || 'Upload failed' });
  }
};

// @route POST /api/resume/create
export const createResume = async (req, res) => {
  const { title, targetRole, sections, template, latexTemplate } = req.body;
  const resume = await Resume.create({
    userId: req.user._id,
    title: title || 'My Resume',
    targetRole: targetRole || 'SDE-1',
    sections: sections || {},
    template: template || 'modern',
    latexTemplate: latexTemplate || ''
  });
  res.status(201).json(resume);
};

// @route GET /api/resume
export const getResumes = async (req, res) => {
  const resumes = await Resume.find({ userId: req.user._id }).sort('-updatedAt');
  res.json(resumes);
};

// @route GET /api/resume/:id
export const getResume = async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
  if (!resume) return res.status(404).json({ message: 'Resume not found' });
  res.json(resume);
};

// @route PUT /api/resume/:id
export const updateResume = async (req, res) => {
  try {
    const { sections, template, title, targetRole, latexTemplate } = req.body;
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    
    if (sections) {
      resume.sections = sections; 
      resume.markModified('sections');
    }
    if (template) resume.template = template;
    if (title) resume.title = title;
    if (targetRole) resume.targetRole = targetRole;
    if (latexTemplate !== undefined) resume.latexTemplate = latexTemplate;
    
    await resume.save();
    res.json(resume);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/resume/:id/analyze
export const analyzeResumeById = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    // Return cached analysis if it already exists (skip AI call)
    const forceReanalyze = req.query.force === 'true';
    if (!forceReanalyze && resume.aiAnalysis?.overallScore) {
      console.log('📋 Returning cached analysis (no AI call)');
      return res.json({ resume, analysis: resume.aiAnalysis });
    }

    let resumeText = resume.originalPdfText || '';
    if (!resumeText && resume.sections) {
      const s = resume.sections;
      const parts = [];
      if (s.contact?.name) parts.push(`Name: ${s.contact.name}`);
      if (s.contact?.email) parts.push(`Email: ${s.contact.email}`);
      if (s.contact?.phone) parts.push(`Phone: ${s.contact.phone}`);
      if (s.contact?.linkedin) parts.push(`LinkedIn: ${s.contact.linkedin}`);
      if (s.contact?.github) parts.push(`GitHub: ${s.contact.github}`);
      if (s.summary) parts.push(`\nSummary: ${s.summary}`);
      if (s.experience?.length) {
        parts.push('\nExperience:');
        s.experience.forEach(e => {
          parts.push(`${e.title} at ${e.company} (${e.startDate} - ${e.endDate || 'Present'})`);
          e.bullets?.forEach(b => parts.push(`  - ${b}`));
        });
      }
      if (s.education?.length) {
        parts.push('\nEducation:');
        s.education.forEach(e => parts.push(`${e.degree} - ${e.institution} (${e.startDate} - ${e.endDate}) GPA: ${e.gpa || 'N/A'}`));
      }
      if (s.projects?.length) {
        parts.push('\nProjects:');
        s.projects.forEach(p => {
          parts.push(`${p.name}: ${p.description} [${p.techStack?.join(', ')}]`);
          p.bullets?.forEach(b => parts.push(`  - ${b}`));
        });
      }
      if (s.skills) {
        const allSkills = [...(s.skills.languages || []), ...(s.skills.frameworks || []),
          ...(s.skills.tools || []), ...(s.skills.databases || []), ...(s.skills.other || [])];
        if (allSkills.length) parts.push(`\nSkills: ${allSkills.join(', ')}`);
      }
      resumeText = parts.join('\n');
    }
    if (!resumeText) return res.status(400).json({ message: 'Resume has no content to analyze' });

    const analysis = await analyzeResume(resumeText, resume.targetRole);
    resume.aiAnalysis = {
      overallScore: analysis.overallScore || 0, atsScore: analysis.atsScore || 0,
      suggestions: analysis.suggestions || [], missingKeywords: analysis.missingKeywords || [],
      improvedSummary: analysis.improvedSummary || '', improvedBullets: analysis.improvedBullets || []
    };
    await resume.save();
    res.json({ resume, analysis });
  } catch (err) {
    console.error('Analyze failed:', err.message);
    res.status(500).json({ message: 'AI analysis failed. Please try again later.' });
  }
};

// @route POST /api/resume/:id/optimize
export const optimizeResumeById = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    const optimized = await optimizeResume(resume.sections, resume.targetRole);
    if (optimized.sections) { resume.sections = optimized.sections; await resume.save(); }
    res.json({ resume, optimized });
  } catch (err) {
    console.error('Optimize failed:', err.message);
    res.status(500).json({ message: 'AI optimization failed. Please try again later.' });
  }
};

// @route DELETE /api/resume/:id
export const deleteResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    res.json({ message: 'Resume deleted' });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/resume/parse-resume
export const parseResumeHandler = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a PDF' });
  }

  try {
    const fileBuffer = fs.readFileSync(req.file.path);
    const base64PdfBuffer = fileBuffer.toString('base64');

    const parsedData = await parseResumeFromBuffer(base64PdfBuffer);
    res.json(parsedData);
  } catch (error) {
    console.error('API Parse Error:', error);
    res.status(500).json({ message: 'Error parsing PDF via Gemini API' });
  }
};
