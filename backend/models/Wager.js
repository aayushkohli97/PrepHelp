import mongoose from 'mongoose';

const wagerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  },
  targetQuestions: {
    type: Number,
    required: true,
    min: 1
  },
  betAmount: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'failed'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  completedQuestions: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

export default mongoose.model('Wager', wagerSchema);
