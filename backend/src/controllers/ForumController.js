const BaseController = require('./BaseController');
const ForumService = require('../services/ForumService');
const UserService = require('../services/UserService');

class ForumController extends BaseController {
  async listPosts(req, res) {
    try {
      const posts = await ForumService.getAllPosts();
      return this.sendSuccess(res, posts);
    } catch (err) {
      return this.handleError(res, err);
    }
  }

  async createPost(req, res) {
    try {
      const post = await ForumService.createPost(req.auth.sub, req.body);
      await UserService.awardXpAndStreak(req.auth.sub, 5);
      return this.sendSuccess(res, post, 201);
    } catch (err) {
      return this.handleError(res, err);
    }
  }

  async postDetails(req, res) {
    try {
      const details = await ForumService.getPostById(req.params.id);
      return this.sendSuccess(res, details);
    } catch (err) {
      return this.handleError(res, err);
    }
  }

  async addComment(req, res) {
    try {
      const { body } = req.body || {};
      const comment = await ForumService.addComment(req.auth.sub, req.params.id, body);
      await UserService.awardXpAndStreak(req.auth.sub, 2);
      return this.sendSuccess(res, comment, 201);
    } catch (err) {
      return this.handleError(res, err);
    }
  }
}

module.exports = new ForumController();
