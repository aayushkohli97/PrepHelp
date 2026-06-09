# PrepHelp — Complete Project Documentation

> **Purpose of this document:** Any developer or AI agent reading this file should be able to fully understand *what the project does*, *how it is built*, *which technologies are used and why*, *how data flows end-to-end*, and *what design decisions were made* — without reading a single line of source code.

---

## 1. Project Overview

**PrepHelp** is a full-stack **AI-Powered Placement Preparation Platform** for students targeting tech company placements (SDE roles at Google, Amazon, etc.). It integrates multiple coding platforms, provides AI-driven resume building / analysis, a study companion chatbot, and a mock interview coach — all in a single cohesive dashboard.

### Core Modules

| Module | Route | What it Does |
|---|---|---|
| **Dashboard** | `/dashboard` | Shows connected coding profiles (LeetCode, Codeforces, CodeChef, HackerRank) with stats, Gemini AI placement score analysis, heatmaps, and topic charts |
| **Resume Builder** | `/resume` | Upload PDF → AI-parse into structured editor → Live HTML preview → AI analysis & optimization → PDF download |
| **Study Companion** | `/study` | Chat with Gemini AI for DSA/CS explanations, code examples, complexity analysis |
| **Interview Coach** | `/interview` | AI-generated mock interview questions (Technical / HR) → user responds → AI evaluates → generates detailed report |

---

## 2. Tech Stack

### Backend (`/backend`)

| Technology | Version | Purpose |
|---|---|---|
| **Node.js + Express 5** | `express@5.2.1` | Core REST API server with async error handling |
| **MongoDB + Mongoose 9** | `mongoose@9.4.1` | Document database for users, resumes, chats, interviews, coding profiles |
| **@google/genai** | `@google/genai@1.48.0` | Official Google Gemini AI SDK — powers all AI features (resume parsing, profile analysis, chat, interview) |
| **Multer** | `multer@2.1.1` | Handles multipart file uploads (PDF resumes) |
| **pdf-parse** | `pdf-parse@1.1.1` | Extracts raw text from uploaded PDF files |
| **bcryptjs** | `bcryptjs@3.0.3` | Password hashing for authentication |
| **jsonwebtoken** | `jsonwebtoken@9.0.3` | JWT token generation and verification |
| **axios** | `axios@1.14.0` | Server-side HTTP requests to coding platform APIs |
| **cheerio** | `cheerio@1.2.0` | HTML scraping for coding profiles that lack APIs |
| **nodemon** | `nodemon@3.1.14` | Dev-only hot-reload server |

### Frontend (`/frontend`)

| Technology | Version | Purpose |
|---|---|---|
| **React 19** | `react@19.2.4` | UI framework using functional components + hooks |
| **Vite 8** | `vite@8.0.4` | Fast dev server & build tool |
| **React Router DOM 7** | `react-router-dom@7.14.0` | Client-side routing (SPA) |
| **Axios** | `axios@1.14.0` | API communication with JWT interceptors |
| **Handlebars** | `handlebars@4.7.9` | LaTeX template engine (stored for potential future LaTeX PDF export) |
| **Recharts** | `recharts@3.8.1` | Charts for dashboard (topic distribution, heatmaps) |
| **react-markdown** | `react-markdown@10.1.0` | Renders AI chat responses in markdown |
| **react-icons** | `react-icons@5.6.0` | Icon library (HeroIcons) |
| **html2canvas + jspdf** | `html2canvas@1.4.1`, `jspdf@4.2.1` | Client-side PDF generation from HTML preview |
| **react-dropzone** | `react-dropzone@15.0.0` | Drag-and-drop file upload UI |

### AI Model

| Config | Value | File |
|---|---|---|
| Provider | Google Gemini | `backend/config/gemini.js` |
| Model | `gemini-2.5-flash` | `backend/config/gemini.js` |
| API Key | `process.env.GEMINI_API_KEY` | `.env` |

---

## 3. Project File Structure

