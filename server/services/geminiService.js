import ai, { geminiModel } from '../config/gemini.js';

// Profile Analysis Prompt
export const analyzeProfile = async (profileData) => {
  const prompt = `You are an expert placement preparation advisor. Analyze the following coding profile data and provide a comprehensive assessment.

PROFILE DATA:
${JSON.stringify(profileData, null, 2)}

SCORING RULES (STRICTLY follow these):
1. Base score starts at 0. Maximum is 100.
2. Problems solved: 0-50 problems = 5pts, 51-100 = 10pts, 101-200 = 15pts, 201-400 = 25pts, 400+ = 35pts.
3. Difficulty mix: Hard > 30 problems = +10pts, Hard > 50 = +15pts. Medium > 100 = +10pts. Only Easy heavy = -5pts.
4. CONTEST RATING BONUSES (IMPORTANT):
   - LeetCode: Knight (1800+) = +10pts, Guardian (2000+) = +15pts. Below 1500 = no bonus.
   - Codeforces: Pupil (1200+) = +3pts, Specialist (1400+) = +5pts, Expert (1600+) = +8pts, Candidate Master (1900+) = +12pts.
   - These rating ranges are PLATFORM-SPECIFIC. Do NOT apply LeetCode ranges to Codeforces.
5. Topic coverage: Cover 15+ important DSA topics = +10pts, 10+ = +5pts.
6. Deductions: No graphs/DP/trees practiced = -5pts each. Less than 5 hard problems = -5pts.
7. Score should be HARSH. Most students solving < 200 problems with no contest rating should score below 40.

WEAK AREA IDENTIFICATION:
- Identify topics that are considered MEDIUM or HARD in DSA interviews but the user has solved fewer than 10 questions on.
- Focus on: Dynamic Programming, Graphs, Trees, Backtracking, Segment Trees, Tries, Binary Search on Answer, Sliding Window, Stack/Queue applications, Greedy.
- Call these out explicitly in the weaknesses array.

Provide your analysis in the following JSON format ONLY (no markdown, no extra text):
{
  "placementScore": <number 0-100>,
  "overallAssessment": "<2-3 line summary>",
  "topicCoverage": [
    {"topic": "<topic name>", "percentage": <0-100>, "status": "good|ok|needs_work|critical|not_started", "recommendation": "<1 line>"}
  ],
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1 - must mention specific weak DSA topics>", "<weakness 2>"],
  "thirtyDayPlan": [
    {"week": 1, "topics": ["<topic>"], "dailyProblems": <number>, "goal": "<goal>"},
    {"week": 2, "topics": ["<topic>"], "dailyProblems": <number>, "goal": "<goal>"},
    {"week": 3, "topics": ["<topic>"], "dailyProblems": <number>, "goal": "<goal>"},
    {"week": 4, "topics": ["<topic>"], "dailyProblems": <number>, "goal": "<goal>"}
  ],
  "industryComparison": "<How does this profile compare to industry benchmarks for 2024-25 placements>",
  "expectedInterviewTopics": ["<topic 1>", "<topic 2>"],
  "recommendations": [
    {"priority": "high|medium|low", "action": "<specific actionable recommendation>", "estimatedDays": <number>}
  ]
}

Include these important topics in your coverage analysis: Arrays, Strings, Linked Lists, Stacks & Queues, Trees, Graphs, Dynamic Programming, Greedy, Binary Search, Hashing, Recursion/Backtracking, Sorting, Two Pointers, Sliding Window, Bit Manipulation, System Design, DBMS, OS, Computer Networks.

Be realistic and data-driven. Be STRICT with the score.`;

  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: prompt
  });

  const text = response.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    return JSON.parse(text);
  } catch (e) {
    return { raw: text, error: 'Failed to parse AI response' };
  }
};

