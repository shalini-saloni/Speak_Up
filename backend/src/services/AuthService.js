const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const BaseService = require('./BaseService');
const User = require('../../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

class AuthService extends BaseService {
  async signup(name, email, password) {
    const existing = await User.findOne({ email });
    if (existing) {
      const error = new Error('Email already in use');
      error.statusCode = 409;
      throw error;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: passwordHash });
    
    const token = this.signToken({ sub: user._id });
    return { token, user: this.formatUser(user) };
  }

  async login(email, password) {
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    const token = this.signToken({ sub: user._id });
    return { token, user: this.formatUser(user) };
  }

  signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  formatUser(user) {
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      fearLevel: user.fearLevel,
      xp: user.xp,
      streak: user.streak,
    };
  }
}

module.exports = new AuthService();
