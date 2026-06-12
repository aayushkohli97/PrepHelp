import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  isRolledOver: {
    type: Boolean,
    default: false
  },
  rolledOverToNext: {
    type: Boolean,
    default: false
  }
}, { _id: true });

const prepTrackSchema = new mongoose.Schema({
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
  tasks: {
    type: [taskSchema],
    default: []
  },
  betAmount: {
    type: Number,
    required: true,
    min: 0
  },
  startTime: {
    type: Date,
    default: null
  },
  endTime: {
    type: Date,
    default: null
  },
  submittedAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'evaluated', 'failed'],
    default: 'draft'
  },
  earnedCoins: {
    type: Number,
    default: 0
  },
  aiFeedback: {
    type: String,
    default: ''
  },
  completionScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, { timestamps: true });

// Index for efficient querying
prepTrackSchema.index({ userId: 1, status: 1 });
prepTrackSchema.index({ userId: 1, type: 1, createdAt: -1 });

export default mongoose.model('PrepTrack', prepTrackSchema);
