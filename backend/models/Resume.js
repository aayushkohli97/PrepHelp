import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resumeName: {
    type: String,
    default: 'Untitled Resume'
  },
  title: {
    type: String,
    default: 'My Resume'
  },
  resumeData: {
    type: Object,
    default: {
      contact: { name: '', email: '', phone: '', linkedin: '', github: '', portfolio: '', location: '' },
      summary: '',
      education: [],
      experience: [],
      projects: [],
      skills: { languages: [], frameworks: [], tools: [], databases: [], other: [] }
    }
  },
  selectedTemplateId: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

export default mongoose.model('Resume', resumeSchema);
