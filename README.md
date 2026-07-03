<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose_9-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini_AI-2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
</p>

<h1 align="center">✨ PrepHelp — AI-Powered Placement Preparation Platform</h1>

<p align="center">
  <strong>Stop coding randomly. Start preparing strategically.</strong><br/>
  Analyze coding profiles, build professional resumes, study with AI, practice mock interviews, and track your prep — all powered by Google Gemini.
</p>

---

## 🎯 What is PrepHelp?

A full-stack platform for students targeting SDE roles at top tech companies. It aggregates coding profiles from 4 platforms, provides a deterministic LaTeX resume builder, a study chatbot, voice-based mock interviews, gamified goal tracking, and competitive leaderboard.

---

## 🚀 Features

### 📊 Coding Profile Dashboard
- Connect **LeetCode, Codeforces, CodeChef, HackerRank**
- AI Placement Score (0-100) with strict scoring rubric
- Topic coverage heatmaps, charts, and personalized **30-day prep plan**

### 📄 Deterministic LaTeX Resume Builder
- **Instant Structured Forms** — user-friendly nested sections (Experience, Education, Projects, Skills) with dynamic input mapping
- **Live Multi-Device Preview** — responsive iframe renderer with real-time template tracking on desktop and mobile
- **True LaTeX Compilation** — optimized HTTP API pipeline compiles raw `.tex` data directly in memory (Buffers), eliminating server disk bottlenecks
- **Flawless PDF Downloads** — binary stream delivery to the browser, guaranteeing strict corporate-standard A4 layouts without layout shifts

### 🤖 Study Companion
- Multi-turn chat with Gemini AI for DSA, System Design, OS, DBMS
- Code examples with complexity analysis | Markdown-rendered responses
- Conversation history management

### 🎙️ Voice Interview Coach
- **HR Round** (6 questions) and **Technical Round** (5 questions)
- Speech-to-Text + Text-to-Speech for realistic interview experience
- Per-answer scoring (1-10) with detailed feedback
- End-of-interview report across 7 dimensions (Communication, Confidence, Problem Solving, etc.)

### 🔥 PrepTrack — Gamified Goals
- Create daily/weekly/monthly challenges and **bet PrepCoins**
- Score < 50% = lose bet | Score 100% = earn **2x coins**
- Task rollover for incomplete items | Interactive graphs tracking consistency and challenge results

### 🏆 Rating Leaderboard
- Global + Rivals leaderboard ranked by contest rating
- Filter by platform | Podium display for top 3
- Add rivals by name/email for personal competition

### 🔐 Auth & Security
- JWT authentication with email OTP verification (Brevo SMTP)
- Forgot password flow | Passwords & OTPs hashed with bcryptjs
- Multi Gemini API key rotation for rate-limit resilience

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 8, React Router 7, Recharts, Monaco Editor, react-markdown |
| **Backend** | Node.js, Express 5, Mongoose 9, Multer, pdf-parse, Cheerio, Axios |
| **AI** | Google Gemini 2.5 Flash (`@google/genai`) with multi-key rotation |
| **Database** | MongoDB Atlas |
| **Auth** | JWT + bcryptjs + Brevo SMTP (OTP emails) |
| **Deployment** | Vercel (frontend) |

---


## ⚡ Getting Started

### Prerequisites
- Node.js v18+ | MongoDB (local or Atlas) | [Gemini API Key](https://aistudio.google.com/app/apikey)

### Setup

```bash
# Clone
git clone https://github.com/aayushkohli97/PrepHelp.git
cd PrepHelp

# Backend
cd backend
npm install
# Create .env (see below)
npm run dev          # → port 5000

# Frontend (new terminal)
cd frontend
npm install
# Create .env (see below)
npm run dev          # → port 5173
```

### Backend `.env`

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/prephelp
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_key
# Optional
GEMINI_API_KEYS=key1,key2,key3
BREVO_API_KEY=your_brevo_key
FRONTEND_URL=https://your-frontend.vercel.app
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📡 API Endpoints

| Area | Endpoints | Key Routes |
|---|---|---|
| **Auth** | 8 routes | Register, Login, Verify Email (OTP), Forgot/Reset Password |
| **Profiles** | 5 routes | Fetch/remove coding profiles, AI analysis |
| **Resume** | 8 routes | Upload PDF, CRUD |
| **Chat** | 3 routes | Send message, list/delete conversations |
| **Interview** | 5 routes | Start, respond, end, history, report |
| **PrepTrack** | 7 routes | Create, lock, edit, toggle task, evaluate, history |
| **Leaderboard** | 4 routes | Global/rivals ranking, add/remove rival |

> All protected routes require `Authorization: Bearer <token>` header.

---

## 🔮 Coming Soon

| Feature | Status | Notes |
|---|---|---|
| **P2P Mock Interviews** | 🏗️ UI Ready | Room UI with Monaco editor exists. WebRTC signaling (Socket.io) and peer matching not yet implemented. |
| **Premium Tier** | 🏷️ Labeled | PRO badge and `premiumOnly` middleware exist. No payment integration yet. |
| **LaTeX Resume Export** | 📦 Data Stored | AI-generated LaTeX templates stored in DB. Direct `.tex` file export planned. |
| **Notifications** | 📋 Planned | Push notifications for deadlines, wager results, rival activity. |
| **Mobile App** | 📋 Planned | React Native companion app. |

---

## 🧩 Design Decisions

| Decision | Why |
|---|---|
| **True LaTeX compilation** | In-memory `.tex` → PDF via HTTP API ensures pixel-perfect corporate-standard A4 output. No disk I/O bottleneck. |
| **sessionStorage** | Tokens clear on tab close for security. |
| **Multi-key Gemini rotation** | Prevents rate-limit failures. Round-robin across keys. |
| **Nested try-catch for AI** | Gemini 503s don't crash the server. Partial data saved, user fills rest. |
| **DataContext caching** | Prevents redundant API calls when switching tabs. Cache clears on logout. |

---



<p align="center">
  Built with ❤️ for students preparing for placements<br/>
  <strong>PrepHelp</strong> — Your AI Placement Readiness Coach
</p>
