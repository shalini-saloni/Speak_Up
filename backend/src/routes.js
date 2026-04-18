const express = require('express');
const bcrypt = require('bcryptjs');

const { signAccessToken, requireAuth } = require('./auth');
const { User, Exercise, ForumPost, ForumComment, PracticeSession, ExerciseCompletion, Conversation, ConversationTurn } = require('./models');
const { analyzeSpeechWithGemini, generateBitmojiSvg, transcribeAudioWithGemini, generateNextQuestionWithGemini } = require('./ai');

const router = express.Router();

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function sameDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function isYesterday(last, now) {
  const y = startOfDay(now);
  y.setDate(y.getDate() - 1);
  return startOfDay(last).getTime() === y.getTime();
}

async function awardXpAndStreak(userId, xpDelta) {
  const user = await User.findByPk(userId);
  if (!user) return null;

  const now = new Date();
  const last = user.lastActive ? new Date(user.lastActive) : null;

  if (!last) {
    user.streak = 1;
  } else if (sameDay(last, now)) {
    if (!user.streak) user.streak = 1;
  } else if (isYesterday(last, now)) {
    user.streak = (user.streak || 0) + 1;
  } else {
    user.streak = 1;
  }

  user.lastActive = now;
  user.xp = (user.xp || 0) + (xpDelta || 0);
  await user.save();
  return user;
}

router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'SpeakUp API is running successfully.' });
});

// Auth
router.post('/auth/signup', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password are required' });

  const existing = await User.findOne({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already in use' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash });
  const token = signAccessToken({ sub: user.id });

  res.json({ token, user: { id: user.id, name: user.name, email: user.email, fearLevel: user.fearLevel, xp: user.xp, streak: user.streak, avatarSvg: user.avatarSvg, avatarUrl: user.avatarUrl } });
});

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signAccessToken({ sub: user.id });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, fearLevel: user.fearLevel, xp: user.xp, streak: user.streak, avatarSvg: user.avatarSvg, avatarUrl: user.avatarUrl } });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findByPk(req.auth.sub);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, name: user.name, email: user.email, fearLevel: user.fearLevel, xp: user.xp, streak: user.streak, avatarSvg: user.avatarSvg, avatarUrl: user.avatarUrl, createdAt: user.createdAt });
});

router.patch('/me', requireAuth, async (req, res) => {
  const { fearLevel, name, avatarUrl } = req.body || {};
  const user = await User.findByPk(req.auth.sub);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (fearLevel) user.fearLevel = fearLevel;
  if (name) user.name = name;
  if (typeof avatarUrl === 'string') {
    if (avatarUrl.length > 2_500_000) return res.status(413).json({ error: 'Avatar image too large. Please upload a smaller image.' });
    if (avatarUrl !== '' && !avatarUrl.startsWith('data:image/')) return res.status(400).json({ error: 'Invalid avatar image format' });
    user.avatarUrl = avatarUrl || null;
    // If user uploads their own photo, keep AI SVG optional but don't force it.
  }
  await user.save();

  res.json({ id: user.id, name: user.name, email: user.email, fearLevel: user.fearLevel, xp: user.xp, streak: user.streak, avatarSvg: user.avatarSvg, avatarUrl: user.avatarUrl, createdAt: user.createdAt });
});

router.get('/me/stats', requireAuth, async (req, res) => {
  const user = await User.findByPk(req.auth.sub);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const sessionsDone = await PracticeSession.count({ where: { userId: user.id } });
  const exercisesDone = await ExerciseCompletion.count({ where: { userId: user.id } });
  console.log(`[Stats] User ${user.id}: sessions=${sessionsDone}, exercises=${exercisesDone}`);
  res.json({ sessionsDone, exercisesDone });
});

// AI
router.post('/ai/analyze', requireAuth, async (req, res) => {
  const { transcript, durationSeconds, sessionType, topic } = req.body || {};
  if (!transcript || typeof transcript !== 'string') return res.status(400).json({ error: 'transcript is required' });
  if (!durationSeconds) return res.status(400).json({ error: 'durationSeconds is required' });

  try {
    const analysis = await analyzeSpeechWithGemini({
      transcript,
      durationSeconds,
      sessionType,
      topic,
    });
    res.json(analysis);
  } catch (err) {
    res.status(err.statusCode || 503).json({ error: err.message || 'AI analysis failed' });
  }
});

