import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: String,
  userAnswer: { type: String, default: '' },
  feedback: { type: String, default: '' },
  score: { type: Number, default: 0, min: 0, max: 10 }
}, { _id: true });

const interviewSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['hr', 'technical', 'mixed'],
    required: true
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed'],
    default: 'in_progress'
  },
  duration: {
    type: Number,
    default: 0
  },
  questions: [questionSchema],
  currentQuestionIndex: {
    type: Number,
    default: 0
  },
  overallScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  report: {
    communication: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    relevantAnswers: { type: Number, default: 0 },
    problemSolving: { type: Number, default: 0 },
    codeQuality: { type: Number, default: 0 },
    explanation: { type: Number, default: 0 },
    timeManagement: { type: Number, default: 0 },
    improvements: [String]
  }
}, {
  timestamps: true
});

export default mongoose.model('InterviewSession', interviewSessionSchema);
