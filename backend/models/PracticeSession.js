const mongoose = require('mongoose');

const practiceSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionType: { type: String, enum: ['free_speech', 'structured_topic', 'timed_challenge'], required: true },
  topic: { type: String },
  durationSeconds: { type: Number, required: true },
  transcript: { type: String, required: true },
  metrics: {
    fillerWordsCount: { type: Number, default: 0 },
    wpm: { type: Number, default: 0 },
    clarityScore: { type: Number, default: 0 }, // 0-100 scale
    confidenceScore: { type: Number, default: 0 } // 0-100 scale
  },
  aiFeedbackTips: [{ type: String }],
}, { 
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('PracticeSession', practiceSessionSchema);
