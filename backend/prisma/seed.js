import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting English Learning Dutt database seeding...');

  // 1. Seed Core English Lessons
  const lessonsData = [
    {
      title: 'Mastering the Simple Past Tense',
      description: 'Learn how to accurately describe past activities and eliminate common errors like "I go yesterday".',
      level: 'B1',
      category: 'Grammar',
      content: JSON.stringify({
        summary: 'The simple past tense is used for actions completed in the past at a specific time.',
        rules: [
          'Use the past form of the verb for affirmative statements (e.g., "I went", "She saw").',
          'Use "did not + base verb" for negative statements (e.g., "I did not go", not "I did not went").',
          'Words like yesterday, last week, in 2024 signal the need for past tense.',
        ],
        examples: [
          { incorrect: 'I go to the market yesterday.', correct: 'I went to the market yesterday.' },
          { incorrect: 'He didn\'t knew the answer.', correct: 'He didn\'t know the answer.' },
        ],
        practicePrompts: [
          'What did you accomplish at work or college yesterday?',
          'Tell Dutt about an unforgettable trip you took.',
        ],
      }),
    },
    {
      title: 'Flawless Articles: A, An, and The',
      description: 'Avoid confusing vowel sounds and eliminate unnecessary "the" from everyday sentences.',
      level: 'A2',
      category: 'Grammar',
      content: JSON.stringify({
        summary: 'Articles specify whether a noun is general (a/an) or specific (the).',
        rules: [
          'Use "a" before consonant sounds: a university, a phone, a project.',
          'Use "an" before vowel sounds: an hour, an apple, an engineer.',
          'Do NOT use "the" before generic uncountable nouns or general destinations ("I am going to college", not "to the college").',
        ],
        examples: [
          { incorrect: 'He gave me a honest opinion.', correct: 'He gave me an honest opinion.' },
          { incorrect: 'I am going to the office.', correct: 'I am going to office / to the office (specific).' },
        ],
      }),
    },
    {
      title: 'Interview Success: The STAR Method',
      description: 'Structure behavioral interview answers smoothly using Situation, Task, Action, and Result.',
      level: 'B2',
      category: 'Interview',
      content: JSON.stringify({
        summary: 'The STAR method provides a clear, concise framework for behavioral interview questions.',
        structure: [
          'Situation: Set the scene and context briefly.',
          'Task: What was your responsibility or challenge?',
          'Action: Explain the specific steps YOU took.',
          'Result: Share the measurable positive outcome.',
        ],
        exampleAnswer: 'At my previous company (Situation), our API latency increased by 40% (Task). I profiled the query bottlenecks and added Redis caching (Action), which reduced latency by 65% and improved user satisfaction (Result).',
      }),
    },
    {
      title: 'Dining Out & Restaurant Roleplay',
      description: 'Practice ordering food, asking for modifications, and interacting politely with waitstaff.',
      level: 'A2',
      category: 'Roleplay',
      content: JSON.stringify({
        summary: 'Essential phrases for polite restaurant communication.',
        phrases: [
          'Could we get a table for two by the window, please?',
          'What do you recommend from today\'s specials?',
          'Could I have the dressing on the side?',
          'May we please have the bill?',
        ],
      }),
    },
    {
      title: 'Executive Workplace Communication & Nuance',
      description: 'Elevate your tone from transactional to persuasive and diplomatically assertive.',
      level: 'C1',
      category: 'Speaking',
      content: JSON.stringify({
        summary: 'Refine nuances in tone, diplomatic disagreement, and executive presentations.',
        phrases: [
          'I see your perspective; however, we might also consider...',
          'To align on expectations, let us outline the milestones...',
          'I would like to offer an alternative viewpoint on this metric...',
        ],
      }),
    },
  ];

  for (const lesson of lessonsData) {
    const existing = await prisma.lesson.findFirst({ where: { title: lesson.title } });
    if (!existing) {
      await prisma.lesson.create({ data: lesson });
    }
  }
  console.log(`✅ Seeded ${lessonsData.length} lessons`);

  // 2. Seed High-Impact Vocabulary
  const vocabularyData = [
    {
      word: 'articulate',
      meaning: 'Able to express thoughts and ideas clearly and effectively in speech or writing.',
      exampleSentence: 'She was praised for her ability to articulate complex technical ideas simply.',
      difficulty: 'B1',
    },
    {
      word: 'collaborate',
      meaning: 'Work jointly with others on an activity or project.',
      exampleSentence: 'Engineers collaborate with product designers across global time zones.',
      difficulty: 'B1',
    },
    {
      word: 'perspective',
      meaning: 'A particular attitude toward or way of regarding something; a point of view.',
      exampleSentence: 'Listening to different team members gave him a fresh perspective on the problem.',
      difficulty: 'B1',
    },
    {
      word: 'resilient',
      meaning: 'Able to withstand or recover quickly from difficult conditions.',
      exampleSentence: 'He remained resilient and maintained positive communication during stressful deadlines.',
      difficulty: 'B2',
    },
    {
      word: 'nuance',
      meaning: 'A subtle distinction in meaning, tone, or expression.',
      exampleSentence: 'Understanding cultural nuance makes professional conversations much more effective.',
      difficulty: 'B2',
    },
    {
      word: 'eloquent',
      meaning: 'Fluent, graceful, and persuasive in speaking or writing.',
      exampleSentence: 'His eloquent presentation convinced the stakeholders to approve the project.',
      difficulty: 'C1',
    },
    {
      word: 'confidence',
      meaning: 'A feeling of self-assurance arising from one\'s appreciation of one\'s own abilities.',
      exampleSentence: 'Daily speaking practice with Dutt builds lasting speaking confidence.',
      difficulty: 'A2',
    },
  ];

  for (const vocab of vocabularyData) {
    await prisma.vocabulary.upsert({
      where: { word: vocab.word },
      update: {},
      create: vocab,
    });
  }
  console.log(`✅ Seeded ${vocabularyData.length} vocabulary words`);

  // 3. Optional Development Seed User (clearly marked as dev seed)
  const devEmail = 'learner.dev@dutt.ai';
  // Ensure dev user has demo conversation and mistakes
  const existingDev = await prisma.user.findUnique({ where: { email: devEmail } });
  if (existingDev) {
    const existingMistakes = await prisma.grammarMistake.count({ where: { userId: existingDev.id } });
    if (existingMistakes === 0) {
      const demoConv = await prisma.conversation.create({
        data: {
          userId: existingDev.id,
          mode: 'DAILY_PRACTICE',
          topic: 'Past Activities & Weekend',
          durationSeconds: 720,
          summary: 'Practiced simple past tense verbs and workplace discussions.',
        },
      });

      await prisma.grammarMistake.createMany({
        data: [
          {
            userId: existingDev.id,
            conversationId: demoConv.id,
            originalText: 'I go to the interview yesterday.',
            correctedText: 'I went to the interview yesterday.',
            explanation: 'Use the past tense "went" instead of "go" when referring to yesterday.',
            grammarTopic: 'past_tense',
            severity: 'HIGH',
          },
          {
            userId: existingDev.id,
            conversationId: demoConv.id,
            originalText: 'He don\'t know about the new framework.',
            correctedText: 'He doesn\'t know about the new framework.',
            explanation: 'With singular subjects (he, she, it), use "doesn\'t".',
            grammarTopic: 'subject_verb_agreement',
            severity: 'MEDIUM',
          },
          {
            userId: existingDev.id,
            conversationId: demoConv.id,
            originalText: 'Please discuss about the project architecture.',
            correctedText: 'Please discuss the project architecture.',
            explanation: '"Discuss" does not take the preposition "about".',
            grammarTopic: 'prepositions',
            severity: 'LOW',
          },
        ],
      });

      const today = new Date().toISOString().split('T')[0];
      await prisma.learningProgress.upsert({
        where: { userId_date: { userId: existingDev.id, date: today } },
        update: {},
        create: {
          userId: existingDev.id,
          date: today,
          speakingScore: 74,
          grammarScore: 70,
          vocabularyScore: 78,
          pronunciationScore: 72,
          overallScore: 73,
          minutesPracticed: 12,
        },
      });
      console.log('✅ Seeded demo conversation and grammar mistakes for dev user');
    }
  }

  console.log('✨ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
