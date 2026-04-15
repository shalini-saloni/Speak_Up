const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Should be hashed via bcrypt
  name: { type: String, required: true },
  fearLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  xp: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
