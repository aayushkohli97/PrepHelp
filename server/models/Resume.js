import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: 'My Resume'
  },
  targetRole: {
    type: String,
    default: 'SDE-1'
  },
  sections: {
    contact: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      github: { type: String, default: '' },
      portfolio: { type: String, default: '' },
      location: { type: String, default: '' }
    },
    summary: { type: String, default: '' },
    experience: [{
      title: String,
      company: String,
      location: String,
      startDate: String,
      endDate: String,
      current: Boolean,
      bullets: [String]
    }],
    education: [{
      degree: String,
      institution: String,
      location: String,
      startDate: String,
      endDate: String,
      gpa: String,
      relevant: String
    }],
    projects: [{
      name: String,
      description: String,
      techStack: [String],
      link: String,
      github: String,
      bullets: [String]
    }],
    skills: {
      languages: [String],
      frameworks: [String],
      tools: [String],
      databases: [String],
      other: [String]
    },
    certifications: [String],
    customCss: String
  },
  latexTemplate: {
    type: String,
    default: ''
  },
  template: {
    type: String,
    enum: ['modern', 'creative', 'minimalist', 'tech', 'corporate', 'custom'],
    default: 'modern'
  },
  aiAnalysis: {
    overallScore: { type: Number, default: 0 },
    atsScore: { type: Number, default: 0 },
    suggestions: [{
      section: String,
      issue: String,
      suggestion: String,
      priority: { type: String, enum: ['high', 'medium', 'low'] }
    }],
    missingKeywords: [String],
    improvedSummary: String,
    improvedBullets: [String]
  },
  originalPdfText: { type: String, default: '' },
  pdfUrl: { type: String, default: '' }
}, {
  timestamps: true
});

export default mongoose.model('Resume', resumeSchema);
