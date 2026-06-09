import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  resources: {
    videos: [{ title: String, url: String }],
    articles: [{ title: String, url: String }],
    problems: [{ title: String, url: String, difficulty: String }],
    learningPath: [{ day: String, task: String }]
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const chatConversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: 'New Conversation'
  },
  messages: [messageSchema],
  topic: {
    type: String,
    default: 'general'
  }
}, {
  timestamps: true
});

export default mongoose.model('ChatConversation', chatConversationSchema);
