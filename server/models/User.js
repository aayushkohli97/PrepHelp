import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  avatar: {
    type: String,
    default: ''
  },
  codingProfiles: {
    leetcode:    { type: String, default: '' },
    codechef:    { type: String, default: '' },
    hackerrank:  { type: String, default: '' },
    codeforces:  { type: String, default: '' }
  },

  // ✅ NEW: Contest ratings per platform (used for leaderboard sorting)
  contestRating: {
    leetcode:   { type: Number, default: 0, min: 0 },
    codeforces: { type: Number, default: 0, min: 0 },
    codechef:   { type: Number, default: 0, min: 0 },
    hackerrank: { type: Number, default: 0, min: 0 }
  },

  placementScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  prepCoins: {
    type: Number,
    default: 100,
    min: 0
  },
  weeklyQuestionsSolved: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Hash password before save
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);