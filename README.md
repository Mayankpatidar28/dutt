# Dutt ✦
### Personal AI Agent & Intelligent English Speaking Coach

> *"Meet Dutt — your personal AI agent and voice-powered conversational coach."*

Dutt is a production-ready, full-stack Personal AI Agent with native voice interactions. Built on a resilient agentic loop:

$$\text{UNDERSTAND} \longrightarrow \text{PLAN} \longrightarrow \text{RISK CHECK} \longrightarrow \text{ASK APPROVAL} \longrightarrow \text{EXECUTE} \longrightarrow \text{VERIFY} \longrightarrow \text{REPORT}$$

Dutt assists users with daily tasks, career planning, technical explanations, and natural conversational English without generic or canned fallbacks.

---

## 🌟 Key Features

1. **Personal AI Agent Core:**
   - Goal-oriented task execution with human-in-the-loop safety.
   - Interactive Approval System: `[Allow Once]`, `[Always Allow]`, `[Reject]`.
   - Tool Safety Registry with 3 risk tiers (`LOW`, `APPROVAL_REQUIRED`, `HIGH_RISK`).
   - Prompt Injection Protection: Treats external input as data, never as executable instructions.
   - Partitioned Memory System: Separates profile, preferences, conversation history, and long-term memory without storing secrets.

2. **Natural Voice Conversations:**
   - Real-time speech-to-text with Web Speech API and backend transcription provider.
   - Text-to-speech with natural cadence and browser speech synthesis.
   - 5 practice modes: **Free Conversation**, **Daily Practice**, **Job Interview**, **Roleplay**, and **Debate**.

3. **Flagship Reactive AI VoiceOrb:**
   - Dynamic states: `IDLE`, `LISTENING`, `PROCESSING`, `SPEAKING`, and `ERROR`.
   - Real-time visual audio waveform pulses and volume meter.

3. **Intelligent CEFR Level Calibration (A1 - C1):**
   - 5-question initial diagnostic evaluating grammar, vocabulary, sentence formation, and spoken fluency.
   - Generates personalized learning plan and skill breakdowns (Speaking %, Grammar %, Vocabulary %, Pronunciation %).

4. **Gentle Grammar Mistake Tracking:**
   - Analyzes mistakes in real-time without mid-sentence interruptions.
   - Dedicated **Mistakes page** categorizing mistakes by topic with sample incorrect vs. correct sentences and one-click targeted practice triggers.

5. **Spaced-Repetition Vocabulary System:**
   - Automatically identifies and saves high-value vocabulary from spoken conversations.
   - Flashcard review mode with flip animation and mastery tracking (*New*, *Learning*, *Mastered*, *Review Today*).

6. **Database-Backed Progress & Analytics:**
   - 100% data integrity with zero fabricated metrics.
   - Tracks streak, completed sessions, and total spoken minutes.

7. **Audio Privacy by Design:**
   - Audio recordings are processed on the fly without permanent server storage.

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 6, Tailwind CSS 3, React Router 6, Framer Motion, Lucide Icons, Canvas Confetti |
| **Backend** | Node.js (v20+), Express.js (REST API), JWT Auth, bcryptjs, Zod, Helmet, CORS, Express Rate Limit, Winston |
| **Database & ORM** | Prisma ORM, SQLite (`dev.db` for zero-config local dev), PostgreSQL (`schema.postgresql.prisma` for production) |
| **AI Architecture** | Pluggable Provider Interface (`AIProvider`), Gemini 1.5, OpenAI/Groq, and Intelligent Local Fallback Engine |
| **Testing** | Jest, Supertest (16 integration test suites) |

---

## 📁 Repository Structure

