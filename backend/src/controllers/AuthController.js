const BaseController = require('./BaseController');
const AuthService = require('../services/AuthService');

class AuthController extends BaseController {
  async signup(req, res) {
    try {
      const { name, email, password } = req.body || {};
      if (!name || !email || !password) {
        return this.sendError(res, 'name, email, password are required', 400);
      }

      const result = await AuthService.signup(name, email, password);
      return this.sendSuccess(res, result);
    } catch (err) {
      return this.handleError(res, err);
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return this.sendError(res, 'email and password are required', 400);
      }

      const result = await AuthService.login(email, password);
      return this.sendSuccess(res, result);
    } catch (err) {
      return this.handleError(res, err);
    }
  }
}

module.exports = new AuthController();
