const BaseService = require('./BaseService');
const PracticeSession = require('../../models/PracticeSession');
const Conversation = require('../../models/Conversation');
const ConversationTurn = require('../../models/ConversationTurn');
const AIService = require('./AIService');

class PracticeService extends BaseService {
  async getUserSessions(userId) {
    return await PracticeSession.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);
  }

  async createSession(userId, { sessionType, topic, durationSeconds, transcript }) {
    if (!sessionType || !durationSeconds || !transcript) {
      const error = new Error('sessionType, durationSeconds, and transcript are required');
      error.statusCode = 400;
      throw error;
    }

    const analysis = await AIService.analyzeSpeech({
      transcript,
      durationSeconds,
      sessionType,
      topic,
    });

    return await PracticeSession.create({
      userId,
      sessionType,
      topic: topic || null,
      durationSeconds,
      transcript: transcript.trim(),
      metrics: analysis.metrics,
      aiFeedbackTips: analysis.tips,
    });
  }

  async startConversation(userId, topicId) {
    if (!topicId) {
      const error = new Error('topicId is required');
      error.statusCode = 400;
      throw error;
    }

    const convo = await Conversation.create({ userId, topic: topicId, status: 'active' });

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
    await ConversationTurn.create({ conversationId: convo._id, role: 'ai', text: question });

    return { conversationId: convo._id.toString(), question };
  }

  async addConversationTurn(userId, conversationId, { text, durationSeconds }) {
    if (!text) {
      const error = new Error('text is required');
      error.statusCode = 400;
      throw error;
    }

    const convo = await Conversation.findById(conversationId);
    if (!convo || convo.userId.toString() !== userId.toString()) {
      const error = new Error('Conversation not found');
      error.statusCode = 404;
      throw error;
    }
    if (convo.status !== 'active') {
      const error = new Error('Conversation is not active');
      error.statusCode = 400;
      throw error;
    }

    await ConversationTurn.create({
      conversationId: convo._id,
      role: 'user',
      text: text.trim(),
      durationSeconds: durationSeconds || null,
    });

    const turnCount = await ConversationTurn.countDocuments({ conversationId: convo._id, role: 'user' });

    let nextQ;
    try {
      nextQ = await AIService.generateNextQuestion({
        topicId: convo.topic,
        turnIndex: turnCount,
        lastAnswer: text.trim(),
      });
    } catch {
      nextQ = this._getCannedQuestion(convo.topic, turnCount);
    }

    await ConversationTurn.create({ conversationId: convo._id, role: 'ai', text: nextQ });
    return { question: nextQ, turnCount };
  }

  async finishConversation(userId, conversationId) {
    const convo = await Conversation.findById(conversationId);
    if (!convo || convo.userId.toString() !== userId.toString()) {
      const error = new Error('Conversation not found');
      error.statusCode = 404;
      throw error;
    }

    if (convo.status === 'completed' && convo.finalFeedback) {
      return convo.finalFeedback;
    }

    const turns = await ConversationTurn.find({ conversationId: convo._id })
      .sort({ createdAt: 1 });

    const fullText = turns.map((t) => `${t.role === 'ai' ? 'Coach' : 'User'}: ${t.text}`).join('\n');
    const totalDuration = turns.reduce((acc, t) => acc + Number(t.durationSeconds || 0), 0) || 60;

    const words = fullText.replace(/Coach:\s.*\n?/g, '').trim().split(/\s+/).filter(Boolean);
    const wpm = Math.round((words.length / Math.max(1, totalDuration)) * 60);
    const fillerMatches = fullText.match(/\b(um|uh|like|you know|actually|basically)\b/gi) || [];
    const fillerWordsCount = fillerMatches.length;

    let feedback;
    try {
      const analysis = await AIService.analyzeSpeech({
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
      feedback = {
        metrics: {
          fillerWordsCount,
          wpm,
          clarityScore: 70,
          confidenceScore: 70,
        },
        tips: [
          'Great job completing your session!',
          'Focus on maintaining a steady pace and clear articulation.',
          'Keep practicing consistent topics to see your progress trends.',
        ],
      };
    }

    const ps = await PracticeSession.create({
      userId,
      sessionType: 'structured_topic',
      topic: convo.topic || null,
      durationSeconds: totalDuration,
      transcript: fullText,
      metrics: feedback.metrics,
      aiFeedbackTips: feedback.tips,
    });

    convo.status = 'completed';
    convo.finalFeedback = feedback;
    await convo.save();

    return feedback;
  }

  _getCannedQuestion(topic, turnIndex) {
    const questions = {
      hometown: ['What is one hidden gem in your hometown and why?', 'Describe a memorable moment you had there.', 'What would you recommend a visitor do in one day?'],
      education: ['What was your hardest subject and how did you handle it?', 'Share a project or achievement you are proud of.', 'How has your education shaped your career goals?'],
      // ... more can be added
    };
    const list = questions[topic] || ['What challenge do you face related to this topic?', 'Can you share a specific example?', 'What advice would you give someone?'];
    return list[Math.min(list.length - 1, Math.max(0, turnIndex - 1))];
  }
}

module.exports = new PracticeService();
