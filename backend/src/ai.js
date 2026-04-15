const { GoogleGenAI } = require('@google/genai');

function getGeminiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GENAI_API_KEY ||
    ''
  );
}

function getClient() {
  const apiKey = getGeminiKey();
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractGenAiStatus(err) {
  const status =
    err?.status ||
    err?.statusCode ||
    err?.code ||
    err?.error?.status ||
    err?.error?.code ||
    err?.response?.status;
  const message = err?.message || err?.error?.message || err?.response?.data?.error?.message;
  return { status, message };
}

async function withRetry(fn, { tries = 4, baseDelayMs = 600 } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= tries; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastErr = err;
      const { status } = extractGenAiStatus(err);
      const retryable = status === 429 || status === 503 || status === 'UNAVAILABLE';
      if (!retryable || attempt === tries) break;
      const jitter = Math.floor(Math.random() * 250);
      const backoff = baseDelayMs * Math.pow(2, attempt - 1) + jitter;
      await sleep(backoff);
    }
  }
  throw lastErr;
}

function getModelFallbacks() {
  const envModel = process.env.GEMINI_MODEL;
  const list = [
    envModel,
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash',
  ].filter(Boolean);
  // dedupe
  return [...new Set(list)];
}

async function analyzeSpeechWithGemini({ transcript, durationSeconds, sessionType, topic }) {
  const client = getClient();
  if (!client) {
    const err = new Error('Missing Gemini API key. Set GEMINI_API_KEY (or GOOGLE_API_KEY).');
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

  const models = getModelFallbacks();
  const result = await withRetry(async (attempt) => {
    const model = models[Math.min(models.length - 1, attempt - 1)];
    return await client.models.generateContent({
      model,
      contents: prompt,
    });
  });
  const text = result?.text || '';

  // Try parse JSON even if model adds extra text
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) {
    const err = new Error('AI response did not contain JSON');
    err.statusCode = 502;
    throw err;
  }
  const jsonText = text.slice(start, end + 1);
  const parsed = JSON.parse(jsonText);

  // Basic shape normalization
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

async function generateBitmojiSvg({ name, style = 'friendly' }) {
  const client = getClient();
  if (!client) {
    const err = new Error('Missing Gemini API key. Set GEMINI_API_KEY (or GOOGLE_API_KEY).');
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
- Keep it self-contained: no external images/fonts.
`;

  const models = getModelFallbacks();
  const result = await withRetry(async (attempt) => {
    const model = models[Math.min(models.length - 1, attempt - 1)];
    return await client.models.generateContent({
      model,
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

module.exports = {
  analyzeSpeechWithGemini,
  generateBitmojiSvg,
  transcribeAudioWithGemini,
  generateNextQuestionWithGemini,
};

async function transcribeAudioWithGemini({ base64Audio, mimeType }) {
  const client = getClient();
  if (!client) {
    const err = new Error('Missing Gemini API key. Set GEMINI_API_KEY (or GOOGLE_API_KEY).');
    err.statusCode = 500;
    throw err;
  }
  if (!base64Audio || !mimeType) {
    const err = new Error('base64Audio and mimeType are required');
    err.statusCode = 400;
    throw err;
  }

  const models = getModelFallbacks();
  const result = await withRetry(async (attempt) => {
    const model = models[Math.min(models.length - 1, attempt - 1)];
    return await client.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text:
                'Transcribe this audio to plain text. Output ONLY the transcript, no timestamps, no markdown.',
            },
            {
              inlineData: {
                mimeType,
                data: base64Audio,
              },
            },
          ],
        },
      ],
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

async function generateNextQuestionWithGemini({ topicId, turnIndex, lastAnswer }) {
  const client = getClient();
  if (!client) {
    const err = new Error('Missing Gemini API key. Set GEMINI_API_KEY (or GOOGLE_API_KEY).');
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

  const models = getModelFallbacks();
  const result = await withRetry(async (attempt) => {
    const model = models[Math.min(models.length - 1, attempt - 1)];
    return await client.models.generateContent({
      model,
      contents: prompt,
    });
  });

  const text = (result?.text || '').trim();
  if (!text) {
    const err = new Error('Empty question from AI');
    err.statusCode = 502;
    throw err;
  }

  return text.split('\n').map((l) => l.trim()).filter(Boolean)[0];
}
