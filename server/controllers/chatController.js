import ChatConversation from '../models/ChatConversation.js';
import { studyChat } from '../services/geminiService.js';
import CodingProfile from '../models/CodingProfile.js';

// @route POST /api/chat/message
export const sendMessage = async (req, res) => {
  const { message, conversationId } = req.body;
  if (!message) return res.status(400).json({ message: 'Message is required' });

  let conversation;
  if (conversationId) {
    conversation = await ChatConversation.findOne({ _id: conversationId, userId: req.user._id });
  }
  if (!conversation) {
    const title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
    conversation = await ChatConversation.create({ userId: req.user._id, title, messages: [] });
  }

  // Get user's weak topics
  const profiles = await CodingProfile.find({ userId: req.user._id });
  const weakTopics = [];
  profiles.forEach(p => {
    (p.stats.topicWise || []).forEach(t => { if (t.solved < 5) weakTopics.push(t.topic); });
  });

  const history = conversation.messages.slice(-10);
  conversation.messages.push({ role: 'user', content: message, timestamp: new Date() });

  const aiResponse = await studyChat(message, history, weakTopics);
  conversation.messages.push({ role: 'assistant', content: aiResponse, timestamp: new Date() });
  await conversation.save();

  res.json({
    conversationId: conversation._id,
    message: { role: 'assistant', content: aiResponse, timestamp: new Date() }
  });
};

// @route GET /api/chat/conversations
export const getConversations = async (req, res) => {
  const conversations = await ChatConversation.find({ userId: req.user._id })
    .select('title topic createdAt updatedAt').sort('-updatedAt');
  res.json(conversations);
};

// @route GET /api/chat/conversations/:id
export const getConversation = async (req, res) => {
  const conversation = await ChatConversation.findOne({ _id: req.params.id, userId: req.user._id });
  if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
  res.json(conversation);
};

// @route DELETE /api/chat/conversations/:id
export const deleteConversation = async (req, res) => {
  const conversation = await ChatConversation.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
  res.json({ message: 'Conversation deleted' });
};