```
dutt-agent/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma              # Local SQLite schema
│   │   ├── schema.postgresql.prisma   # Production PostgreSQL schema
│   │   └── seed.js                    # Database seeder (lessons, vocab, dev user)
│   ├── src/
│   │   ├── config/                    # Environment & Prisma client setup
│   │   ├── middleware/                # JWT Auth, Zod validation, Error handler
│   │   ├── modules/
│   │   │   ├── auth/                  # Register, Login, Me
│   │   │   ├── users/                 # Profile management
│   │   │   ├── assessment/            # Diagnostic calibration & CEFR estimation
│   │   │   ├── conversations/         # Real-time messages & session reports
│   │   │   ├── ai/                    # Direct AI chat & grammar correction
│   │   │   ├── voice/                 # Speech & pronunciation scoring
│   │   │   ├── learning/              # Dashboard, recommendations, lessons
│   │   │   └── progress/              # Real database-backed analytics
│   │   ├── services/
│   │   │   ├── ai/                    # AIProvider interface, MockAIProvider, GeminiProvider
│   │   │   └── speech/                # SpeechService & pronunciation evaluation
│   │   ├── app.js                     # Express app setup
│   │   └── server.js                  # HTTP server bootstrapper
│   ├── tests/
│   │   └── api.test.js                # 16 automated integration tests
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/                # Button, Card, Input, Modal, ScoreCard, States
│   │   │   ├── conversation/          # Message bubble, CorrectionCard, VocabularyCard
│   │   │   ├── voice/                 # Flagship VoiceOrb component
│   │   │   └── layout/                # Navbar, Footer, AppLayout
│   │   ├── hooks/                     # useAuth, useVoice
│   │   ├── pages/                     # Landing, Login, Register, Onboarding, Dashboard, Speaking, SessionReport, Vocabulary, Mistakes, Progress, Settings
│   │   ├── services/                  # api.js client
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── package.json                       # Root workspaces configuration
└── README.md
```

---

## ⚡ Quick Start (Local Setup)

### Prerequisites
- Node.js >= 18.x (tested on v24)
- npm >= 9.x

### 1. Clone & Install Dependencies
```bash
cd dutt-agent
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `backend/.env`:
```bash
cp backend/.env.example backend/.env
```
Default configuration uses local SQLite (`DATABASE_URL="file:./dev.db"`) and the intelligent rule-based local AI fallback (`AI_PROVIDER=mock`), requiring **zero paid API keys** to run all features locally!

### 3. Initialize & Seed Database
```bash
npm run db:migrate --workspace=backend
npm run db:seed --workspace=backend
```
*Seeds:*
- Core grammar & interview lessons (Simple Past Tense, Articles, STAR Method, Restaurant Roleplay, Executive Communication)
- High-frequency vocabulary words (articulate, collaborate, perspective, resilient, nuance, eloquent)
- Pre-configured dev learner account: `learner.dev@dutt.ai` (Password: `DuttPass123!`)

### 4. Run Automated Integration Tests
```bash
npm run test --workspace=backend
```
*(All 16 tests pass covering Auth, Assessment, Conversation, AI Grammar Detection, Pronunciation Scoring, and Progress).*

### 5. Start Development Servers
Start both backend and frontend concurrently:
```bash
# Terminal 1 - Backend (port 5000)
npm run dev:backend

# Terminal 2 - Frontend (port 5173)
npm run dev:frontend
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🔑 Environment Variables Reference

| Variable | Description | Default |
|---|---|---|
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment mode (`development` / `production`) | `development` |
| `CLIENT_URL` | Frontend origin for CORS | `http://localhost:5173` |
| `DATABASE_URL` | Prisma DB connection string | `"file:./dev.db"` |
| `JWT_SECRET` | Secret key for JWT signing | `dutt_dev_jwt_secret_key_...` |
| `JWT_EXPIRES_IN` | JWT token validity | `7d` |
| `AI_PROVIDER` | Active AI provider (`mock`, `gemini`, `openai`, `groq`) | `mock` |
| `GEMINI_API_KEY` | Optional Google Gemini API Key | *(optional)* |
| `OPENAI_API_KEY` | Optional OpenAI API Key | *(optional)* |
| `GROQ_API_KEY` | Optional Groq Cloud API Key | *(optional)* |
| `STT_PROVIDER` | Speech-to-text provider (`browser`, `whisper`) | `browser` |
| `TTS_PROVIDER` | Text-to-speech provider (`browser`) | `browser` |