```
PrepHelp/
├── backend/                         # Backend (Node.js + Express)
│   ├── server.js                   # Entry point — Express app setup, middleware, routes
│   ├── config/
│   │   ├── db.js                   # MongoDB connection (mongoose.connect)
│   │   └── gemini.js               # Gemini AI client initialization + model name export
│   ├── middleware/
│   │   ├── auth.js                 # JWT protect middleware + premiumOnly guard
│   │   ├── upload.js               # Multer config (disk storage, 5MB limit, PDF/DOC filter)
│   │   └── errorHandler.js         # Global Express error handler
│   ├── models/
│   │   ├── User.js                 # User schema (name, email, password, isPremium, codingProfiles)
│   │   ├── Resume.js               # Resume schema (sections, latexTemplate, aiAnalysis, pdfUrl, originalPdfText)
│   │   ├── CodingProfile.js        # Scraped coding profile data
│   │   ├── ChatConversation.js     # Study companion chat history
│   │   └── InterviewSession.js     # Mock interview sessions
│   ├── controllers/
│   │   ├── authController.js       # register, login, getMe, updateProfile
│   │   ├── profileController.js    # fetchProfiles, fetchSingle, removeProfile, getStats, getAnalysis
│   │   ├── resumeController.js     # upload, create, CRUD, analyze, optimize, delete
│   │   ├── chatController.js       # sendMessage, getConversations, deleteConversation
│   │   └── interviewController.js  # start, respond, end, getHistory, getReport
│   ├── services/
│   │   ├── geminiService.js        # ALL Gemini AI prompts: analyzeProfile, parseResume, analyzeResume, optimizeResume, studyChat, generateInterviewQuestion, evaluateAnswer, generateInterviewReport
│   │   ├── resumeParser.js         # extractTextFromPDF (uses pdf-parse)
│   │   ├── leetcodeService.js      # LeetCode GraphQL API scraper
│   │   ├── codeforcesService.js    # Codeforces API fetcher
│   │   ├── codechefService.js      # CodeChef scraper (cheerio)
│   │   └── hackerrankService.js    # HackerRank scraper (cheerio)
│   ├── routes/
│   │   ├── authRoutes.js           # /api/auth/*
│   │   ├── profileRoutes.js        # /api/profile/*
│   │   ├── resumeRoutes.js         # /api/resume/*
│   │   ├── chatRoutes.js           # /api/chat/*
│   │   └── interviewRoutes.js      # /api/interview/*
│   └── uploads/                    # Stored uploaded PDF files (served statically)
│
├── frontend/                         # Frontend (Vite + React)
│   ├── src/
│   │   ├── App.jsx                 # Router setup, ProtectedRoute/PublicRoute wrappers, AppLayout
│   │   ├── main.jsx                # React DOM render entry
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # React Context for auth state (user, token in sessionStorage)
│   │   ├── components/
│   │   │   └── layout/
│   │   │       ├── Sidebar.jsx     # Navigation sidebar (Dashboard, Resume, Study, Interview)
│   │   │       └── Navbar.jsx      # Top navbar with user info
│   │   ├── pages/
│   │   │   ├── Landing.jsx/.css    # Public landing page
│   │   │   ├── Login.jsx           # Login form
│   │   │   ├── Register.jsx        # Registration form
│   │   │   ├── Dashboard.jsx/.css  # Main dashboard with coding profiles + AI analysis
│   │   │   ├── ResumeBuilder.jsx/.css  # Resume editor, preview, analysis UI
│   │   │   ├── StudyCompanion.jsx/.css # AI chat interface
│   │   │   └── InterviewCoach.jsx/.css # Mock interview UI
│   │   ├── services/
│   │   │   └── api.js              # Axios instance + all API endpoint wrappers
│   │   └── styles/
│   │       ├── index.css           # Root CSS variables, global reset styles
│   │       ├── variables.css       # CSS custom properties (colors, spacing, fonts)
│   │       └── animations.css      # Keyframe animations
│   └── public/                     # Static assets
│
└── project_documentation.md        # This file
```

---

## 4. Authentication System

**Approach:** Stateless JWT-based authentication.

| Step | What Happens | File |
|---|---|---|
| **Register** | Hash password with `bcryptjs` → save User doc → generate JWT with `user._id` → return token | `authController.js` |
| **Login** | Find user by email → compare password → generate JWT → return token | `authController.js` |
| **Token Storage** | Frontend stores token in `sessionStorage` under key `prephelp_token` | `AuthContext.jsx` |
| **Auto-attach** | Axios interceptor reads token from sessionStorage and adds `Authorization: Bearer <token>` to every request | `api.js` |
| **Verify** | `protect` middleware decodes JWT, fetches User from DB, attaches `req.user` | `auth.js` |
| **401 Handling** | If any response returns 401, interceptor clears sessionStorage and redirects to `/login` | `api.js` |

