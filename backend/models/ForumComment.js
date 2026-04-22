const mongoose = require('mongoose');

const forumCommentSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumPost', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true },
  upvotes: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('ForumComment', forumCommentSchema);