// Parse Raw PDF Buffer into structured JSON using Gemini base64 inlineData
export const parseResumeFromBuffer = async (base64PdfBuffer) => {
  const prompt = `Extract text from this PDF and return ONLY a valid JSON object with keys: name, contact, education (array), experience (array), and skills (array).
Make sure to parse out the contact object correctly (email, phone, etc) and the arrays with their respective objects. Do NOT return markdown formatting.`;

  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { data: base64PdfBuffer, mimeType: 'application/pdf' } }
        ]
      }
    ]
  });

  const text = response.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    const parsedData = JSON.parse(text);
    // map the structure back slightly to match the original `sections` idea if possible, or just return as is.
    return parsedData;
  } catch (e) {
    return { name: '', contact: {}, education: [], experience: [], skills: [] };
  }
};

// Resume Analysis Prompt
export const analyzeResume = async (resumeText, targetRole) => {
  const prompt = `You are an expert resume reviewer and ATS optimization specialist. Analyze this resume for the target role: ${targetRole}.

RESUME TEXT:
${resumeText}

Provide your analysis in the following JSON format ONLY (no markdown, no extra text):
{
  "overallScore": <number 0-100>,
  "atsScore": <number 0-100>,
  "sectionReview": {
    "contact": {"score": <0-10>, "issues": ["<issue>"], "suggestions": ["<suggestion>"]},
    "summary": {"score": <0-10>, "issues": ["<issue>"], "suggestions": ["<suggestion>"]},
    "experience": {"score": <0-10>, "issues": ["<issue>"], "suggestions": ["<suggestion>"]},
    "projects": {"score": <0-10>, "issues": ["<issue>"], "suggestions": ["<suggestion>"]},
    "skills": {"score": <0-10>, "issues": ["<issue>"], "suggestions": ["<suggestion>"]},
    "education": {"score": <0-10>, "issues": ["<issue>"], "suggestions": ["<suggestion>"]}
  },
  "missingKeywords": ["<keyword for ${targetRole}>"],
  "suggestions": [
    {"section": "<section>", "issue": "<what's wrong>", "suggestion": "<how to fix>", "priority": "high|medium|low"}
  ],
  "improvedSummary": "<AI-generated improved professional summary>",
  "improvedBullets": ["<improved experience bullet 1>", "<improved experience bullet 2>"],
  "trendingSkillsToAdd": ["<skill 1>", "<skill 2>"],
  "powerVerbSuggestions": ["<verb 1>", "<verb 2>"]
}`;

  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: prompt
  });

  const text = response.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    return JSON.parse(text);
  } catch (e) {
    return { raw: text, error: 'Failed to parse AI response' };
  }
};

// Resume Optimization Prompt
export const optimizeResume = async (resumeSections, targetRole) => {
  const prompt = `You are an expert resume writer. Optimize this resume for the role: ${targetRole}.

CURRENT RESUME SECTIONS:
${JSON.stringify(resumeSections, null, 2)}

Rewrite and improve ALL sections. Return the improved resume in the following JSON format ONLY:
{
  "sections": {
    "contact": ${JSON.stringify(resumeSections.contact || {})},
    "summary": "<improved professional summary, 2-3 lines, action-oriented>",
    "experience": [{"title": "", "company": "", "location": "", "startDate": "", "endDate": "", "bullets": ["<improved bullet with metrics>"]}],
    "education": [{"degree": "", "institution": "", "location": "", "startDate": "", "endDate": "", "gpa": "", "relevant": ""}],
    "projects": [{"name": "", "description": "<improved>", "techStack": [], "bullets": ["<improved bullet>"]}],
    "skills": {"languages": [], "frameworks": [], "tools": [], "databases": [], "other": []},
    "certifications": []
  }
}

Rules:
- Use power verbs (Designed, Developed, Optimized, Implemented, etc.)
- Add quantified metrics where possible (e.g., "Improved performance by 40%")
- Make summary 2-3 lines, action-oriented
- Optimize keywords for ATS for ${targetRole} role
- Keep the structure but improve the content`;

  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: prompt
  });

  const text = response.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    return JSON.parse(text);
  } catch (e) {
    return { raw: text, error: 'Failed to parse AI response' };
  }
};

