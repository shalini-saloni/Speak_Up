const BaseController = require('./BaseController');
const UserService = require('../services/UserService');

class UserController extends BaseController {
  async me(req, res) {
    try {
      const user = await UserService.getProfile(req.auth.sub);
      return this.sendSuccess(res, {
        id: user.id,
        name: user.name,
        email: user.email,
        fearLevel: user.fearLevel,
        xp: user.xp,
        streak: user.streak,
        avatarSvg: user.avatarSvg,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt
      });
    } catch (err) {
      return this.handleError(res, err);
    }
  }

  async updateProfile(req, res) {
    try {
      const user = await UserService.updateProfile(req.auth.sub, req.body);
      return this.sendSuccess(res, {
        id: user.id,
        name: user.name,
        email: user.email,
        fearLevel: user.fearLevel,
        xp: user.xp,
        streak: user.streak,
        avatarSvg: user.avatarSvg,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt
      });
    } catch (err) {
      return this.handleError(res, err);
    }
  }

  async stats(req, res) {
    try {
      const stats = await UserService.getStats(req.auth.sub);
      return this.sendSuccess(res, stats);
    } catch (err) {
      return this.handleError(res, err);
    }
  }
}

module.exports = new UserController();
