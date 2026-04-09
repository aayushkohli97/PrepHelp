import mongoose from 'mongoose';

const topicStatSchema = new mongoose.Schema({
  topic: String,
  solved: { type: Number, default: 0 },
  total: { type: Number, default: 0 }
}, { _id: false });

const codingProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    enum: ['leetcode', 'codechef', 'hackerrank', 'codeforces'],
    required: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  stats: {
    totalSolved: { type: Number, default: 0 },
    easySolved: { type: Number, default: 0 },
    mediumSolved: { type: Number, default: 0 },
    hardSolved: { type: Number, default: 0 },
    ranking: { type: Number, default: 0 },
    contestRating: { type: Number, default: 0 },
    totalProblems: { type: Number, default: 0 },
    stars: { type: String, default: '' },
    badges: { type: Number, default: 0 },
    topicWise: [topicStatSchema],
    ratingWise: [{ rating: Number, count: { type: Number, default: 0 } }]
  },
  lastFetched: {
    type: Date,
    default: Date.now
  },
  rawData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

codingProfileSchema.index({ userId: 1, platform: 1 }, { unique: true });

export default mongoose.model('CodingProfile', codingProfileSchema);
