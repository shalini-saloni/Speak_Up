const Exercise = require('../models/Exercise');
const ForumPost = require('../models/ForumPost');
const User = require('../models/User');

async function seedIfEmpty() {
  const desiredExercises = [
    {
      title: 'Box Breathing',
      category: 'Breathing',
      difficulty: 'Easy',
      durationMinutes: 5,
      description: 'A simple 4-4-4-4 breathing cycle to calm your nervous system.',
      steps: [
        'Inhale for 4 seconds',
        'Hold for 4 seconds',
        'Exhale for 4 seconds',
        'Hold for 4 seconds',
        'Repeat for 4–6 rounds',
      ],
    },
    {
      title: 'Tongue Twister Warm-up',
      category: 'Vocal Warm-ups',
      difficulty: 'Easy',
      durationMinutes: 3,
      description: 'Warm up articulation and reduce stumbling.',
      steps: [
        'Start slow: “Red leather, yellow leather”',
        'Increase speed gradually',
        'Repeat with clear consonants for 2 minutes',
      ],
    },
    {
      title: 'Confidence Posture Drill',
      category: 'Body Language',
      difficulty: 'Medium',
      durationMinutes: 8,
      description: 'Practice open posture, grounded stance, and steady gestures.',
      steps: [
        'Feet hip-width apart',
        'Shoulders relaxed, chin neutral',
        'Gesture on key words only',
      ],
    },
    {
      title: 'Pause & Punchline',
      category: 'Delivery',
      difficulty: 'Medium',
      durationMinutes: 6,
      description: 'Use deliberate pauses to sound confident and keep the listener engaged.',
      steps: [
        'Pick a short story (30–45 seconds)',
        'Mark 3 places where you will pause for 1–2 seconds',
        'Deliver the story and keep eye contact during pauses',
        'Repeat once with slower pacing',
      ],
    },
    {
      title: 'Story in 3 Sentences',
      category: 'Storytelling',
      difficulty: 'Easy',
      durationMinutes: 5,
      description: 'Practice structuring thoughts clearly: setup, conflict, resolution.',
      steps: [
        'Choose a simple moment from your day',
        'Say it in 3 sentences: setup → problem → outcome',
        'Repeat with stronger verbs and fewer filler words',
      ],
    },
    {
      title: 'Audience Scan Drill',
      category: 'Body Language',
      difficulty: 'Hard',
      durationMinutes: 7,
      description: 'Improve connection by scanning the room calmly while speaking.',
      steps: [
        'Stand tall and pick 3 imaginary audience points',
        'Speak while moving your gaze every 2–3 seconds',
        'Avoid rushing when switching gaze points',
      ],
    },
  ];

  for (const ex of desiredExercises) {
    const existing = await Exercise.findOne({ title: ex.title });
    if (!existing) await Exercise.create(ex);
  }

  const postCount = await ForumPost.countDocuments();
  if (postCount === 0) {
    const anyUser = await User.findOne();
    if (anyUser) {
      await ForumPost.create({
        userId: anyUser._id,
        title: 'Weekly Challenge: 30-second introduction',
        body: 'Record a 30-second introduction of yourself and share your biggest win this week. Keep it simple: name, role, and one thing you’re proud of.',
        tags: ['Challenge', 'Weekly'],
        isPinned: true,
      });
    }
  }
}

module.exports = { seedIfEmpty };