// Study Chat Prompt
export const studyChat = async (message, conversationHistory, userWeakTopics) => {
  const systemContext = `You are PrepHelp AI - an expert placement preparation study companion. You help students prepare for tech placements (SDE, Backend, Frontend, Data Science roles) at top companies.

${userWeakTopics?.length ? `The student's weak topics are: ${userWeakTopics.join(', ')}. Prioritize these in recommendations.` : ''}

For every explanation:
1. Give a clear, structured explanation (2-3 paragraphs max)
2. Include 1-2 code examples with comments (in JavaScript/Python)
3. Mention Time & Space complexity
4. Provide resources in a structured format

Always be encouraging but honest. Use examples from real interview questions at companies like Google, Amazon, Microsoft, Flipkart, etc.

Format your response in clean markdown with proper headings, code blocks, and bullet points.`;

  const contents = [
    { role: 'user', parts: [{ text: systemContext }] },
    { role: 'model', parts: [{ text: 'I understand. I am PrepHelp AI, your placement preparation study companion. How can I help you today?' }] }
  ];

  // Add conversation history
  if (conversationHistory?.length) {
    conversationHistory.forEach(msg => {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    });
  }

  // Add current message
  contents.push({
    role: 'user',
    parts: [{ text: message }]
  });

  const response = await ai.models.generateContent({
    model: geminiModel,
    contents
  });

  return response.text;
};

// Interview Question Generation
export const generateInterviewQuestion = async (type, previousQuestions, userAnswer) => {
  const prompt = `You are a senior tech interviewer conducting a ${type} interview round.

${previousQuestions?.length ? `Previous questions asked: ${previousQuestions.map(q => q.question).join('; ')}` : 'This is the first question.'}
${userAnswer ? `The candidate's last answer was: "${userAnswer}"` : ''}

Generate the next interview question. Return ONLY this JSON:
{
  "question": "<the interview question>",
  "expectedPoints": ["<key point 1>", "<key point 2>", "<key point 3>"],
  "difficulty": "easy|medium|hard",
  "category": "<category like DSA, System Design, HR, Behavioral, etc.>"
}

${type === 'hr' ? 'Focus on behavioral, situational, and HR questions.' : 'Focus on DSA, System Design, CS fundamentals, and coding questions.'}
Don't repeat previous questions. Progressively increase difficulty.`;

  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: prompt
  });

  const text = response.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    return JSON.parse(text);
  } catch (e) {
    return { question: text, expectedPoints: [], difficulty: 'medium', category: type };
  }
};

// Evaluate Interview Answer
export const evaluateAnswer = async (question, answer, type) => {
  const prompt = `You are a senior interviewer evaluating this answer.

QUESTION: ${question}
CANDIDATE'S ANSWER: ${answer}
INTERVIEW TYPE: ${type}

Evaluate and return ONLY this JSON:
{
  "score": <number 1-10>,
  "feedback": "<2-3 line constructive feedback>",
  "strengths": ["<what was good>"],
  "improvements": ["<what to improve>"],
  "idealAnswer": "<brief ideal answer summary>"
}`;

  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: prompt
  });

  const text = response.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    return JSON.parse(text);
  } catch (e) {
    return { score: 5, feedback: text, strengths: [], improvements: [], idealAnswer: '' };
  }
};

// Generate Interview Report
export const generateInterviewReport = async (session) => {
  const prompt = `Analyze this mock interview session and generate a comprehensive report.

INTERVIEW DATA:
${JSON.stringify(session, null, 2)}

Return ONLY this JSON:
{
  "overallScore": <number 0-100>,
  "communication": <number 1-10>,
  "confidence": <number 1-10>,
  "relevantAnswers": <number 1-10>,
  "problemSolving": <number 1-10>,
  "codeQuality": <number 1-10>,
  "explanation": <number 1-10>,
  "timeManagement": <number 1-10>,
  "improvements": ["<specific improvement 1>", "<specific improvement 2>", "<specific improvement 3>"],
  "summary": "<3-4 line overall assessment>"
}`;

  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: prompt
  });

  const text = response.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    return JSON.parse(text);
  } catch (e) {
    return { overallScore: 50, summary: text };
  }
};
