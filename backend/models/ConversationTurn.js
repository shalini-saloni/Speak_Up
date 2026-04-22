const mongoose = require('mongoose');

const conversationTurnSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  role: { type: String, enum: ['ai', 'user'], required: true },
  text: { type: String, required: true },
  durationSeconds: { type: Number },
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

module.exports = mongoose.model('ConversationTurn', conversationTurnSchema);
