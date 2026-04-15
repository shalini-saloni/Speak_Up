const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    avatarSvg: { type: DataTypes.TEXT, allowNull: true },
    avatarUrl: { type: DataTypes.TEXT, allowNull: true },
    fearLevel: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
      allowNull: false,
      defaultValue: 'beginner',
    },
    xp: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    streak: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    lastActive: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { tableName: 'users' }
);

const Exercise = sequelize.define(
  'Exercise',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    category: { type: DataTypes.STRING, allowNull: false },
    difficulty: { type: DataTypes.ENUM('Easy', 'Medium', 'Hard'), allowNull: false },
    durationMinutes: { type: DataTypes.INTEGER, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    steps: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
  },
  { tableName: 'exercises' }
);

const ForumPost = sequelize.define(
  'ForumPost',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    tags: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    upvotes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    isPinned: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { tableName: 'forum_posts' }
);

const ForumComment = sequelize.define(
  'ForumComment',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    body: { type: DataTypes.TEXT, allowNull: false },
    upvotes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { tableName: 'forum_comments' }
);

const PracticeSession = sequelize.define(
  'PracticeSession',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    sessionType: {
      type: DataTypes.ENUM('free_speech', 'structured_topic', 'timed_challenge'),
      allowNull: false,
    },
    topic: { type: DataTypes.STRING, allowNull: true },
    durationSeconds: { type: DataTypes.INTEGER, allowNull: false },
    transcript: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    metrics: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
    aiFeedbackTips: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
  },
  { tableName: 'practice_sessions' }
);

const ExerciseCompletion = sequelize.define(
  'ExerciseCompletion',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    completedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { tableName: 'exercise_completions' }
);

const Conversation = sequelize.define(
  'Conversation',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    topic: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.ENUM('active', 'completed'), allowNull: false, defaultValue: 'active' },
    finalFeedback: { type: DataTypes.JSON, allowNull: true },
  },
  { tableName: 'conversations' }
);

const ConversationTurn = sequelize.define(
  'ConversationTurn',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    role: { type: DataTypes.ENUM('ai', 'user'), allowNull: false },
    text: { type: DataTypes.TEXT, allowNull: false },
    durationSeconds: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: 'conversation_turns' }
);

User.hasMany(PracticeSession, { foreignKey: 'userId' });
PracticeSession.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(ForumPost, { foreignKey: 'userId' });
ForumPost.belongsTo(User, { foreignKey: 'userId' });

ForumPost.hasMany(ForumComment, { foreignKey: 'postId' });
ForumComment.belongsTo(ForumPost, { foreignKey: 'postId' });

User.hasMany(ForumComment, { foreignKey: 'userId' });
ForumComment.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(ExerciseCompletion, { foreignKey: 'userId' });
ExerciseCompletion.belongsTo(User, { foreignKey: 'userId' });
Exercise.hasMany(ExerciseCompletion, { foreignKey: 'exerciseId' });
ExerciseCompletion.belongsTo(Exercise, { foreignKey: 'exerciseId' });

User.hasMany(Conversation, { foreignKey: 'userId' });
Conversation.belongsTo(User, { foreignKey: 'userId' });
Conversation.hasMany(ConversationTurn, { foreignKey: 'conversationId' });
ConversationTurn.belongsTo(Conversation, { foreignKey: 'conversationId' });

module.exports = {
  sequelize,
  User,
  Exercise,
  ForumPost,
  ForumComment,
  PracticeSession,
  ExerciseCompletion,
  Conversation,
  ConversationTurn,
};