---

## 5. Resume Builder — Full Architecture

This is the most complex module. Here's the complete data flow:

### 5.1 Resume Data Model (`Resume.js`)

```
Resume {
  userId             → ObjectId (ref: User)
  title              → String ("My Resume")
  targetRole         → String ("SDE-1")
  sections: {
    contact          → { name, email, phone, linkedin, github, portfolio, location }
    summary          → String
    experience[]     → { title, company, location, startDate, endDate, current, bullets[] }
    education[]      → { degree, institution, location, startDate, endDate, gpa, relevant }
    projects[]       → { name, description, techStack[], link, github, bullets[] }
    skills           → { languages[], frameworks[], tools[], databases[], other[] }
    certifications[] → String[]
    customCss        → String
  }
  latexTemplate      → String (Handlebars-templated LaTeX code from Gemini)
  template           → Enum ['modern', 'minimalist', 'corporate', 'tech', 'creative', 'custom']
  aiAnalysis: {
    overallScore     → Number (0-100)
    atsScore         → Number (0-100)
    suggestions[]    → { section, issue, suggestion, priority }
    missingKeywords[] → String[]
    improvedSummary  → String
    improvedBullets[] → String[]
  }
  originalPdfText    → String (raw text extracted by pdf-parse — stored for re-analysis)
  pdfUrl             → String (e.g. "/uploads/resume-123456789.pdf")
  timestamps         → createdAt, updatedAt (auto)
}
```

### 5.2 Resume API Endpoints

| Method | Route | Controller | Gemini API? | Description |
|---|---|---|---|---|
| `POST` | `/api/resume/upload` | `uploadResume` | **YES** (1 call, `parseResume`) | Upload PDF → extract text → AI parse → save to DB |
| `POST` | `/api/resume/create` | `createResume` | No | Create blank resume from scratch |
| `GET` | `/api/resume` | `getResumes` | No | List all user's resumes |
| `GET` | `/api/resume/:id` | `getResume` | No | Get single resume by ID |
| `PUT` | `/api/resume/:id` | `updateResume` | No | Update sections/template/title |
| `POST` | `/api/resume/:id/analyze` | `analyzeResumeById` | **CACHED** — returns DB result if exists, only calls AI if `?force=true` | AI resume analysis |
| `POST` | `/api/resume/:id/optimize` | `optimizeResumeById` | **YES** (1 call, only on explicit user click) | AI resume optimization |
| `DELETE` | `/api/resume/:id` | `deleteResume` | No | Delete resume |

### 5.3 Upload Flow — Step by Step

```
[User clicks "Upload PDF"]
        ↓
[Frontend] FormData with .pdf file + targetRole
        ↓ POST /api/resume/upload
[Multer middleware] saves file to /uploads/resume-{timestamp}.pdf
        ↓
[resumeParser.js] extractTextFromPDF() reads raw text using pdf-parse
        ↓
[geminiService.js] parseResume(rawText) — ONE Gemini API call
   Gemini extracts:
   1. sections{} — structured JSON (contact, experience, education, etc.)
   2. latexTemplate — complete .tex code with Handlebars variables
        ↓
[resumeController.js] Resume.create({ sections, latexTemplate, pdfUrl, originalPdfText })
        ↓ 201 JSON response
[Frontend] setSections(data.sections) → setView('preview')
   → TemplateRenderer instantly renders HTML preview
```

**Critical: If Gemini API is down (503 error), the resume is STILL saved** with empty sections + the uploaded PDF. User can manually fill data in the editor. This is handled by a nested try-catch:
```js
try {
  const parsedData = await parseResume(text);  // Gemini call
  parsedSections = parsedData.sections || {};
} catch (aiErr) {
  console.error('Gemini failed, saving with empty sections');
  // parsedSections remains {} — resume still gets created
}
```

### 5.4 Loading a Saved Resume (NO AI call)

```
[User clicks resume in sidebar]
        ↓
[Frontend] resumeAPI.getOne(id) → GET /api/resume/:id
        ↓
[Backend] Resume.findOne({ _id, userId }) → returns full document from MongoDB
        ↓ (ZERO Gemini API calls)
[Frontend] setSections(data.sections) → editor fields populated
           setLatexTemplate(data.latexTemplate)
           setAnalysis(data.aiAnalysis) if exists
           setView('editor')
```

### 5.5 Live Preview — How it Works