---

## 📡 REST API Reference Overview

### Authentication
- `POST /api/auth/register` — Create account with initial English level & learning goal
- `POST /api/auth/login` — Sign in and receive JWT token
- `POST /api/auth/logout` — Revoke session
- `GET /api/auth/me` — Retrieve current authenticated user profile

### User Profile
- `GET /api/users/profile` — Get full learner profile & preferences
- `PATCH /api/users/profile` — Update learning goal, target CEFR level, daily goal minutes

### Diagnostic Assessment
- `POST /api/assessment/start` — Retrieve initial calibration questions
- `POST /api/assessment/submit` — Submit answers and evaluate estimated CEFR level (A1-C1)
- `GET /api/assessment/result` — Get latest calibration breakdown

### Conversations & AI
- `POST /api/conversations` — Start a speaking session (`FREE`, `DAILY_PRACTICE`, `INTERVIEW`, `ROLEPLAY`, `DEBATE`)
- `GET /api/conversations` — List conversation history
- `GET /api/conversations/:id` — Get conversation transcript & mistakes
- `POST /api/conversations/:id/messages` — Send user message; returns Dutt reply, grammar correction, and vocabulary
- `POST /api/conversations/:id/end` — Conclude session and generate detailed session report

### Learning & Spaced Repetition
- `GET /api/learning/dashboard` — Complete dashboard metrics (radar scores, streak, daily goal progress)
- `GET /api/learning/recommendations` — Targeted practice recommendations based on weak areas
- `GET /api/learning/mistakes` — Repeated mistakes aggregated by topic
- `GET /api/learning/vocabulary` — Spaced repetition vocabulary lists (`NEW`, `LEARNING`, `MASTERED`, `REVIEW_TODAY`)
- `POST /api/learning/vocabulary/:id/review` — Review word flashcard (`remembered: true/false`)
- `GET /api/learning/lessons` — Pre-seeded and generated practice lessons

### Voice & Pronunciation
- `POST /api/voice/transcribe` — Process audio transcription
- `POST /api/voice/synthesize` — Speech synthesizer metadata
- `POST /api/voice/pronunciation` — Phonetic similarity and syllable accuracy evaluation

### Progress
- `GET /api/progress` — Database-backed progress summary
- `GET /api/progress/weekly` — 7-day practice minutes and score trends
- `GET /api/progress/monthly` — 30-day practice history

---

## 🚀 Production Deployment Guide (AWS EC2 / Ubuntu)

1. **Provision EC2 Instance:** Ubuntu 22.04 LTS (t3.medium or larger recommended).
2. **Install Node.js & PM2:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs nginx
   sudo npm install -g pm2
   ```
3. **Configure PostgreSQL:**
   Update `backend/prisma/schema.prisma` to use PostgreSQL (or use `schema.postgresql.prisma`):
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
   Run migrations:
   ```bash
   npx prisma migrate deploy
   npm run db:seed --workspace=backend
   ```
4. **Build Frontend Bundle:**
   ```bash
   npm run build --workspace=frontend
   ```
   Serve static files in `frontend/dist` with Nginx.
5. **Start PM2 Service:**
   ```bash
   cd backend
   pm2 start src/server.js --name "dutt-backend" -i max
   pm2 save
   pm2 startup
   ```
6. **Configure Nginx Reverse Proxy with SSL (Certbot):**
   Proxy `/api` to `http://localhost:5000` and route other traffic to `/var/www/dutt-frontend/dist`.

---

## 🛡 License & Credits
Developed with ❤️ by the English Learning Dutt Team.
All rights reserved.
