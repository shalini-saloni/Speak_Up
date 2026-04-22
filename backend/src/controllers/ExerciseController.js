const BaseController = require('./BaseController');
const { Exercise, ExerciseCompletion } = require('../../models');
const UserService = require('../services/UserService');

class ExerciseController extends BaseController {
  async list(req, res) {
    try {
      const items = await Exercise.find().sort({ title: 1 });
      return this.sendSuccess(res, items);
    } catch (err) {
      return this.handleError(res, err);
    }
  }

  async details(req, res) {
    try {
      const ex = await Exercise.findById(req.params.id);
      if (!ex) return this.sendError(res, 'Exercise not found', 404);
      return this.sendSuccess(res, ex);
    } catch (err) {
      return this.handleError(res, err);
    }
  }

  async complete(req, res) {
    try {
      const ex = await Exercise.findById(req.params.id);
      if (!ex) return this.sendError(res, 'Exercise not found', 404);

      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const tomorrowStart = new Date(todayStart);
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);

      const existingToday = await ExerciseCompletion.findOne({
        userId: req.auth.sub,
        exerciseId: ex._id,
        completedAt: { $gte: todayStart, $lt: tomorrowStart },
      });

      if (!existingToday) {
        await ExerciseCompletion.create({
          userId: req.auth.sub,
          exerciseId: ex._id,
          completedAt: now
        });
        await UserService.awardXpAndStreak(req.auth.sub, 10);
      } else {
        await UserService.awardXpAndStreak(req.auth.sub, 0);
      }

      const user = await UserService.getProfile(req.auth.sub);
      return this.sendSuccess(res, {
        completed: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          fearLevel: user.fearLevel,
          xp: user.xp,
          streak: user.streak,
          avatarUrl: user.avatarUrl
        }
      });
    } catch (err) {
      return this.handleError(res, err);
    }
  }
}

module.exports = new ExerciseController();
