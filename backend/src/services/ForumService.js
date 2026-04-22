const BaseService = require('./BaseService');
const ForumPost = require('../../models/ForumPost');
const ForumComment = require('../../models/ForumComment');
const User = require('../../models/User');

class ForumService extends BaseService {
  async getAllPosts() {
    return await ForumPost.find()
      .populate('userId', 'id name')
      .sort({ isPinned: -1, createdAt: -1 });
  }

  async createPost(userId, { title, body, tags }) {
    if (!title || !body) {
      const error = new Error('title and body are required');
      error.statusCode = 400;
      throw error;
    }

    const post = await ForumPost.create({
      userId,
      title,
      body,
      tags: Array.isArray(tags) ? tags : [],
    });

    return await ForumPost.findById(post._id).populate('userId', 'id name');
  }

  async getPostById(postId) {
    const post = await ForumPost.findById(postId).populate('userId', 'id name');
    if (!post) {
      const error = new Error('Post not found');
      error.statusCode = 404;
      throw error;
    }

    const comments = await ForumComment.find({ postId: post._id })
      .populate('userId', 'id name')
      .sort({ createdAt: 1 });

    return { post, comments };
  }

  async addComment(userId, postId, body) {
    if (!body) {
      const error = new Error('body is required');
      error.statusCode = 400;
      throw error;
    }

    const post = await ForumPost.findById(postId);
    if (!post) {
      const error = new Error('Post not found');
      error.statusCode = 404;
      throw error;
    }

    const comment = await ForumComment.create({
      postId,
      userId,
      body
    });

    return await ForumComment.findById(comment._id).populate('userId', 'id name');
  }
}

module.exports = new ForumService();
