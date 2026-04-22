const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  durationMinutes: { type: Number, required: true },
  description: { type: String, required: true },
  steps: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Exercise', exerciseSchema);
