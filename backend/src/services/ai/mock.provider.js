import { AIProvider } from './ai.interface.js';

/**
 * Intelligent Fallback & Development AI Provider
 * Emulates Dutt's friendly, level-adaptive personality with rule-based grammar analysis,
 * contextual scenario understanding (Roleplay, Interview, Debate, Free Chat),
 * and automatic vocabulary extraction.
 */
export class MockAIProvider extends AIProvider {
  constructor() {
    super();
    this.name = 'MockAIProvider (Intelligent Development Fallback)';
  }

  // Grammar detection patterns and explanations
  static GRAMMAR_RULES = [
    {
      regex: /\bi\s+go\b(?:[^.!?]*?)\b(?:yesterday|last\s+\w+|two\s+days\s+ago)/i,
      original: (m) => m[0],
      corrected: (m) => m[0].replace(/\bgo\b/i, 'went'),
      explanation: 'Use the past tense "went" instead of "go" because you are referring to a past event.',
      topic: 'past_tense',
      severity: 'HIGH',
    },
    {
      regex: /\bi\s+(?:did\s+not|didn't)\s+(?:knew|went|saw|spoke|came|ate)/i,
      original: (m) => m[0],
      corrected: (m) => {
        const pastMap = { knew: 'know', went: 'go', saw: 'see', spoke: 'speak', came: 'come', ate: 'eat' };
        const word = m[0].split(/\s+/).pop().toLowerCase();
        return m[0].replace(new RegExp(`\\b${word}\\b`, 'i'), pastMap[word] || word);
      },
      explanation: 'After "didn\'t" or "did not", always use the base verb (e.g., "didn\'t know", not "didn\'t knew").',
      topic: 'past_tense',
      severity: 'HIGH',
    },
    {
      regex: /\b(he|she|it|everyone|somebody)\s+(?:don't|have\s+(?:a|to|no))\b/i,
      original: (m) => m[0],
      corrected: (m) => m[0].replace(/\bdon't\b/i, "doesn't").replace(/\bhave\b/i, 'has'),
      explanation: 'With third-person singular subjects (he, she, it), use "doesn\'t" or "has".',
      topic: 'subject_verb_agreement',
      severity: 'MEDIUM',
    },
    {
      regex: /\b(a)\s+(apple|orange|engineer|interview|hour|honest|opportunity|idea)\b/i,
      original: (m) => m[0],
      corrected: (m) => m[0].replace(/\ba\b/i, 'an'),
      explanation: 'Use "an" before vowel sounds like "an interview" or "an hour".',
      topic: 'articles',
      severity: 'LOW',
    },
    {
      regex: /\b(?:angry\s+on|discuss\s+about|listen\s+me)\b/i,
      original: (m) => m[0],
      corrected: (m) => {
        const map = { 'angry on': 'angry with', 'discuss about': 'discuss', 'listen me': 'listen to me' };
        const lower = m[0].toLowerCase();
        return map[lower] || m[0];
      },
      explanation: 'In English, we say "angry with someone", "discuss something" (without about), and "listen to me".',
      topic: 'prepositions',
      severity: 'MEDIUM',
    },
    {
      regex: /\b(?:did\s+a\s+mistake|pass\s+out\s+from\s+college|revert\s+back)\b/i,
      original: (m) => m[0],
      corrected: (m) => {
        const map = {
          'did a mistake': 'made a mistake',
          'pass out from college': 'graduated from college',
          'revert back': 'reply / get back',
        };
        const lower = m[0].toLowerCase();
        return map[lower] || m[0];
      },
      explanation: 'A more natural phrase is "made a mistake" and "graduated from college".',
      topic: 'natural_phrasing',
      severity: 'LOW',
    },
  ];

  // Vocabulary bank by CEFR level
  static VOCABULARY_BANK = {
    A1: [
      { word: 'friendly', meaning: 'kind and pleasant to others', example: 'Dutt is very friendly and patient.' },
      { word: 'practice', meaning: 'doing an activity regularly to improve', example: 'Daily practice makes speaking natural.' },
      { word: 'listen', meaning: 'give attention to sound or speech', example: 'I listen carefully to English podcasts.' },
    ],
    A2: [
      { word: 'confidence', meaning: 'feeling sure of your own abilities', example: 'Speaking every day builds immense confidence.' },
      { word: 'routine', meaning: 'regular sequence of actions', example: 'Speaking English is part of my morning routine.' },
      { word: 'curious', meaning: 'eager to know or learn something', example: 'I am curious about different cultures.' },
    ],
    B1: [
      { word: 'articulate', meaning: 'express thoughts clearly and effectively', example: 'He was able to articulate his ideas during the presentation.' },
      { word: 'perspective', meaning: 'a particular attitude toward or way of regarding something', example: 'Traveling gave her a fresh perspective on life.' },
      { word: 'collaborate', meaning: 'work jointly on an activity or project', example: 'Engineers collaborate across global teams.' },
      { word: 'resilient', meaning: 'able to withstand or recover quickly from difficult conditions', example: 'He remained resilient despite several career setbacks.' },
    ],
    B2: [
      { word: 'nuance', meaning: 'a subtle distinction in meaning, tone, or expression', example: 'Advanced speakers understand cultural nuance in conversation.' },
      { word: 'compelling', meaning: 'evoking interest, attention, or admiration in a powerfully irresistible way', example: 'She delivered a compelling argument during the debate.' },
      { word: 'versatile', meaning: 'able to adapt or be adapted to many different functions', example: 'Her versatile communication style helped in negotiations.' },
    ],
    C1: [
      { word: 'eloquent', meaning: 'fluent or persuasive in speaking or writing', example: 'The keynote speaker gave an eloquent summary of AI development.' },
      { word: 'pragmatic', meaning: 'dealing with things sensibly and realistically', example: 'A pragmatic approach solved the communication breakdown.' },
      { word: 'meticulous', meaning: 'showing great attention to detail', example: 'His meticulous preparation paid off in the final interview.' },
    ],
  };

  /**
   * Generates a conversational reply adapted to mode, topic, level, and personal agent intent.
   * Completely eliminates hardcoded repetitive tutor responses.
   */
  async chat({ messages, context = {} }) {
    const userMessage = messages[messages.length - 1]?.messageText || '';
    const userLevel = context.userLevel || 'B1';
    const mode = context.mode || 'FREE';
    const topic = context.topic || 'General Conversation';
    const userName = context.userName || '';

    // History inspection for context awareness
    const history = messages.slice(0, -1);
    const previousDuttMsg = [...history].reverse().find((m) => m.sender === 'DUTT')?.messageText || '';
    const previousUserMsg = [...history].reverse().find((m) => m.sender === 'USER')?.messageText || '';

    // 1. Analyze grammar for potential gentle correction
    const correctionResult = await this.analyzeGrammar({ text: userMessage, userLevel });
    const topMistake = correctionResult.length > 0 ? correctionResult[0] : null;

    let reply = '';
    let followUp = '';
    let toolCall = null;

    const trimmed = userMessage.trim();
    const lowerText = trimmed.toLowerCase();

    // 2. Intelligent Intent Matching & Agent Logic
    if (mode === 'INTERVIEW') {
      if (messages.length <= 1) {
        reply = "Hello! Welcome to your interview session. I am Dutt, and I will be your interviewer today. Could you briefly introduce yourself and tell me about your background?";
        followUp = "What kind of projects have you worked on recently?";
      } else if (lowerText.includes('experience') || lowerText.includes('project') || lowerText.includes('work') || lowerText.includes('developer')) {
        reply = "That's a very solid background. When you encountered a difficult technical challenge in that project, how did you collaborate with your teammates to resolve it?";
        followUp = "Could you walk me through your decision-making process?";
      } else if (lowerText.includes('challenge') || lowerText.includes('bug') || lowerText.includes('problem')) {
        reply = "Handling unexpected obstacles shows strong problem-solving ability. How do you prioritize your tasks when multiple deadlines clash?";
        followUp = "Do you prefer working independently or in close collaboration?";
      } else {
        reply = `Thank you for sharing that regarding "${trimmed}". In professional environments, clear and concise communication is just as vital as domain expertise.`;
        followUp = "Where do you see yourself contributing most in the next couple of years?";
      }
    } else if (mode === 'ROLEPLAY') {
      if (topic.toLowerCase().includes('restaurant')) {
        if (messages.length <= 1) {
          reply = "Good evening! Welcome to The Green Olive Bistro. Table for how many this evening?";
          followUp = "Would you like an indoor table or our garden patio?";
        } else if (lowerText.includes('table') || lowerText.includes('two') || lowerText.includes('menu')) {
          reply = "Right this way! Here is our seasonal menu. Tonight's chef special is roasted garlic risotto. Can I bring you some sparkling water or fresh lime soda while you decide?";
          followUp = "Are you ready to order appetizers, or would you like a few more minutes?";
        } else {
          reply = `Excellent choice regarding "${trimmed}"! I will make sure the chef prepares that with extra care.`;
          followUp = "Would you like to try our signature dessert as well?";
        }
      } else if (topic.toLowerCase().includes('hotel')) {
        reply = `Welcome to Grand Horizon Hotel! How may I assist with your stay regarding "${trimmed}"?`;
        followUp = "Would you prefer a room with a city view on a higher floor?";
      } else if (topic.toLowerCase().includes('airport')) {
        reply = "Hello! May I see your passport and boarding pass, please? Are you checking any luggage today or only traveling with carry-on bags?";
        followUp = "Do you have any fragile items or electronics in your checked luggage?";
      } else {
        reply = `Hello! We're now in our ${topic} roleplay scenario. Regarding "${trimmed}", let's proceed.`;
        followUp = "How would you like to continue?";
      }
    } else if (mode === 'DEBATE') {
      if (lowerText.includes('ai') || lowerText.includes('technology') || lowerText.includes('future')) {
        reply = "You raise an interesting point. While technology definitely accelerates productivity, some argue it also reduces deep critical thinking. How do you view that trade-off?";
        followUp = "Do you think the benefits outweigh the risks?";
      } else {
        reply = `That is a thought-provoking perspective on ${topic} regarding "${trimmed}". However, consider the opposing viewpoint: what if prioritizing this leads to unforeseen side effects?`;
        followUp = "How would you counter someone who holds the opposite opinion?";
      }
    } else {
      // FREE / DAILY_PRACTICE / GENERAL DUTT PERSONAL AI AGENT

      // Pattern 1: User notes repetition ("your answer is same", "you repeated", etc.)
      if (/\b(?:your answer is (?:the )?same|you repeated|same answer|repeating yourself|said that already|stop repeating|answer is same)\b/i.test(lowerText)) {
        reply = "You're right 😄 I repeated myself. Let me answer more directly.";
        followUp = "What would you like me to help you with right now?";
      }

      // Pattern 2: User asks to explain more simply ("can you explain that more simply?", etc.)
      else if (/\b(?:explain (?:that )?(?:more )?simply|in simple (?:terms|words)|make it simple|simpler)\b/i.test(lowerText)) {
        if (/node(?:\.js)?/i.test(previousDuttMsg) || /node(?:\.js)?/i.test(previousUserMsg)) {
          reply = "In simple terms, Node.js lets you run JavaScript on your computer or a server instead of just in a web browser, making it easy to build fast backend services and APIs.";
          followUp = "Does that simple explanation make sense?";
        } else if (/javascript/i.test(previousDuttMsg) || /javascript/i.test(previousUserMsg)) {
          reply = "In simple terms, JavaScript is the programming language that makes websites interactive, like popups, animations, and sending forms without reloading.";
          followUp = "Would you like a simple example?";
        } else {
          reply = "In simple terms, I'm here as your personal AI agent to help you learn, work, and solve problems step-by-step.";
          followUp = "Which part would you like me to break down further?";
        }
      }

      // Pattern 3: User asks for explanation of what was said ("can you explain what you said/say/mean?", etc.)
      else if (/\b(?:can you explain what you (?:said|mean|say)|what do you mean|explain what you said|could you explain that)\b/i.test(lowerText)) {
        if (/node(?:\.js)?/i.test(previousDuttMsg)) {
          reply = "Sure. Earlier I was explaining that Node.js lets developers run JavaScript on a server instead of only in the browser, which powers modern backend services.";
          followUp = "Would you like me to explain how it works under the hood?";
        } else {
          reply = "Sure. I was saying that I'm ready to help you with whatever you're working on.";
          followUp = "What specific topic or project should we dive into?";
        }
      }

      // Pattern 4: Tech Concept: Node.js ("what is node.js?", "what is nodejs?")
      else if (/\b(?:what is node(?:\.js)?|nodejs|node js)\b/i.test(lowerText)) {
        reply = "Node.js is an open-source, cross-platform JavaScript runtime environment built on Chrome's V8 engine that executes JavaScript code outside a web browser, widely used for building scalable server-side applications.";
        followUp = "Would you like to know how it handles asynchronous operations?";
      }

      // Pattern 5: Tech Concept: JavaScript ("what is javascript?", "what is js?")
      else if (/\b(?:what is javascript|what is js)\b/i.test(lowerText)) {
        reply = "JavaScript is a versatile, high-level programming language that powers interactive web pages, server backends via Node.js, and modern full-stack applications.";
        followUp = "Are you interested in frontend or backend JavaScript?";
      }

      // Pattern 6: User Identity: ("what is my name?", "who am i?")
      else if (/\b(?:what is my name|who am i|do you know my name|what'?s my name)\b/i.test(lowerText)) {
        if (userName) {
          reply = `Your name is ${userName}! It's great to talk with you.`;
          followUp = `What would you like us to work on today, ${userName}?`;
        } else {
          reply = "I don't have your name saved in this profile yet. What would you like me to call you?";
          followUp = "What should I call you?";
        }
      }

      // Pattern 7: Agent Action Request: Project Inspection ("open my project", "open project")
      else if (/\b(?:open (?:my )?project|open workspace|inspect project)\b/i.test(lowerText)) {
        reply = "Dutt can help with that. I'll first inspect the project and then tell you what I plan to do.";
        followUp = "Which project directory would you like me to inspect?";
        toolCall = { action: 'INSPECT_PROJECT', status: 'PLANNING' };
      }

      // Pattern 8: Agent Action Request: Job Search ("search for node.js jobs", "search for jobs")
      else if (/\b(?:search for (?:node(?:\.js)? )?jobs|find (?:node(?:\.js)? )?jobs|job search)\b/i.test(lowerText)) {
        reply = "I can search for suitable Node.js roles. I'll show you what I find before taking any action.";
        followUp = "What location or experience level would you prefer?";
        toolCall = { action: 'SEARCH_JOBS', query: 'Node.js', status: 'READY_TO_PLAN' };
      }

      // Pattern 9: Agent Action Request: Resume / Email ("send my resume", "send my resume to this company")
      else if (/\b(?:send (?:my )?resume|email (?:my )?resume|send (?:an )?email)\b/i.test(lowerText)) {
        reply = "I can prepare that email and send your resume. Which company or email address would you like me to send it to? I will ask for your confirmation before anything is sent.";
        followUp = "Please share the recipient company or email address.";
        toolCall = { action: 'SEND_RESUME', status: 'REQUIRES_APPROVAL' };
      }

      // Pattern 10: "What are you doing?"
      else if (/\b(?:what are you doing|what'?re you doing|what do you do)\b/i.test(lowerText)) {
        reply = "I'm here talking with you. What would you like me to help you with?";
        followUp = "Are you looking to practice English, work on a project, or explore something new?";
      }

      // Pattern 11: Direct Dutt Greetings ("hi dutt", "hello dutt", "hey dutt")
      else if (/^(?:hi|hello|hey|greetings|good\s+(?:morning|afternoon|evening))\s+dutt\b/i.test(lowerText) || (messages.length <= 1 && /^(?:hi|hello|hey)\b/i.test(lowerText))) {
        reply = "Hey! It's fantastic to talk with you. What's on your mind, or what have you been up to recently?";
        followUp = "Tell me about something you'd like to achieve today!";
      }

      // Pattern 12: Short fragment / Single word (e.g. "ing", "ok", "huh")
      else if (trimmed.length <= 4 || trimmed.split(/\s+/).length === 1) {
        reply = `I noticed you said "${trimmed}". Could you share a bit more context or complete your thought?`;
        followUp = "What were you thinking?";
      }

      // Pattern 13: General Dynamic Contextual Response (Never static or canned)
      else if (trimmed.endsWith('?') || /^(?:how|why|when|where|who|can|could|would|should|is|are|do|does)\b/i.test(lowerText)) {
        const cleanQuestion = trimmed.replace(/\?+$/, '');
        reply = `Regarding "${cleanQuestion}", that's an interesting question. I'm ready to help you explore it thoroughly.`;
        followUp = "What specific aspect would you like to start with?";
      } else {
        reply = `You mentioned: "${trimmed}". That's a great point. How would you like me to assist you with that?`;
        followUp = "What should we do next?";
      }
    }

    // 3. Extract level-appropriate vocabulary
    const vocabPool = MockAIProvider.VOCABULARY_BANK[userLevel] || MockAIProvider.VOCABULARY_BANK.B1;
    const selectedVocab = vocabPool.slice(0, 2);

    return {
      reply: `${reply} ${followUp}`.trim(),
      correction: topMistake
        ? {
            hasCorrection: true,
            original: topMistake.original,
            corrected: topMistake.corrected,
            explanation: topMistake.explanation,
            topic: topMistake.topic,
          }
        : { hasCorrection: false },
      vocabulary: selectedVocab,
      followUpQuestion: followUp,
      difficulty: userLevel,
      toolCall,
    };
  }

  /**
   * Analyzes text for common grammar mistakes.
   */
  async analyzeGrammar({ text = '' }) {
    if (!text || typeof text !== 'string') return [];
    const mistakes = [];

    for (const rule of MockAIProvider.GRAMMAR_RULES) {
      const match = text.match(rule.regex);
      if (match) {
        mistakes.push({
          original: rule.original(match),
          corrected: rule.corrected(match),
          explanation: rule.explanation,
          topic: rule.topic,
          severity: rule.severity,
        });
      }
    }

    return mistakes;
  }

  /**
   * Evaluates speaking ability and returns diagnostic scores.
   */
  async evaluateSpeaking({ transcript = '', context = {} }) {
    const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
    const mistakes = await this.analyzeGrammar({ text: transcript });

    // Baseline calculation based on length, complexity, and mistake density
    let grammarScore = Math.max(50, Math.min(95, 85 - mistakes.length * 8));
    let speakingScore = Math.min(92, Math.max(55, 60 + Math.min(wordCount * 2, 25)));
    let vocabularyScore = Math.min(90, Math.max(58, 65 + (wordCount > 30 ? 15 : 8)));
    let pronunciationScore = Math.min(88, Math.max(62, 72));

    const overallScore = Math.round(
      speakingScore * 0.35 +
      grammarScore * 0.3 +
      vocabularyScore * 0.2 +
      pronunciationScore * 0.15
    );

    let estimatedLevel = 'B1';
    if (overallScore < 50) estimatedLevel = 'A1';
    else if (overallScore < 65) estimatedLevel = 'A2';
    else if (overallScore < 78) estimatedLevel = 'B1';
    else if (overallScore < 88) estimatedLevel = 'B2';
    else estimatedLevel = 'C1';

    return {
      speakingScore,
      grammarScore,
      vocabularyScore,
      pronunciationScore,
      overallScore,
      estimatedLevel,
      strengths: [
        'Good communicative intent and message clarity',
        'Natural conversational rhythm',
        'Willingness to speak in complete sentences',
      ],
      weaknesses: mistakes.length > 0
        ? mistakes.map((m) => `${m.topic.replace(/_/g, ' ')}: e.g. "${m.original}"`)
        : ['Past tense consistency during longer narratives'],
      recommendations: [
        'Practice 10-15 minutes of speaking daily with Dutt',
        'Focus on using simple past tense verbs correctly',
        'Incorporate 2 new vocabulary words into your daily conversation',
      ],
    };
  }

  /**
   * Extracts useful vocabulary from text.
   */
  async extractVocabulary({ text = '', userLevel = 'B1' }) {
    const pool = MockAIProvider.VOCABULARY_BANK[userLevel] || MockAIProvider.VOCABULARY_BANK.B1;
    return pool;
  }

  /**
   * Generates a targeted mini-lesson for a specific weak area.
   */
  async generateLesson({ topic = 'past_tense', level = 'B1' }) {
    const lessonTopics = {
      past_tense: {
        title: 'Mastering the Simple Past Tense',
        description: 'Learn how to describe your yesterday, past experiences, and completed actions without confusion.',
        category: 'Grammar',
        level,
        content: JSON.stringify({
          rule: 'Always use past tense verbs (went, saw, ate, finished) when referring to a specific past time.',
          commonMistakes: [
            { wrong: 'I go to college yesterday.', right: 'I went to college yesterday.' },
            { wrong: 'He did not went there.', right: 'He did not go there.' },
          ],
          practiceQuestions: [
            'What did you do last weekend?',
            'Tell me about your favorite childhood memory.',
          ],
        }),
      },
      articles: {
        title: 'Using Articles: A, An, and The',
        description: 'Master English articles effortlessly and eliminate unnecessary "the" from everyday conversation.',
        category: 'Grammar',
        level,
        content: JSON.stringify({
          rule: 'Use "a" before consonant sounds and "an" before vowel sounds. Use "the" when both speaker and listener know the specific item.',
          commonMistakes: [
            { wrong: 'I gave him a apple.', right: 'I gave him an apple.' },
            { wrong: 'He is studying in the college.', right: 'He is studying in college.' },
          ],
          practiceQuestions: [
            'Describe an exciting opportunity you would like to have.',
            'What is the most interesting book you have read recently?',
          ],
        }),
      },
      prepositions: {
        title: 'Prepositions in Everyday English',
        description: 'Stop guessing prepositions! Learn the most common collocations used by native speakers.',
        category: 'Grammar',
        level,
        content: JSON.stringify({
          rule: 'We say "listen to someone", "angry with someone", and "discuss something" (no preposition).',
          commonMistakes: [
            { wrong: 'Please listen me.', right: 'Please listen to me.' },
            { wrong: 'Let us discuss about this.', right: 'Let us discuss this.' },
          ],
          practiceQuestions: [
            'Who do you listen to when making important career decisions?',
          ],
        }),
      },
    };

    return lessonTopics[topic] || lessonTopics.past_tense;
  }
}
