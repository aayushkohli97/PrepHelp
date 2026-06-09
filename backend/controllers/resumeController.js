import Resume from '../models/Resume.js';

export const saveResumeHandler = async (req, res) => {
  try {
    const { _id, resumeData, selectedTemplateId, title, resumeName } = req.body;
    const name = resumeName || title || 'Untitled Resume';

    if (_id) {
      const resume = await Resume.findOneAndUpdate(
        { _id, userId: req.user._id },
        { resumeData, selectedTemplateId, title: name, resumeName: name },
        { new: true }
      );
      if (!resume) return res.status(404).json({ message: 'Resume not found' });
      return res.json(resume);
    } else {
      const resume = await Resume.create({
        userId: req.user._id,
        title: name,
        resumeName: name,
        resumeData: resumeData || {},
        selectedTemplateId: selectedTemplateId || 1
      });
      return res.json(resume);
    }
  } catch (err) {
    console.error('Save failed:', err);
    res.status(500).json({ message: 'Save failed' });
  }
};

// @route GET /api/resume/list  — lightweight list for dropdown
export const getResumeList = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id })
      .select('_id resumeName updatedAt selectedTemplateId')
      .sort('-updatedAt');
    res.json(resumes);
  } catch (err) {
    console.error('List failed:', err);
    res.status(500).json({ message: 'Failed to fetch resume list' });
  }
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
