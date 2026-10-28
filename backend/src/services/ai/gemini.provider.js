import { AIProvider } from './ai.interface.js';
import { logger } from '../../utils/logger.js';

export class GeminiProvider extends AIProvider {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
    this.name = 'GeminiProvider';
  }

  async chat({ messages, context = {} }) {
    if (!this.apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    const systemPrompt = `You are Dutt, the user's personal AI agent.

Your job is to understand what the user actually wants and respond specifically to the user's latest message.

Never use a generic response when a specific response is possible.
Never repeat the same response unnecessarily.
Use conversation history to understand context.
If the user asks a question, answer the question.
If the user asks you to explain something, explain it.
If the user corrects you, acknowledge the correction.
If you don't understand the request, ask a concise clarification question.
For actions that affect external systems, files, accounts, messages, repositories, deployments, purchases, deletion, or other consequential operations, determine the required permission and ask the user for approval before execution.
Never claim that an action was completed unless the tool actually executed successfully.
Never fabricate tool results.
Be concise, natural, and context-aware.
You can help the user practice English, but English learning is only one capability of Dutt, not the entire identity of Dutt.

User English level: ${context.userLevel || 'B1'}.
Mode: ${context.mode || 'FREE'}.
Topic: ${context.topic || 'General'}.
User name: ${context.userName || 'User'}.
Recent mistakes to watch: ${JSON.stringify(context.recentMistakes || [])}.

Respond specifically to what the user said in 1 to 3 friendly, concise sentences.
If the user made a noticeable grammar mistake, gently include a correction. Do not nitpick tiny errors.
Extract 1-2 useful vocabulary words from the context.
Always return valid JSON matching this schema exactly:
{
  "reply": "friendly natural response specifically addressing the user's latest message",
  "correction": {
    "hasCorrection": boolean,
    "original": "string or null",
    "corrected": "string or null",
    "explanation": "simple explanation or null",
    "topic": "grammar topic key like past_tense, articles, prepositions or null"
  },
  "vocabulary": [
    {
      "word": "word",
      "meaning": "simple definition",
      "example": "example sentence"
    }
  ],
  "followUpQuestion": "string",
  "difficulty": "${context.userLevel || 'B1'}"
}`;

    const formattedContents = messages.map(m => ({
      role: m.sender === 'DUTT' ? 'model' : 'user',
      parts: [{ text: m.messageText }],
    }));

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { role: 'user', parts: [{ text: systemPrompt }] },
              ...formattedContents,
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.7,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return JSON.parse(rawText);
    } catch (err) {
      logger.error('Gemini chat failed, falling back:', { error: err.message });
      throw err;
    }
  }

  async analyzeGrammar({ text, userLevel = 'B1' }) {
    if (!this.apiKey) throw new Error('Gemini API key missing');

    const prompt = `Analyze this user sentence for English grammar mistakes:
"${text}"
User CEFR level: ${userLevel}.
Return JSON array of mistakes:
[
  {
    "original": "mistake phrase",
    "corrected": "corrected phrase",
    "explanation": "clear simple explanation",
    "topic": "past_tense | articles | prepositions | subject_verb_agreement | vocabulary",
    "severity": "LOW | MEDIUM | HIGH"
  }
]
If there are no mistakes, return empty array [].`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    const data = await response.json();
    return JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || '[]');
  }

  async evaluateSpeaking({ transcript, context = {} }) {
    if (!this.apiKey) throw new Error('Gemini API key missing');

    const prompt = `Evaluate this user spoken English transcript:
"${transcript}"
Return JSON:
{
  "speakingScore": number (0-100),
  "grammarScore": number (0-100),
  "vocabularyScore": number (0-100),
  "pronunciationScore": number (0-100),
  "overallScore": number (0-100),
  "estimatedLevel": "A1" | "A2" | "B1" | "B2" | "C1",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "recommendations": ["string"]
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    const data = await response.json();
    return JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text);
  }

  async extractVocabulary({ text, userLevel = 'B1' }) {
    if (!this.apiKey) throw new Error('Gemini API key missing');

    const prompt = `Extract 2-3 useful English vocabulary words for an ${userLevel} learner from:
"${text}"
Return JSON array:
[
  { "word": "string", "meaning": "string", "example": "string", "difficulty": "${userLevel}" }
]`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    const data = await response.json();
    return JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || '[]');
  }

  async generateLesson({ topic, level = 'B1', userMistakes = [] }) {
    if (!this.apiKey) throw new Error('Gemini API key missing');

    const prompt = `Create a short practical English speaking lesson on topic: "${topic}" for level: "${level}".
User has made these mistakes: ${JSON.stringify(userMistakes)}.
Return JSON:
{
  "title": "string",
  "description": "string",
  "category": "Grammar | Speaking | Vocabulary",
  "level": "${level}",
  "content": "JSON string containing { rule, commonMistakes, practiceQuestions }"
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    const data = await response.json();
    return JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text);
  }
}
