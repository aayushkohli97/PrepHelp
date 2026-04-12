import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { HiOutlineUserAdd, HiOutlineSearch, HiOutlineGlobe, HiOutlineUsers } from 'react-icons/hi';
import { HiOutlineTrophy } from 'react-icons/hi2';
import './P2PInterview.css';

const P2PInterview = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 minutes
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState('// Write your solution here...\n');

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const endInterview = () => {
    if (window.confirm("Are you sure you want to end this mock interview?")) {
      navigate('/interview');
    }
  };

  return (
    <div className="p2p-container">
      <div className="p2p-header">
        <div className="p2p-header-left">
          <h2><HiOutlineCode /> Live P2P Interview</h2>
          <span className="room-id">Room: {roomId}</span>
        </div>
        <div className="p2p-header-center">
          <div className={`timer ${timeLeft < 300 ? 'timer-danger' : ''}`}>
            {formatTime(timeLeft)}
          </div>
        </div>
        <div className="p2p-header-right">
          <button className="btn btn-danger" onClick={endInterview}>
            <HiOutlinePhoneMissed /> End Interview
          </button>
        </div>
      </div>

      <div className="p2p-workspace">
        <div className="p2p-editor-section glass-card">
          <div className="editor-toolbar">
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="language-select input-field"
            >
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
            </select>
          </div>
          <div className="editor-container">
            <Editor
              height="100%"
              language={language}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value)}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on',
                formatOnPaste: true,
              }}
            />
          </div>
        </div>

        <div className="p2p-sidebar glass-card">
          <h3>Video & Audio</h3>
          
          <div className="webrtc-container">
            {/* Remote Peer Video Placeholder */}
            <div className="video-box peer-video">
              <div className="video-placeholder">
                <span>Connecting to peer...</span>
              </div>
              <div className="video-label">Peer (Interviewer)</div>
            </div>

            {/* Local User Video Placeholder */}
            <div className="video-box local-video">
              <div className="video-placeholder active-placeholder">
                <span className="user-initial">You</span>
              </div>
              <div className="video-label">You (Interviewee)</div>
            </div>
          </div>

          <div className="media-controls">
            <button className="media-btn active"><HiOutlineMicrophone /></button>
            <button className="media-btn active"><HiOutlineVideoCamera /></button>
          </div>

          <div className="chat-placeholder">
            <div className="chat-header">Text Chat</div>
            <div className="chat-messages">
              <div className="system-msg">Room created. Please be respectful.</div>
            </div>
            <input type="text" className="input-field" placeholder="Type a message..." disabled />
          </div>
        </div>
      </div>
    </div>
  );
};

export default P2PInterview;
