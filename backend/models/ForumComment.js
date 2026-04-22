const mongoose = require('mongoose');

const forumCommentSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumPost', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true },
  upvotes: { type: Number, default: 0 },
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

forumCommentSchema.virtual('User').get(function() {
  return this.userId;
});

module.exports = mongoose.model('ForumComment', forumCommentSchema);
