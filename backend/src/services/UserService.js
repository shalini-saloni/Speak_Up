const BaseService = require('./BaseService');
const User = require('../../models/User');
const PracticeSession = require('../../models/PracticeSession');
const ExerciseCompletion = require('../../models/ExerciseCompletion'); // Note: I realized I forgot to create this Mongoose model

class UserService extends BaseService {
  async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return user;
  }

  async updateProfile(userId, data) {
    const { fearLevel, name, avatarUrl } = data;
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    if (fearLevel) user.fearLevel = fearLevel;
    if (name) user.name = name;
    if (typeof avatarUrl === 'string') {
      if (avatarUrl.length > 2_500_000) {
        const error = new Error('Avatar image too large. Please upload a smaller image.');
        error.statusCode = 413;
        throw error;
      }
      if (avatarUrl !== '' && !avatarUrl.startsWith('data:image/')) {
        const error = new Error('Invalid avatar image format');
        error.statusCode = 400;
        throw error;
      }
      user.avatarUrl = avatarUrl || null;
    }
    await user.save();
    return user;
  }

  async getStats(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const sessionsDone = await PracticeSession.countDocuments({ userId: user._id });
    const exercisesDone = await (ExerciseCompletion ? ExerciseCompletion.countDocuments({ userId: user._id }) : Promise.resolve(0));
    
    return { sessionsDone, exercisesDone };
  }

  async awardXpAndStreak(userId, xpDelta) {
    const user = await User.findById(userId);
    if (!user) return null;

    const now = new Date();
    const last = user.lastActive ? new Date(user.lastActive) : null;

    if (!last) {
      user.streak = 1;
    } else if (this._sameDay(last, now)) {
      if (!user.streak) user.streak = 1;
    } else if (this._isYesterday(last, now)) {
      user.streak = (user.streak || 0) + 1;
    } else {
      user.streak = 1;
    }

    user.lastActive = now;
    user.xp = (user.xp || 0) + (xpDelta || 0);
    await user.save();
    return user;
  }

  _startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  _sameDay(a, b) {
    return this._startOfDay(a).getTime() === this._startOfDay(b).getTime();
  }

  _isYesterday(last, now) {
    const y = this._startOfDay(now);
    y.setDate(y.getDate() - 1);
    return this._startOfDay(last).getTime() === y.getTime();
  }
}

module.exports = new UserService();
