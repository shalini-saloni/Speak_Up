const express = require('express');
const { requireAuth } = require('./auth');

const AuthController = require('./controllers/AuthController');
const UserController = require('./controllers/UserController');
const AIController = require('./controllers/AIController');
const ExerciseController = require('./controllers/ExerciseController');
const ForumController = require('./controllers/ForumController');
const PracticeController = require('./controllers/PracticeController');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'SpeakUp API is running successfully.' });
});

// Auth
router.post('/auth/signup', (req, res) => AuthController.signup(req, res));
router.post('/auth/login', (req, res) => AuthController.login(req, res));

// User / Me
router.get('/me', requireAuth, (req, res) => UserController.me(req, res));
router.patch('/me', requireAuth, (req, res) => UserController.updateProfile(req, res));
router.get('/me/stats', requireAuth, (req, res) => UserController.stats(req, res));

// AI
router.post('/ai/analyze', requireAuth, (req, res) => AIController.analyze(req, res));
router.post('/ai/transcribe', requireAuth, (req, res) => AIController.transcribe(req, res));
router.post('/ai/bitmoji', requireAuth, (req, res) => AIController.bitmoji(req, res));

// Exercises
router.get('/exercises', (req, res) => ExerciseController.list(req, res));
router.get('/exercises/:id', (req, res) => ExerciseController.details(req, res));
router.post('/exercises/:id/complete', requireAuth, (req, res) => ExerciseController.complete(req, res));

// Forum
router.get('/forum/posts', (req, res) => ForumController.listPosts(req, res));
router.post('/forum/posts', requireAuth, (req, res) => ForumController.createPost(req, res));
router.get('/forum/posts/:id', (req, res) => ForumController.postDetails(req, res));
router.post('/forum/posts/:id/comments', requireAuth, (req, res) => ForumController.addComment(req, res));

// Practice Sessions
router.get('/practice-sessions', requireAuth, (req, res) => PracticeController.listSessions(req, res));
router.post('/practice-sessions', requireAuth, (req, res) => PracticeController.createSession(req, res));
router.get('/practice-topics', (req, res) => PracticeController.getTopics(req, res));
router.post('/conversations', requireAuth, (req, res) => PracticeController.startConvo(req, res));
router.post('/conversations/:id/turns', requireAuth, (req, res) => PracticeController.addTurn(req, res));
router.post('/conversations/:id/finish', requireAuth, (req, res) => PracticeController.finishStats(req, res));

module.exports = { router };

