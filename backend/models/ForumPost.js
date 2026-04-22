const mongoose = require('mongoose');

const forumPostSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  tags: [{ type: String }],
  upvotes: { type: Number, default: 0 },
  isPinned: { type: Boolean, default: false },
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

forumPostSchema.virtual('User').get(function() {
  return this.userId;
});

module.exports = mongoose.model('ForumPost', forumPostSchema);