**Approach: Pure HTML/CSS rendering in the browser** (NOT external LaTeX compilation).

Previously we tried using `latexonline.cc` as an external LaTeX-to-PDF service loaded in an iframe. This was abandoned because:
- The service was unreliable (hung for 20+ minutes)
- Special characters in user input broke LaTeX compilation
- Rate limiting blocked rapid edits

**Current approach:** The `TemplateRenderer` React component renders resume data as a clean, professional A4-style HTML page directly in the browser:

```jsx
const TemplateRenderer = ({ sections }) => {
  // Renders a white A4 page (816px × 1056px) with:
  // - Times New Roman font, 11pt
  // - Centered header with name + contact
  // - Sections with horizontal rules: Summary, Experience, Education, Projects, Skills, Certifications
  // - Each entry has title/company/date layout matching real resumes
};
```

**CSS classes:** All prefixed with `lr-` (live-resume): `.live-resume-page`, `.lr-header`, `.lr-section`, `.lr-entry`, `.lr-bullets`, `.lr-skills-grid`, etc.

**Updates are INSTANT** — as user types in the Editor tab and switches to Preview, React re-renders with the latest state. No compilation delay. No external service.

### 5.6 AI Analysis — Caching Strategy

**Problem:** The old code called Gemini AI every time the user clicked "Analyze", even if the analysis was already done and saved in the database. This wasted API credits.

**Solution:** Server-side cache check + frontend guard:

**Backend logic** (`analyzeResumeById`):
```js
const forceReanalyze = req.query.force === 'true';
if (!forceReanalyze && resume.aiAnalysis?.overallScore) {
  // Return cached result from DB — ZERO API calls
  return res.json({ resume, analysis: resume.aiAnalysis });
}
// Only reaches here if no cached analysis or force=true
const analysis = await analyzeResume(resumeText, resume.targetRole); // Gemini call
```

**Frontend logic** (`analyzeResume` function):
```js
const analyzeResume = async (force = false) => {
  if (!force && analysis) {       // Already loaded in state?
    setView('analysis');           // Just show it — no API call
    return;
  }
  // ... make API call only when needed
};
```

**UI:** Two separate buttons:
- **"🔍 View Analysis"** — shows cached result (no API call)
- **"🔄 Re-Analyze"** — appears only if analysis exists; explicitly forces a new Gemini call

### 5.7 AI API Usage Summary

| Action | When AI is Called | Gemini Calls |
|---|---|---|
| Upload PDF | **Once** on first upload | 1 (`parseResume`) |
| Load saved resume | Never — DB fetch | 0 |
| Edit fields | Never — local React state | 0 |
| View preview | Never — HTML rendering | 0 |
| Click "Analyze" | **Only if no cached result** | 0 or 1 |
| Click "Re-Analyze" | Always (user explicitly requests) | 1 |
| Click "AI Optimize" | Always (user explicitly requests) | 1 |
| Save resume | Never — DB write | 0 |
| Delete resume | Never — DB delete | 0 |

---

## 6. Gemini AI Integration Details