router.post('/ai/transcribe', requireAuth, async (req, res) => {
  const { audioBase64, mimeType } = req.body || {};
  if (!audioBase64 || !mimeType) return res.status(400).json({ error: 'audioBase64 and mimeType are required' });

  try {
    const transcript = await transcribeAudioWithGemini({ base64Audio: audioBase64, mimeType });
    res.json({ transcript });
  } catch (err) {
    res.status(err.statusCode || 503).json({ error: err.message || 'Transcription failed' });
  }
});

router.post('/ai/bitmoji', requireAuth, async (req, res) => {
  const user = await User.findByPk(req.auth.sub);
  if (!user) return res.status(404).json({ error: 'User not found' });

  try {
    const svg = await generateBitmojiSvg({ name: user.name });
    user.avatarSvg = svg;
    await user.save();
    res.json({ avatarSvg: user.avatarSvg });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'Avatar generation failed' });
  }
});

// Exercises
router.get('/exercises', async (req, res) => {
  const items = await Exercise.findAll({ order: [['title', 'ASC']] });
  res.json(items);
});

router.get('/exercises/:id', async (req, res) => {
  const ex = await Exercise.findByPk(req.params.id);
  if (!ex) return res.status(404).json({ error: 'Exercise not found' });
  res.json(ex);
});

router.post('/exercises/:id/complete', requireAuth, async (req, res) => {
  const ex = await Exercise.findByPk(req.params.id);
  if (!ex) return res.status(404).json({ error: 'Exercise not found' });

  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const existingToday = await ExerciseCompletion.findOne({
    where: {
      userId: req.auth.sub,
      exerciseId: ex.id,
      completedAt: { [require('sequelize').Op.gte]: todayStart, [require('sequelize').Op.lt]: tomorrowStart },
    },
  });

  if (!existingToday) {
    await ExerciseCompletion.create({ userId: req.auth.sub, exerciseId: ex.id, completedAt: now });
    await awardXpAndStreak(req.auth.sub, 10);
  } else {
    await awardXpAndStreak(req.auth.sub, 0);
  }

  const user = await User.findByPk(req.auth.sub);
  res.json({ completed: true, user: { id: user.id, name: user.name, email: user.email, fearLevel: user.fearLevel, xp: user.xp, streak: user.streak, avatarSvg: user.avatarSvg, avatarUrl: user.avatarUrl } });
});

// Forum
router.get('/forum/posts', async (req, res) => {
  const posts = await ForumPost.findAll({
    include: [{ model: User, attributes: ['id', 'name'] }],
    order: [['isPinned', 'DESC'], ['createdAt', 'DESC']],
  });
  res.json(posts);
});

router.post('/forum/posts', requireAuth, async (req, res) => {
  const { title, body, tags } = req.body || {};
  if (!title || !body) return res.status(400).json({ error: 'title and body are required' });

  const post = await ForumPost.create({
    userId: req.auth.sub,
    title,
    body,
    tags: Array.isArray(tags) ? tags : [],
  });
  const created = await ForumPost.findByPk(post.id, { include: [{ model: User, attributes: ['id', 'name'] }] });
  await awardXpAndStreak(req.auth.sub, 5);
  res.status(201).json(created);
});

router.get('/forum/posts/:id', async (req, res) => {
  const post = await ForumPost.findByPk(req.params.id, { include: [{ model: User, attributes: ['id', 'name'] }] });
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const comments = await ForumComment.findAll({
    where: { postId: post.id },
    include: [{ model: User, attributes: ['id', 'name'] }],
    order: [['createdAt', 'ASC']],
  });

  res.json({ post, comments });
});

