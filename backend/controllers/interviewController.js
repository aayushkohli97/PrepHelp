import InterviewSession from '../models/InterviewSession.js';
import { generateInterviewQuestion, evaluateAnswer, generateInterviewReport } from '../services/geminiService.js';

// @route POST /api/interview/start
export const startInterview = async (req, res) => {
  const { type } = req.body;
  if (!type || !['hr', 'technical', 'mixed'].includes(type)) {
    return res.status(400).json({ message: 'Valid interview type required (hr/technical/mixed)' });
  }
  const questionData = await generateInterviewQuestion(type, [], null);
  const session = await InterviewSession.create({
    userId: req.user._id, type, status: 'in_progress',
    questions: [{ question: questionData.question, userAnswer: '', feedback: '', score: 0 }],
    currentQuestionIndex: 0
  });
  res.status(201).json({
    sessionId: session._id, question: questionData.question,
    questionNumber: 1, category: questionData.category, difficulty: questionData.difficulty
  });
};

// @route POST /api/interview/respond
export const respondToQuestion = async (req, res) => {
  const { sessionId, answer } = req.body;
  if (!sessionId || !answer) return res.status(400).json({ message: 'Session ID and answer are required' });

  const session = await InterviewSession.findOne({ _id: sessionId, userId: req.user._id, status: 'in_progress' });
  if (!session) return res.status(404).json({ message: 'Active session not found' });

  const currentQ = session.questions[session.currentQuestionIndex];
  const evaluation = await evaluateAnswer(currentQ.question, answer, session.type);
  currentQ.userAnswer = answer;
  currentQ.feedback = evaluation.feedback;
  currentQ.score = evaluation.score;

  const maxQuestions = session.type === 'hr' ? 6 : 5;
  if (session.questions.length >= maxQuestions) {
    session.status = 'completed';
    await session.save();
    return res.json({ completed: true, sessionId: session._id, evaluation, message: 'Interview completed!' });
  }

  const nextQuestionData = await generateInterviewQuestion(session.type, session.questions, answer);
  session.questions.push({ question: nextQuestionData.question, userAnswer: '', feedback: '', score: 0 });
  session.currentQuestionIndex += 1;
  await session.save();

  res.json({
    completed: false, evaluation, nextQuestion: nextQuestionData.question,
    questionNumber: session.currentQuestionIndex + 1, totalQuestions: maxQuestions,
    category: nextQuestionData.category, difficulty: nextQuestionData.difficulty
  });
};

// @route POST /api/interview/end
export const endInterview = async (req, res) => {
  const { sessionId } = req.body;
  const session = await InterviewSession.findOne({ _id: sessionId, userId: req.user._id });
  if (!session) return res.status(404).json({ message: 'Session not found' });

  session.status = 'completed';
  const report = await generateInterviewReport({
    type: session.type,
    questions: session.questions.map(q => ({ question: q.question, answer: q.userAnswer, score: q.score }))
  });
  session.overallScore = report.overallScore || 0;
  session.report = {
    communication: report.communication || 0, confidence: report.confidence || 0,
    relevantAnswers: report.relevantAnswers || 0, problemSolving: report.problemSolving || 0,
    codeQuality: report.codeQuality || 0, explanation: report.explanation || 0,
    timeManagement: report.timeManagement || 0, improvements: report.improvements || []
  };
  await session.save();
  res.json({ session, report });
};

// @route GET /api/interview/history
export const getInterviewHistory = async (req, res) => {
  const sessions = await InterviewSession.find({ userId: req.user._id })
    .select('type status overallScore createdAt duration').sort('-createdAt');
  res.json(sessions);
};

// @route GET /api/interview/report/:id
export const getInterviewReport = async (req, res) => {
  const session = await InterviewSession.findOne({ _id: req.params.id, userId: req.user._id });
  if (!session) return res.status(404).json({ message: 'Session not found' });
  res.json(session);
};
