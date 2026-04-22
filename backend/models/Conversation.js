const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic: { type: String, required: true },
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  finalFeedback: { type: mongoose.Schema.Types.Mixed }, // JSON storage
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
