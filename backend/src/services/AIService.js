const { GoogleGenAI } = require('@google/genai');
const BaseService = require('./BaseService');

class AIService extends BaseService {
  constructor() {
    super();
    this.apiKey = process.env.GEMINI_API_KEY ||
                  process.env.GOOGLE_API_KEY ||
                  process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
                  process.env.GENAI_API_KEY || '';
    
    this.client = this.apiKey ? new GoogleGenAI({ apiKey: this.apiKey }) : null;
    this.models = this._getModelFallbacks();
  }

  _getModelFallbacks() {
    const envModel = process.env.GEMINI_MODEL;
    const list = [
      envModel,
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
    ].filter(Boolean);
    return [...new Set(list)];
  }

  async _withRetry(fn, { tries = 4, baseDelayMs = 600 } = {}) {
    let lastErr;
    for (let attempt = 1; attempt <= tries; attempt += 1) {
      try {
        return await fn(attempt);
      } catch (err) {
        lastErr = err;
        const { status } = this._extractGenAiStatus(err);
        const retryable = status === 429 || status === 503 || status === 'UNAVAILABLE';
        if (!retryable || attempt === tries) break;
        const jitter = Math.floor(Math.random() * 250);
        const backoff = baseDelayMs * Math.pow(2, attempt - 1) + jitter;
        await new Promise(r => setTimeout(r, backoff));
      }
    }
    throw lastErr;
  }

  _extractGenAiStatus(err) {
    const status = err?.status || err?.statusCode || err?.code || 
                   err?.error?.status || err?.error?.code || err?.response?.status;
    const message = err?.message || err?.error?.message || err?.response?.data?.error?.message;
    return { status, message };
  }

  async analyzeSpeech({ transcript, durationSeconds, sessionType, topic }) {
    if (!this.client) {
      const err = new Error('Missing Gemini API key.');
      err.statusCode = 500;
      throw err;
    }

    const prompt = `You are an expert public speaking coach.
Analyze the user's speech transcript and return STRICT JSON ONLY with this schema:
{
  "metrics": {
    "fillerWordsCount": number,
    "wpm": number,
    "clarityScore": number,        // 0-100
    "confidenceScore": number      // 0-100
  },
  "tips": string[]                // exactly 3 actionable tips
}

Rules:
- Output must be valid JSON only. No markdown.
- Scores should be realistic given transcript quality.

Context:
- sessionType: ${sessionType || 'unknown'}
- topic: ${topic || ''}
- durationSeconds: ${durationSeconds || 0}

Transcript:
${transcript || ''}`;

    const result = await this._withRetry(async (attempt) => {
      const modelName = this.models[Math.min(this.models.length - 1, attempt - 1)];
      return await this.client.models.generateContent({
        model: modelName,
        contents: prompt,
      });
    });

    const text = result?.text || '';
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) {
      const err = new Error('AI response did not contain JSON');
      err.statusCode = 502;
      throw err;
    }
    const jsonText = text.slice(start, end + 1);
    const parsed = JSON.parse(jsonText);

    const metrics = parsed.metrics || {};
    const tips = Array.isArray(parsed.tips) ? parsed.tips.slice(0, 3) : [];
    while (tips.length < 3) tips.push('Practice one focused improvement next session.');

    return {
      metrics: {
        fillerWordsCount: Number(metrics.fillerWordsCount || 0),
        wpm: Number(metrics.wpm || 0),
        clarityScore: Math.max(0, Math.min(100, Number(metrics.clarityScore || 0))),
        confidenceScore: Math.max(0, Math.min(100, Number(metrics.confidenceScore || 0))),
      },
      tips,
    };
  }

  async transcribeAudio({ base64Audio, mimeType }) {
    if (!this.client) {
      const err = new Error('Missing Gemini API key.');
      err.statusCode = 500;
      throw err;
    }

    const result = await this._withRetry(async (attempt) => {
      const modelName = this.models[Math.min(this.models.length - 1, attempt - 1)];
      return await this.client.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [
              { text: 'Transcribe this audio to plain text. Output ONLY the transcript, no timestamps, no markdown.' },
              { inlineData: { mimeType, data: base64Audio } }
            ]
          }
        ]
      });
    });

    const text = (result?.text || '').trim();
    if (!text) {
      const err = new Error('Empty transcript from AI');
      err.statusCode = 502;
      throw err;
    }
    return text;
  }

  async generateBitmojiSvg({ name, style = 'friendly' }) {
    if (!this.client) {
      const err = new Error('Missing Gemini API key.');
      err.statusCode = 500;
      throw err;
    }

    const prompt = `Generate a single SVG image (no markdown) that looks like a bitmoji-style cartoon avatar.
Requirements:
- Return SVG ONLY (starting with <svg ...>).
- Dark-theme friendly, soft gradients, outlined, modern.
- Include a friendly facial expression.
- Add subtle purple/blue accents to match a neon glow theme.
- The avatar should represent this user name: "${name || 'User'}"
- Style: ${style}
- Keep it self-contained: no external images/fonts.`;

    const result = await this._withRetry(async (attempt) => {
      const modelName = this.models[Math.min(this.models.length - 1, attempt - 1)];
      return await this.client.models.generateContent({
        model: modelName,
        contents: prompt,
      });
    });

    const text = result?.text || '';
    const svgStart = text.indexOf('<svg');
    const svgEnd = text.lastIndexOf('</svg>');
    if (svgStart === -1 || svgEnd === -1) {
      const err = new Error('AI did not return an SVG');
      err.statusCode = 502;
      throw err;
    }
    return text.slice(svgStart, svgEnd + '</svg>'.length);
  }

  async generateNextQuestion({ topicId, turnIndex, lastAnswer }) {
    if (!this.client) {
      const err = new Error('Missing Gemini API key.');
      err.statusCode = 500;
      throw err;
    }

    const prompt = `You are an AI public speaking coach.
The user is practicing the topic "${topicId}" by speaking, not typing.

Write ONE short follow-up question the user should answer out loud next.
Rules:
- Output ONLY the question text. No quotes, no bullets, no markdown.
- It MUST relate to the topic and to the user's last answer.
- Keep it under 18 words.
- Make it natural and specific.

Turn number (user answers so far): ${turnIndex}
Last user answer:
${lastAnswer || ''}`;

    const result = await this._withRetry(async (attempt) => {
      const modelName = this.models[Math.min(this.models.length - 1, attempt - 1)];
      return await this.client.models.generateContent({
        model: modelName,
        contents: prompt,
      });
    });

    const text = (result?.text || '').trim();
    if (!text) {
      const err = new Error('Empty question from AI');
      err.statusCode = 502;
      throw err;
    }

    return text.split('\n').map(l => l.trim()).filter(Boolean)[0];
  }
}

module.exports = new AIService();
