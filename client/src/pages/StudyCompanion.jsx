import { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { HiOutlinePaperAirplane, HiOutlineTrash, HiOutlinePlus, HiOutlineClock, HiOutlineSparkles } from 'react-icons/hi';
import './StudyCompanion.css';

const suggestedTopics = [
  '🔢 Arrays & Hashing', '🔗 Linked Lists', '🌳 Trees & BST',
  '📊 Dynamic Programming', '🕸️ Graph Algorithms', '🏗️ System Design',
  '💾 DBMS Concepts', '🖥️ Operating Systems', '🌐 Computer Networks',
  '🔍 Binary Search', '📚 Stack & Queue', '🧮 Greedy Algorithms'
];

const StudyCompanion = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const res = await chatAPI.getConversations();
      setConversations(res.data);
    } catch (err) {
      console.error('Failed to load conversations');
    } finally {
      setLoadingConvs(false);
    }
  };

  const loadConversation = async (id) => {
    try {
      const res = await chatAPI.getConversation(id);
      setActiveConv(id);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Failed to load conversation');
    }
  };

  const newConversation = () => {
    setActiveConv(null);
    setMessages([]);
  };

  const deleteConversation = async (id, e) => {
    e.stopPropagation();
    try {
      await chatAPI.deleteConversation(id);
      setConversations(prev => prev.filter(c => c._id !== id));
      if (activeConv === id) {
        setActiveConv(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to delete conversation');
    }
  };

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    setInput('');
    const userMsg = { role: 'user', content: msg, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await chatAPI.sendMessage(msg, activeConv);
      const aiMsg = res.data.message;
      setMessages(prev => [...prev, aiMsg]);

      if (!activeConv) {
        setActiveConv(res.data.conversationId);
        loadConversations();
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="page study-page" id="study-page">
      {/* Sidebar - Conversations */}
      <div className="chat-sidebar glass-card">
        <div className="chat-sidebar-header">
          <h3>Conversations</h3>
          <button className="btn btn-sm btn-primary" onClick={newConversation} id="new-chat-btn">
            <HiOutlinePlus /> New
          </button>
        </div>

        <div className="conv-list">
          {conversations.map(conv => (
            <div
              key={conv._id}
              className={`conv-item ${activeConv === conv._id ? 'active' : ''}`}
              onClick={() => loadConversation(conv._id)}
            >
              <div className="conv-item-info">
                <span className="conv-item-title">{conv.title}</span>
                <span className="conv-item-date">
                  <HiOutlineClock /> {new Date(conv.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <button className="conv-delete" onClick={(e) => deleteConversation(conv._id, e)}>
                <HiOutlineTrash />
              </button>
            </div>
          ))}
          {!loadingConvs && conversations.length === 0 && (
            <p className="conv-empty">No conversations yet</p>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-main">
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-welcome">
              <HiOutlineSparkles className="chat-welcome-icon" />
              <h2>PrepHelp Study AI</h2>
              <p>Ask me anything about DSA, System Design, DBMS, OS, Networks, and more!</p>
              <div className="suggested-topics">
                {suggestedTopics.map((topic, i) => (
                  <button
                    key={i}
                    className="suggested-topic"
                    onClick={() => sendMessage(`Explain ${topic.replace(/^[^ ]+ /, '')} with examples and practice problems`)}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.role}`}>
              <div className="chat-message-avatar">
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className="chat-message-content">
                {msg.role === 'assistant' ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={oneDark}
                            language={match[1]}
                            PreTag="div"
                            customStyle={{ borderRadius: 8, fontSize: '0.85rem' }}
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className="inline-code" {...props}>{children}</code>
                        );
                      }
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-message assistant">
              <div className="chat-message-avatar">🤖</div>
              <div className="chat-message-content">
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="chat-input-container">
          <div className="chat-input-wrapper">
            <textarea
              className="chat-input"
              placeholder="Ask anything about placements, DSA, system design..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              id="chat-input"
            />
            <button
              className="chat-send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              id="chat-send-btn"
            >
              <HiOutlinePaperAirplane />
            </button>
          </div>
          <p className="chat-disclaimer">AI can make mistakes. Verify important information.</p>
        </div>
      </div>
    </div>
  );
};

export default StudyCompanion;