router.post('/forum/posts/:id/comments', requireAuth, async (req, res) => {
  const { body } = req.body || {};
  if (!body) return res.status(400).json({ error: 'body is required' });

  const post = await ForumPost.findByPk(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const comment = await ForumComment.create({ postId: post.id, userId: req.auth.sub, body });
  const created = await ForumComment.findByPk(comment.id, { include: [{ model: User, attributes: ['id', 'name'] }] });
  await awardXpAndStreak(req.auth.sub, 2);
  res.status(201).json(created);
});

// Practice sessions
router.get('/practice-sessions', requireAuth, async (req, res) => {
  const sessions = await PracticeSession.findAll({
    where: { userId: req.auth.sub },
    order: [['createdAt', 'DESC']],
    limit: 50,
  });
  res.json(sessions);
});

router.post('/practice-sessions', requireAuth, async (req, res) => {
  const { sessionType, topic, durationSeconds, transcript } = req.body || {};
  if (!sessionType || !durationSeconds) return res.status(400).json({ error: 'sessionType and durationSeconds are required' });
  if (!transcript || typeof transcript !== 'string' || !transcript.trim()) return res.status(400).json({ error: 'transcript is required' });

  let analysis;
  try {
    analysis = await analyzeSpeechWithGemini({
      transcript,
      durationSeconds,
      sessionType,
      topic,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ error: err.message || 'AI analysis failed' });
  }

  const created = await PracticeSession.create({
    userId: req.auth.sub,
    sessionType,
    topic: topic || null,
    durationSeconds,
    transcript: transcript.trim(),
    metrics: analysis.metrics,
    aiFeedbackTips: analysis.tips,
  });

  await awardXpAndStreak(req.auth.sub, 20);
  res.status(201).json(created);
});

// Conversation practice (AI asks, user speaks)
router.get('/practice-topics', async (req, res) => {
  res.json([
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
  ]);
});

router.post('/conversations', requireAuth, async (req, res) => {
  const { topicId } = req.body || {};
  if (!topicId) return res.status(400).json({ error: 'topicId is required' });
  const convo = await Conversation.create({ userId: req.auth.sub, topic: topicId, status: 'active' });

  // First AI question (simple deterministic starter)
  const firstQuestionMap = {
    hometown: 'Tell me about your hometown. What do you like most about it?',
    education: 'What did you study, and what is one thing you learned that you still use today?',
    hobbies: 'What is your favorite hobby and how did you start it?',
    movies: 'What is your favorite movie and why does it stand out to you?',
    lifestyle: 'Describe your daily routine and one habit you want to improve.',
    family: 'Tell me about your family and one tradition you enjoy.',
    travel: 'Where did you last travel and what was the best moment of the trip?',
    technology: 'What technology do you use daily, and how does it help you?',
    career: 'What do you do for work or study, and what do you enjoy about it?',
    health: 'What’s one healthy habit you’re trying to build, and what makes it hard or easy?',
    leadership: 'Tell me about a time you led or helped a group—what did you learn?',
  };
  const question = firstQuestionMap[topicId] || 'Introduce yourself in 30 seconds.';
  await ConversationTurn.create({ conversationId: convo.id, role: 'ai', text: question });
  res.status(201).json({ conversationId: convo.id, question });
});

router.post('/conversations/:id/turns', requireAuth, async (req, res) => {
  const { text, durationSeconds } = req.body || {};
  if (!text || typeof text !== 'string') return res.status(400).json({ error: 'text is required' });
  const convo = await Conversation.findByPk(req.params.id);
  if (!convo || convo.userId !== req.auth.sub) return res.status(404).json({ error: 'Conversation not found' });
  if (convo.status !== 'active') return res.status(400).json({ error: 'Conversation is not active' });

  await ConversationTurn.create({
    conversationId: convo.id,
    role: 'user',
    text: text.trim(),
    durationSeconds: durationSeconds || null,
  });

  // Next AI question (topic-aware)
  const turns = await ConversationTurn.count({ where: { conversationId: convo.id, role: 'user' } });
  const canned = {
    hometown: [
      'What is one hidden gem in your hometown and why?',
      'Describe a memorable moment you had there.',
      'What would you recommend a visitor do in one day?',
    ],
    education: [
      'What was your hardest subject and how did you handle it?',
      'Share a project or achievement you are proud of.',
      'How has your education shaped your career goals?',
    ],
    hobbies: [
      'What do you enjoy most about this hobby?',
      'Describe one time you improved or learned something new.',
      'What would you say to someone who wants to start?',
    ],
    movies: [
      'Which character do you relate to most, and why?',
      'Describe one scene that you still remember clearly.',
      'What lesson or theme does the movie teach?',
    ],
    lifestyle: [
      'What is one habit that boosts your energy?',
      'Describe a challenge in your routine and how you manage it.',
      'What small change would improve your day most?',
    ],
    family: [
      'What tradition matters most to your family?',
      'Share a moment that made you feel proud of your family.',
      'What value did your family teach you?',
    ],
    travel: [
      'What surprised you most on that trip?',
      'Describe a local food or place you loved.',
      'Where would you travel next, and why?',
    ],
    technology: [
      'What’s one app or tool you couldn’t live without, and why?',
      'Describe a time technology saved you time or reduced stress.',
      'What tech skill would you like to learn next?',
    ],
    career: [
      'What’s the biggest challenge in your work or studies right now?',
      'Tell me about a project you’re proud of and your role in it.',
      'What’s one goal you want to achieve in the next year?',
    ],
    health: [
      'What does a “good day” of habits look like for you?',
      'How do you stay consistent when motivation drops?',
      'What’s one small change you can start this week?',
    ],
    leadership: [
      'How do you handle disagreements in a group?',
      'Describe your communication style when coordinating with others.',
      'What leadership skill do you want to improve next?',
    ],
  };

  let nextQ;
  try {
    nextQ = await generateNextQuestionWithGemini({
      topicId: convo.topic,
      turnIndex: turns,
      lastAnswer: text.trim(),
    });
  } catch {
    const list = canned[convo.topic] || [
      'What challenge do you face related to this topic, and how do you handle it?',
      'Can you share a specific example that illustrates your point?',
      'What advice would you give someone about this topic?',
    ];
    nextQ = list[Math.min(list.length - 1, Math.max(0, turns - 1))];
  }
  await ConversationTurn.create({ conversationId: convo.id, role: 'ai', text: nextQ });
  res.json({ question: nextQ, turnCount: turns });
});

router.post('/conversations/:id/finish', requireAuth, async (req, res) => {
  const convo = await Conversation.findByPk(req.params.id);
  if (!convo || convo.userId !== req.auth.sub) return res.status(404).json({ error: 'Conversation not found' });

  // Avoid duplicate saves/XP if the user retries the finish call.
  if (convo.status === 'completed' && convo.finalFeedback) {
    return res.json({ conversationId: convo.id, feedback: convo.finalFeedback });
  }

  try {
    const turns = await ConversationTurn.findAll({
      where: { conversationId: convo.id },
      order: [['createdAt', 'ASC']],
    });

    const fullText = turns.map((t) => `${t.role === 'ai' ? 'Coach' : 'User'}: ${t.text}`).join('\n');
    const totalDuration = turns.reduce((acc, t) => acc + Number(t.durationSeconds || 0), 0) || 60;

    // Deterministic metrics
    const words = fullText.replace(/Coach:\s.*\n?/g, '').trim().split(/\s+/).filter(Boolean);
    const wpm = Math.round((words.length / Math.max(1, totalDuration)) * 60);
    const fillerMatches = fullText.match(/\b(um|uh|like|you know|actually|basically)\b/gi) || [];
    const fillerWordsCount = fillerMatches.length;

    // GEMINI ANALYSIS
    let feedback;
    try {
      console.log(`[PracticeSession] Analyzing session for user ${req.auth.sub}...`);
      const analysis = await analyzeSpeechWithGemini({
        transcript: fullText,
        durationSeconds: totalDuration,
        sessionType: 'structured_topic',
        topic: convo.topic,
      });

      feedback = {
        metrics: {
          fillerWordsCount,
          wpm,
          clarityScore: analysis.metrics.clarityScore,
          confidenceScore: analysis.metrics.confidenceScore,
        },
        tips: analysis.tips,
      };
    } catch (err) {
      console.error('[PracticeSession] AI analysis failed, using fallbacks:', err.message);
      // Fallback feedback so the session is NOT lost.
      feedback = {
        metrics: {
          fillerWordsCount,
          wpm,
          clarityScore: 70, // Neutral fallback
          confidenceScore: 70,
        },
        tips: [
          'Great job completing your session! Your detailed metrics will appear in future practice.',
          'Focus on maintaining a steady pace and clear articulation.',
          'Keep practicing consistent topics to see your progress trends.',
        ],
      };
    }

    // Persist session record first
    const ps = await PracticeSession.create({
      userId: req.auth.sub,
      sessionType: 'structured_topic',
      topic: convo.topic || null,
      durationSeconds: totalDuration,
      transcript: fullText,
      metrics: feedback.metrics,
      aiFeedbackTips: feedback.tips,
    });

    console.log(`[PracticeSession] Created session ${ps.id} for user ${req.auth.sub}`);

    // Update conversation status
    convo.status = 'completed';
    convo.finalFeedback = feedback;
    await convo.save();

    // Award rewards
    await awardXpAndStreak(req.auth.sub, 30);

    res.json({ conversationId: convo.id, feedback });
  } catch (err) {
    console.error('[PracticeSession] Fatal error in finish route:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Failed to finish session' });
  }
});

module.exports = { router };