All AI prompts live in `backend/services/geminiService.js`. Each function:
1. Constructs a detailed prompt with strict JSON output format
2. Calls `ai.models.generateContent({ model: geminiModel, contents: prompt })`
3. Strips markdown code fences from response: `.replace(/```json\n?/g, '').replace(/```\n?/g, '')`
4. Parses JSON; returns fallback object on parse failure

### Functions in geminiService.js

| Function | Purpose | Called From |
|---|---|---|
| `analyzeProfile(profileData)` | Generates placement readiness score (0-100) with topic coverage, strengths, weaknesses, 30-day plan | `profileController.js` |
| `parseResume(pdfText)` | Extracts structured sections + LaTeX template from raw PDF text | `resumeController.js` (upload) |
| `analyzeResume(text, role)` | ATS scoring, section review, missing keywords, improved summary | `resumeController.js` (analyze) |
| `optimizeResume(sections, role)` | Rewrites all sections with power verbs, metrics, ATS keywords | `resumeController.js` (optimize) |
| `studyChat(message, history, weakTopics)` | Multi-turn study assistant with code examples | `chatController.js` |
| `generateInterviewQuestion(type, prev, answer)` | Progressive difficulty interview questions | `interviewController.js` |
| `evaluateAnswer(question, answer, type)` | Scores answer 1-10 with feedback | `interviewController.js` |
| `generateInterviewReport(session)` | End-of-interview comprehensive report | `interviewController.js` |

---

## 7. Error Handling Patterns

### Problem Encountered
Express 5 async route handlers do NOT auto-catch rejected promises. An unhandled Gemini 503 error would crash the entire Node.js process.

### Solution Applied
Every controller that calls Gemini has a **nested try-catch** pattern:

```js
export const someController = async (req, res) => {
  try {
    // ... outer try: catches DB errors, validation errors
    try {
      // ... inner try: Gemini AI call
      const result = await geminiFunction(data);
    } catch (aiErr) {
      // AI failed, but request doesn't fail — use fallback
      console.error('AI failed:', aiErr.message);
    }
    // ... continue saving to DB with whatever data we have
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
```

**Delete route** uses `next(error)` for the global error handler:
```js
export const deleteResume = async (req, res, next) => {
  try { ... } catch (error) { next(error); }
};
```

---

## 8. Frontend API Service (`api.js`)

Single Axios instance at `http://localhost:5000/api` with 30s timeout.

**Request interceptor:** Attaches `Bearer <token>` from `sessionStorage.getItem('prephelp_token')`.

**Response interceptor:** On 401, clears auth data and redirects to `/login`.

**API modules:**
- `authAPI` — register, login, getMe, updateProfile
- `profileAPI` — fetchAll, fetchSingle, removeProfile, verifyPassword, getStats, getAnalysis
- `resumeAPI` — upload, create, getAll, getOne, update, analyze, optimize, delete
- `chatAPI` — sendMessage, getConversations, deleteConversation
- `interviewAPI` — start, respond, end, getHistory, getReport

---

## 9. PDF Download

**Approach:** Client-side HTML-to-PDF using `html2canvas` + `jspdf`.

When user clicks the PDF download button:
1. `html2canvas` captures the `#resume-preview` DOM element as a canvas image
2. `jspdf` creates a new PDF document
3. The canvas is added to the PDF as an image
4. The PDF is saved/downloaded

This means the PDF looks exactly like what the user sees in the preview.

---

## 10. Coding Profile Integration

### Supported Platforms

| Platform | Service File | Data Fetching Method |
|---|---|---|
| LeetCode | `leetcodeService.js` | GraphQL API (`leetcode.com/graphql`) |
| Codeforces | `codeforcesService.js` | Official REST API (`codeforces.com/api`) |
| CodeChef | `codechefService.js` | HTML scraping with `cheerio` |
| HackerRank | `hackerrankService.js` | HTML scraping with `cheerio` |

Profile data is stored in `CodingProfile.js` model and linked to the user.
The Dashboard aggregates all connected profiles and sends combined data to `analyzeProfile()` for AI scoring.

---

## 11. Environment Variables (`.env`)

```
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=<secret key>
GEMINI_API_KEY=<Google AI API key>
```

---

## 12. Running the Project

```bash
# Terminal 1: Start backend
cd backend
npm install
npm run dev          # Starts nodemon on port 5000

# Terminal 2: Start frontend
cd frontend
npm install
npm run dev          # Starts Vite on port 5173
```

**CORS:** Backend allows `http://localhost:5173` (Vite dev server).
**Static files:** Uploaded PDFs served from `/uploads` directory.
**Body limit:** JSON payloads up to 10MB (`express.json({ limit: '10mb' })`).

---

## 13. Key Design Decisions & Rationale

| Decision | Why |
|---|---|
| **HTML/CSS preview instead of LaTeX compilation** | External LaTeX service (`latexonline.cc`) was unreliable — hung for 20+ min. Local `pdflatex` requires 3-4GB install. HTML renders instantly. |
| **LaTeX template still stored in DB** | Preserved for future server-side PDF generation if `pdflatex` is installed, or for users who want raw `.tex` export |
| **Nested try-catch for AI calls** | Gemini API can return 503 during high demand. App must not crash — save what we can, user fills rest manually |
| **Analysis caching with `?force=true`** | Minimize API credits. Analysis is expensive. Show DB-cached result by default, only re-run when user explicitly asks |
| **sessionStorage (not localStorage)** | Tokens cleared on tab close for security |
| **Handlebars installed but not used for live preview** | Was originally used for LaTeX variable injection. Kept as dependency since `latexTemplate` data still exists in DB for potential future use |
| **Single Gemini model (`gemini-2.5-flash`)** | Fastest + cheapest Gemini model. Sufficient for structured JSON extraction and text analysis 
