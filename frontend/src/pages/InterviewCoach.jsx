import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviewAPI } from '../services/api';
import {
  HiOutlineMicrophone, HiOutlineStop, HiOutlinePlay, HiOutlineRefresh,
  HiOutlineLockClosed, HiOutlineChartBar, HiOutlineClock,
  HiOutlineCheckCircle, HiOutlineExclamation, HiOutlineX
} from 'react-icons/hi';
import './InterviewCoach.css';

const InterviewCoach = () => {
  const [interviewType, setInterviewType] = useState('');
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [questionNum, setQuestionNum] = useState(0);
  const [totalQ, setTotalQ] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isSearchingP2P, setIsSearchingP2P] = useState(false);

  const navigate = useNavigate();

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  useEffect(() => {
    loadHistory();
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      synthRef.current.cancel();
    };
  }, []);

  const loadHistory = async () => {
    try {
      const res = await interviewAPI.getHistory();
      setHistory(res.data);
    } catch (err) { /* empty */ }
  };

  const speakText = (text) => {
    return new Promise((resolve) => {
      if (!synthRef.current) return resolve();
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;
      const voices = synthRef.current.getVoices();
      const preferred = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'));
      if (preferred) utterance.voice = preferred;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => { setSpeaking(false); resolve(); };
      utterance.onerror = () => { setSpeaking(false); resolve(); };
      synthRef.current.speak(utterance);
    });
  };

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported. Use Chrome browser.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t + ' ';
        } else {
          interim += t;
        }
      }
      setTranscript(finalTranscript + interim);
    };

    recognition.onerror = (event) => {
      console.error('Speech error:', event.error);
      if (event.error !== 'no-speech') {
        setIsRecording(false);
      }
    };

    recognition.onend = () => {
      if (isRecording) {
        // restart if still recording
        try { recognition.start(); } catch (e) { /* already started */ }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setTranscript('');
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    setIsRecording(false);
  };

  const startInterview = async (type) => {
    setInterviewType(type);
    setLoading(true);
    setReport(null);
    setFeedback(null);
    try {
      const res = await interviewAPI.start(type);
      setSession(res.data.sessionId);
      setCurrentQuestion(res.data.question);
      setQuestionNum(1);
      setTotalQ(type === 'hr' ? 6 : 5);
      await speakText(res.data.question);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start interview');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    const answer = transcript.trim();
    if (!answer || !session) return;

    stopRecording();
    setLoading(true);
    setFeedback(null);

    try {
      const res = await interviewAPI.respond(session, answer);
      setFeedback(res.data.evaluation);

      if (res.data.completed) {
        // End interview and get report
        const reportRes = await interviewAPI.end(session);
        setReport(reportRes.data.report || reportRes.data.session?.report);
        setSession(null);
        setCurrentQuestion('');
        await loadHistory();
      } else {
        setCurrentQuestion(res.data.nextQuestion);
        setQuestionNum(res.data.questionNumber);
        setTranscript('');
        // Speak next question after a short delay
        setTimeout(async () => {
          await speakText(res.data.nextQuestion);
        }, 2000);
      }
    } catch (err) {
      alert('Failed to submit answer');
    } finally {
      setLoading(false);
    }
  };

  const endEarly = async () => {
    if (!session) return;
    if (!window.confirm('End interview early?')) return;
    setLoading(true);
    try {
      const res = await interviewAPI.end(session);
      setReport(res.data.report || res.data.session?.report);
      setSession(null);
      setCurrentQuestion('');
      stopRecording();
      await loadHistory();
    } catch (err) {
      alert('Failed to end interview');
    } finally {
      setLoading(false);
    }
  };

  const viewReport = async (id) => {
    try {
      const res = await interviewAPI.getReport(id);
      setReport(res.data.report);
      setSession(null);
      setCurrentQuestion('');
      setShowHistory(false);
    } catch (err) {
      alert('Failed to load report');
    }
  };

  const resetAll = () => {
    setSession(null);
    setCurrentQuestion('');
    setReport(null);
    setFeedback(null);
    setTranscript('');
    setInterviewType('');
    setQuestionNum(0);
    stopRecording();
    synthRef.current.cancel();
  };

  const findP2PPeer = () => {
    setIsSearchingP2P(true);
    // Simulate matchmaking delay
    setTimeout(() => {
      setIsSearchingP2P(false);
      const randomRoomId = Math.random().toString(36).substring(2, 9);
      navigate(`/interview/p2p/${randomRoomId}`);
    }, 2500);
  };

  const scoreColor = (s) => s >= 7 ? '#00b894' : s >= 5 ? '#fdcb6e' : '#ff6b6b';

  return (
    <div className="page interview-page" id="interview-page">
      <div className="page-header">
        <h1>Voice Interview Coach</h1>
        <p>Practice mock interviews with AI voice agent</p>
      </div>

      {/* Interview Selection */}
      {!session && !report && (
        <div className="interview-start stagger-children">
          <div className="interview-types">
            <div className="glass-card interview-type-card" onClick={() => startInterview('hr')}>
              <div className="itc-icon" style={{ background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)' }}>💼</div>
              <h3>HR Round</h3>
              <p>Behavioral & situational questions. Communication, confidence, and personality assessment.</p>
              <span className="itc-detail">~6 questions • 15 min</span>
              <button className="btn btn-primary" disabled={loading}>
                {loading && interviewType === 'hr' ? 'Starting...' : 'Start HR Interview'}
              </button>
            </div>

            <div className="glass-card interview-type-card" onClick={() => startInterview('technical')}>
              <div className="itc-icon" style={{ background: 'linear-gradient(135deg, #00cec9, #55efc4)' }}>💻</div>
              <h3>Technical Round</h3>
              <p>DSA, System Design, CS fundamentals. Problem-solving and code quality evaluation.</p>
              <span className="itc-detail">~5 questions • 30 min</span>
              <button className="btn btn-success" disabled={loading || isSearchingP2P}>
                {loading && interviewType === 'technical' ? 'Starting...' : 'Start Technical Interview'}
              </button>
            </div>

            <div className="glass-card interview-type-card" onClick={findP2PPeer} style={{ gridColumn: '1 / -1' }}>
              <div className="itc-icon" style={{ background: 'linear-gradient(135deg, #e17055, #fab1a0)' }}>👥</div>
              <h3>P2P Mock Interviews</h3>
              <p>Practice with real peers! Match with another student for a 45-minute live pair-programming session.</p>
              <span className="itc-detail">Live Editor + WebRTC • 45 min</span>
              <button className="btn" style={{ background: '#e17055', color: '#fff' }} disabled={loading || isSearchingP2P}>
                {isSearchingP2P ? 'Searching for peers...' : 'Find a Peer'}
              </button>
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="glass-card" style={{ padding: 24 }}>
              <div className="interview-history-header">
                <h3><HiOutlineClock /> Interview History</h3>
              </div>
              <div className="history-list">
                {history.slice(0, 10).map((h, i) => (
                  <div key={h._id} className="history-item" onClick={() => viewReport(h._id)}>
                    <div className="history-info">
                      <span className="history-type badge badge-primary">{h.type.toUpperCase()}</span>
                      <span className="history-date">{new Date(h.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="history-score" style={{ color: h.overallScore >= 70 ? '#00b894' : h.overallScore >= 40 ? '#fdcb6e' : '#ff6b6b' }}>
                      {h.overallScore}/100
                      {i > 0 && h.overallScore > (history[i-1]?.overallScore || 0) && <span className="history-trend">⬆️</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Interview */}
      {session && (
        <div className="interview-active">
          <div className="interview-progress glass-card">
            <div className="progress-info">
              <span className="badge badge-primary">{interviewType.toUpperCase()} Round</span>
              <span>Question {questionNum} of {totalQ}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${(questionNum / totalQ) * 100}%` }}></div>
            </div>
            <button className="btn btn-sm btn-danger" onClick={endEarly}>
              <HiOutlineX /> End Early
            </button>
          </div>

          {/* Question */}
          <div className="glass-card interview-question">
            <div className="question-header">
              <span className="question-label">Question {questionNum}</span>
              {speaking && <span className="speaking-indicator">🔊 Speaking...</span>}
            </div>
            <p className="question-text">{currentQuestion}</p>
          </div>

          {/* Voice Controls */}
          <div className="glass-card voice-controls">
            <div className="voice-area">
              {isRecording && (
                <div className="waveform">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="waveform-bar" style={{ animationDelay: `${i * 0.1}s` }}></div>
                  ))}
                </div>
              )}

              <div className="voice-buttons">
                {!isRecording ? (
                  <button className="voice-btn record-btn" onClick={startRecording} disabled={loading || speaking}>
                    <HiOutlineMicrophone />
                    <span>Start Speaking</span>
                  </button>
                ) : (
                  <button className="voice-btn stop-btn" onClick={stopRecording}>
                    <HiOutlineStop />
                    <span>Stop</span>
                  </button>
                )}
              </div>

              {/* Transcript */}
              <div className="transcript-area">
                <label>Your Answer:</label>
                <textarea
                  className="input-field transcript-field"
                  value={transcript}
                  onChange={e => setTranscript(e.target.value)}
                  placeholder="Your speech will appear here... You can also type your answer."
                  rows={4}
                />
              </div>

              <button
                className="btn btn-primary btn-lg"
                onClick={submitAnswer}
                disabled={!transcript.trim() || loading}
                style={{ width: '100%' }}
              >
                {loading ? 'Evaluating...' : 'Submit Answer →'}
              </button>
            </div>
          </div>

          {/* Live Feedback */}
          {feedback && (
            <div className="glass-card live-feedback animate-fade-in-up">
              <h4>Feedback on your answer</h4>
              <div className="feedback-score">
                Score: <span style={{ color: scoreColor(feedback.score) }}>{feedback.score}/10</span>
              </div>
              <p className="feedback-text">{feedback.feedback}</p>
              {feedback.strengths?.length > 0 && (
                <div className="feedback-section">
                  <span className="feedback-label" style={{ color: '#00b894' }}>✅ Good:</span>
                  <ul>{feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
              )}
              {feedback.improvements?.length > 0 && (
                <div className="feedback-section">
                  <span className="feedback-label" style={{ color: '#fdcb6e' }}>⚠️ Improve:</span>
                  <ul>{feedback.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Report */}
      {report && (
        <div className="interview-report stagger-children">
          <div className="glass-card report-header-card">
            <h2>Interview Report</h2>
            <div className="report-overall-score" style={{ color: (report.overallScore || 0) >= 70 ? '#00b894' : (report.overallScore || 0) >= 40 ? '#fdcb6e' : '#ff6b6b' }}>
              {report.overallScore || 0}<span>/100</span>
            </div>
            {report.summary && <p className="report-summary">{report.summary}</p>}
          </div>

          <div className="report-scores-grid">
            {[
              { label: 'Communication', value: report.communication },
              { label: 'Confidence', value: report.confidence },
              { label: 'Relevant Answers', value: report.relevantAnswers },
              { label: 'Problem Solving', value: report.problemSolving },
              { label: 'Code Quality', value: report.codeQuality },
              { label: 'Explanation', value: report.explanation },
              { label: 'Time Management', value: report.timeManagement }
            ].filter(s => s.value > 0).map((s, i) => (
              <div key={i} className="glass-card report-score-item">
                <span className="report-score-label">{s.label}</span>
                <div className="report-score-bar">
                  <div className="report-score-fill" style={{ width: `${s.value * 10}%`, background: scoreColor(s.value) }}></div>
                </div>
                <span className="report-score-value" style={{ color: scoreColor(s.value) }}>{s.value}/10</span>
              </div>
            ))}
          </div>

          {report.improvements?.length > 0 && (
            <div className="glass-card" style={{ padding: 24 }}>
              <h4><HiOutlineExclamation style={{ color: '#fdcb6e' }} /> Areas for Improvement</h4>
              <ul className="improvement-list">
                {report.improvements.map((imp, i) => (
                  <li key={i}>{imp}</li>
                ))}
              </ul>
            </div>
          )}

          <button className="btn btn-primary btn-lg" onClick={resetAll} style={{ alignSelf: 'center' }}>
            <HiOutlineRefresh /> Start New Interview
          </button>
        </div>
      )}
    </div>
  );
};

export default InterviewCoach;
