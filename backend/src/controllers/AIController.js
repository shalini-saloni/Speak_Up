const BaseController = require('./BaseController');
const AIService = require('../services/AIService');
const UserService = require('../services/UserService');

class AIController extends BaseController {
  async analyze(req, res) {
    try {
      const { transcript, durationSeconds, sessionType, topic } = req.body || {};
      if (!transcript || !durationSeconds) {
        return this.sendError(res, 'transcript and durationSeconds are required', 400);
      }

      const analysis = await AIService.analyzeSpeech({
        transcript,
        durationSeconds,
        sessionType,
        topic,
      });
      return this.sendSuccess(res, analysis);
    } catch (err) {
      return this.handleError(res, err);
    }
  }

  async transcribe(req, res) {
    try {
      const { audioBase64, mimeType } = req.body || {};
      if (!audioBase64 || !mimeType) {
        return this.sendError(res, 'audioBase64 and mimeType are required', 400);
      }

      const transcript = await AIService.transcribeAudio({ audioBase64, mimeType });
      return this.sendSuccess(res, { transcript });
    } catch (err) {
      return this.handleError(res, err);
    }
  }

  async bitmoji(req, res) {
    try {
      const user = await UserService.getProfile(req.auth.sub);
      const svg = await AIService.generateBitmojiSvg({ name: user.name });
      
      user.avatarSvg = svg;
      await user.save();
      
      return this.sendSuccess(res, { avatarSvg: user.avatarSvg });
    } catch (err) {
      return this.handleError(res, err);
    }
  }
}

module.exports = new AIController();
