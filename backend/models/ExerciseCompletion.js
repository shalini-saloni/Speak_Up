const mongoose = require('mongoose');

const exerciseCompletionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', required: true },
  completedAt: { type: Date, default: Date.now },
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

module.exports = mongoose.model('ExerciseCompletion', exerciseCompletionSchema);
