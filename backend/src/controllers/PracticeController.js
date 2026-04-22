const BaseController = require('./BaseController');
const PracticeService = require('../services/PracticeService');
const UserService = require('../services/UserService');

class PracticeController extends BaseController {
  async listSessions(req, res) {
    try {
      const sessions = await PracticeService.getUserSessions(req.auth.sub);
      return this.sendSuccess(res, sessions);
    } catch (err) {
      return this.handleError(res, err);
    }
  }

  async createSession(req, res) {
    try {
      const session = await PracticeService.createSession(req.auth.sub, req.body);
      await UserService.awardXpAndStreak(req.auth.sub, 20);
      return this.sendSuccess(res, session, 201);
    } catch (err) {
      return this.handleError(res, err);
    }
  }

  async getTopics(req, res) {
    try {
      const topics = [
        { id: 'hometown', label: 'Hometown' },
        { id: 'education', label: 'Education' },
        { id: 'hobbies', label: 'Hobbies' },
        { id: 'movies', label: 'Movies' },
        { id: 'lifestyle', label: 'Lifestyle' },
        { id: 'family', label: 'Family' },
        { id: 'travel', label: 'Travel' },
        { id: 'technology', label: 'Technology' },
        { id: 'career', label: 'Career' },
        { id: 'health', label: 'Health & Habits' },
        { id: 'leadership', label: 'Leadership' },
      ];
      return this.sendSuccess(res, topics);
    } catch (err) {
      return this.handleError(res, err);
    }
  }

  async startConvo(req, res) {
    try {
      const { topicId } = req.body || {};
      const result = await PracticeService.startConversation(req.auth.sub, topicId);
      return this.sendSuccess(res, result, 201);
    } catch (err) {
      return this.handleError(res, err);
    }
  }

  async addTurn(req, res) {
    try {
      const result = await PracticeService.addConversationTurn(
        req.auth.sub,
        req.params.id,
        req.body
      );
      return this.sendSuccess(res, result);
    } catch (err) {
      return this.handleError(res, err);
    }
  }

  async finishStats(req, res) {
    try {
      const feedback = await PracticeService.finishConversation(req.auth.sub, req.params.id);
      await UserService.awardXpAndStreak(req.auth.sub, 30);
      return this.sendSuccess(res, { conversationId: req.params.id, feedback });
    } catch (err) {
      return this.handleError(res, err);
    }
  }
}

module.exports = new PracticeController();
