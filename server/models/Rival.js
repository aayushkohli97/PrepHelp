import mongoose from 'mongoose';

const rivalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rival: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure a user can only add the same rival once
rivalSchema.index({ user: 1, rival: 1 }, { unique: true });

export default mongoose.model('Rival', rivalSchema);
