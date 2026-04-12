import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileAPI, authAPI } from '../services/api';
import {
  HiOutlineFire,HiOutlineRefresh, HiOutlineLightningBolt, HiOutlineChartBar,
  HiOutlineAcademicCap, HiOutlineTrendingUp, HiOutlinePlus,
  HiOutlinePencil, HiOutlineTrash, HiOutlineShieldCheck,
  HiOutlineX, HiOutlineExclamation, HiOutlineChevronDown
} from 'react-icons/hi';
import { SiLeetcode, SiCodechef, SiHackerrank, SiCodeforces } from 'react-icons/si';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import WagerDashboard from '../components/dashboard/WagerDashboard';
import Leaderboard from '../components/dashboard/Leaderboard';
import './Dashboard.css';

const platformConfig = {
  leetcode: { name: 'LeetCode', icon: SiLeetcode, color: '#FFA116' },
  codechef: { name: 'CodeChef', icon: SiCodechef, color: '#5B4638' },
  hackerrank: { name: 'HackerRank', icon: SiHackerrank, color: '#00EA64' },
  codeforces: { name: 'Codeforces', icon: SiCodeforces, color: '#1890FF' }
};

const Dashboard = () => {
  const { user, updateUser } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('overview');

  // Profile management states
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [syncingProfiles, setSyncingProfiles] = useState({});

  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordAction, setPasswordAction] = useState(null); // { type: 'remove' | 'update', platform }
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Confirm removal modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmPlatform, setConfirmPlatform] = useState('');

  // Chart dropdown states
  const [difficultyPlatform, setDifficultyPlatform] = useState('all');
  const [topicPlatform, setTopicPlatform] = useState('all');

  // Score modal
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [scoreData, setScoreData] = useState(null);
  const [scoreLoading, setScoreLoading] = useState(false);

  // First-time setup check
  const hasProfiles = profiles.length > 0;
  const connectedPlatforms = profiles.map(p => p.platform);
  const availablePlatforms = Object.keys(platformConfig).filter(k => !connectedPlatforms.includes(k));

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const res = await profileAPI.getStats();
      setProfiles(res.data);
    } catch (err) { /* No profiles yet */ }
  };

  // --- Sync individual profile ---
  const syncProfile = async (platform, username) => {
    setSyncingProfiles(prev => ({ ...prev, [platform]: true }));
    try {
      await profileAPI.fetchSingle(platform, username);
      await loadProfiles();
    } catch (err) {
      console.error(`Failed to sync ${platform}:`, err);
    } finally {
      setSyncingProfiles(prev => ({ ...prev, [platform]: false }));
    }
  };

  // --- Add new profile ---
  const addProfile = async () => {
    if (!selectedPlatform || !newUsername.trim()) return;
    setAddLoading(true);
    setErrors({});
    try {
      await profileAPI.fetchSingle(selectedPlatform, newUsername.trim());
      await loadProfiles();
      setShowAddProfile(false);
      setSelectedPlatform('');
      setNewUsername('');
    } catch (err) {
      setErrors({ add: err.response?.data?.message || `Failed to fetch ${selectedPlatform} profile` });
    } finally {
      setAddLoading(false);
    }
  };

  // --- Request password for update/remove ---
  const requestPasswordFor = (type, platform) => {
    if (type === 'remove') {
      setConfirmPlatform(platform);
      setShowConfirmModal(true);
    } else {
      setPasswordAction({ type, platform });
      setPasswordInput('');
      setPasswordError('');
      setShowPasswordModal(true);
    }
  };

  const confirmRemoval = () => {
    setShowConfirmModal(false);
    setPasswordAction({ type: 'remove', platform: confirmPlatform });
    setPasswordInput('');
    setPasswordError('');
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async () => {
    if (!passwordInput.trim()) { setPasswordError('Password is required'); return; }
    setPasswordLoading(true);
    setPasswordError('');

    try {
      if (passwordAction.type === 'remove') {
        await profileAPI.removeProfile(passwordAction.platform, passwordInput);
        await loadProfiles();
        setShowPasswordModal(false);
      } else if (passwordAction.type === 'update') {
        await profileAPI.verifyPassword(passwordInput);
        setShowPasswordModal(false);
        // After verification, open the add profile form pre-filled for update
        setSelectedPlatform(passwordAction.platform);
        const existing = profiles.find(p => p.platform === passwordAction.platform);
        setNewUsername(existing?.username || '');
        setShowAddProfile(true);
      }
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Incorrect password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // --- Get Score (floating button) ---
  const getScore = async () => {
    setScoreLoading(true);
    setShowScoreModal(true);
    setScoreData(null);
    try {
      const res = await profileAPI.getAnalysis();
      setAnalysis(res.data.analysis);
      setScoreData(res.data.analysis);
      if (res.data.analysis.placementScore) {
        updateUser({ placementScore: res.data.analysis.placementScore });
      }
    } catch (err) {
      setErrors({ analysis: err.response?.data?.message || 'Analysis failed' });
      setShowScoreModal(false);
    } finally {
      setScoreLoading(false);
    }
  };

  // --- Run AI Analysis for the AI Insights tab ---
  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await profileAPI.getAnalysis();
      setAnalysis(res.data.analysis);
      if (res.data.analysis.placementScore) {
        updateUser({ placementScore: res.data.analysis.placementScore });
      }
    } catch (err) {
      setErrors({ analysis: err.response?.data?.message || 'Analysis failed' });
    } finally {
      setAnalyzing(false);
    }
  };

  // ============= Computed Data =============
  const totalSolved = profiles.reduce((sum, p) => sum + (p.stats?.totalSolved || 0), 0);
  const totalEasy = profiles.reduce((sum, p) => sum + (p.stats?.easySolved || 0), 0);
  const totalMedium = profiles.reduce((sum, p) => sum + (p.stats?.mediumSolved || 0), 0);
  const totalHard = profiles.reduce((sum, p) => sum + (p.stats?.hardSolved || 0), 0);

  // Difficulty data — changes per platform selection
  const isCodeforcesDifficulty = difficultyPlatform === 'codeforces';
  let difficultyData = [];
  let cfRatingData = [];

  if (isCodeforcesDifficulty) {
    // For Codeforces: bar graph by rating (800–2000)
    const cfProfile = profiles.find(p => p.platform === 'codeforces');
    const ratingWise = cfProfile?.stats?.ratingWise || [];
    const ratingBuckets = {};
    for (let r = 800; r <= 2000; r += 100) ratingBuckets[r] = 0;
    ratingWise.forEach(rw => {
      const bucket = Math.floor(rw.rating / 100) * 100;
      if (bucket >= 800 && bucket <= 2000) ratingBuckets[bucket] += rw.count;
    });
    cfRatingData = Object.entries(ratingBuckets).map(([rating, count]) => ({ rating: String(rating), count }));
  } else if (difficultyPlatform === 'all') {
    difficultyData = [
      { name: 'Easy', value: totalEasy, color: '#00b894' },
      { name: 'Medium', value: totalMedium, color: '#fdcb6e' },
      { name: 'Hard', value: totalHard, color: '#ff6b6b' }
    ].filter(d => d.value > 0);
  } else {
    const p = profiles.find(pr => pr.platform === difficultyPlatform);
    if (p?.stats) {
      difficultyData = [
        { name: 'Easy', value: p.stats.easySolved || 0, color: '#00b894' },
        { name: 'Medium', value: p.stats.mediumSolved || 0, color: '#fdcb6e' },
        { name: 'Hard', value: p.stats.hardSolved || 0, color: '#ff6b6b' }
      ].filter(d => d.value > 0);
    }
  }

  // Topics per platform
  const getTopicData = () => {
    const topicMap = {};
    const src = topicPlatform === 'all' ? profiles : profiles.filter(p => p.platform === topicPlatform);
    src.forEach(p => {
      (p.stats?.topicWise || []).forEach(t => {
        if (!topicMap[t.topic]) topicMap[t.topic] = 0;
        topicMap[t.topic] += t.solved;
      });
    });
    return Object.entries(topicMap)
      .map(([topic, solved]) => ({ topic, solved }))
      .sort((a, b) => b.solved - a.solved)
      .slice(0, 15);
  };
  const topTopics = getTopicData();

  const tooltipStyle = { background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)' };

  return (
    <div className="page" id="dashboard-page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Your coding profiles and AI-powered placement insights</p>
      </div>

      {/* ===== PROFILE MANAGEMENT SECTION ===== */}
      <div className="profile-section glass-card">
        <div className="profile-section-header">
          <h3>
            <HiOutlineShieldCheck /> Connected Profiles
          </h3>
          {availablePlatforms.length > 0 && (
            <button className="btn btn-sm btn-primary" onClick={() => { setShowAddProfile(true); setSelectedPlatform(availablePlatforms[0]); setNewUsername(''); }}>
              <HiOutlinePlus /> Add Profile
            </button>
          )}
        </div>

        {/* First-time setup notice */}
        {!hasProfiles && !showAddProfile && (
          <div className="first-time-notice">
            <HiOutlineExclamation style={{ fontSize: '2rem', color: 'var(--accent-primary)' }} />
            <h4>Connect at least one coding profile</h4>
            <p>Add your LeetCode, CodeChef, HackerRank, or Codeforces username to get started.</p>
            <button className="btn btn-primary" onClick={() => { setShowAddProfile(true); setSelectedPlatform(availablePlatforms[0] || 'leetcode'); setNewUsername(''); }}>
              <HiOutlinePlus /> Add Your First Profile
            </button>
          </div>
        )}

        {/* Connected profiles list */}
        {hasProfiles && (
          <div className="connected-profiles-list">
            {profiles.map(p => {
              const config = platformConfig[p.platform];
              const PlatformIcon = config?.icon;
              return (
                <div key={p._id} className="connected-profile-card">
                  <div className="cp-info">
                    {PlatformIcon && <PlatformIcon style={{ color: config.color, fontSize: '1.4rem' }} />}
                    <div>
                      <span className="cp-platform">{config?.name}</span>
                      <span className="cp-username">@{p.username}</span>
                    </div>
                  </div>
                  <div className="cp-stats-mini">
                    <span>{p.stats?.totalSolved || 0} solved</span>
                    {p.stats?.contestRating > 0 && <span>Rating: {p.stats.contestRating}</span>}
                  </div>
                  <div className="cp-actions">
                    <button className="btn btn-xs btn-ghost" onClick={() => syncProfile(p.platform, p.username)} disabled={syncingProfiles[p.platform]} title="Sync Profile">
                      {syncingProfiles[p.platform] ? <span className="loader" style={{ width: 14, height: 14, borderWidth: 2 }}></span> : <HiOutlineRefresh style={{ fontSize: '1.1rem' }} />}
                    </button>
                    <button className="btn btn-xs btn-secondary" onClick={() => requestPasswordFor('update', p.platform)} title="Update">
                      <HiOutlinePencil /> Update
                    </button>
                    <button className="btn btn-xs btn-danger" onClick={() => requestPasswordFor('remove', p.platform)} title="Remove">
                      <HiOutlineTrash />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add profile form (dropdown-based) */}
        {showAddProfile && (
          <div className="add-profile-form animate-fade-in-up">
            <div className="apf-row">
              <div className="input-group">
                <label>Platform</label>
                <div className="custom-select-wrapper">
                  <select
                    className="input-field"
                    value={selectedPlatform}
                    onChange={e => setSelectedPlatform(e.target.value)}
                  >
                    {availablePlatforms.map(key => (
                      <option key={key} value={key}>{platformConfig[key].name}</option>
                    ))}
                    {/* If updating, show the current platform too */}
                    {connectedPlatforms.includes(selectedPlatform) && (
                      <option value={selectedPlatform}>{platformConfig[selectedPlatform]?.name} (Update)</option>
                    )}
                  </select>
                  <HiOutlineChevronDown className="select-arrow" />
                </div>
              </div>
              <div className="input-group" style={{ flex: 2 }}>
                <label>Username</label>
                <input
                  className="input-field"
                  placeholder={`Enter your ${platformConfig[selectedPlatform]?.name || ''} username`}
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addProfile()}
                />
              </div>
            </div>
            {errors.add && <div className="auth-error" style={{ marginTop: 8 }}>{errors.add}</div>}
            <div className="apf-actions">
              <button className="btn btn-primary" onClick={addProfile} disabled={addLoading || !newUsername.trim()}>
                {addLoading ? <><span className="loader" style={{ width: 14, height: 14, borderWidth: 2 }}></span> Connecting...</> : <><HiOutlineRefresh /> Connect Profile</>}
              </button>
              <button className="btn btn-ghost" onClick={() => setShowAddProfile(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* ===== PASSWORD MODAL ===== */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content glass-card animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <HiOutlineShieldCheck /> {passwordAction?.type === 'remove' ? 'Confirm Removal' : 'Verify Identity'}
              </h3>
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}><HiOutlineX /></button>
            </div>
            <p className="modal-desc">
              {passwordAction?.type === 'remove'
                ? `Enter your password to remove your ${platformConfig[passwordAction?.platform]?.name} profile.`
                : `Enter your password to update your ${platformConfig[passwordAction?.platform]?.name} profile.`}
            </p>
            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Enter your account password"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePasswordSubmit()}
                autoFocus
              />
            </div>
            {passwordError && <div className="auth-error">{passwordError}</div>}
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handlePasswordSubmit} disabled={passwordLoading}>
                {passwordLoading ? 'Verifying...' : 'Confirm'}
              </button>
              <button className="btn btn-ghost" onClick={() => setShowPasswordModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CONFIRM REMOVAL MODAL ===== */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content glass-card animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--accent-danger)' }}>
                <HiOutlineExclamation /> Remove Profile?
              </h3>
              <button className="modal-close" onClick={() => setShowConfirmModal(false)}><HiOutlineX /></button>
            </div>
            <p className="modal-desc">
              Are you sure you want to remove your <strong>{platformConfig[confirmPlatform]?.name}</strong> profile?
              This action will delete all fetched stats for this platform.
            </p>
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={confirmRemoval}>Yes, Remove</button>
              <button className="btn btn-ghost" onClick={() => setShowConfirmModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== SCORE MODAL ===== */}
      {showScoreModal && (
        <div className="modal-overlay" onClick={() => !scoreLoading && setShowScoreModal(false)}>
          <div className="modal-content glass-card animate-scale-in score-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><HiOutlineLightningBolt /> Placement Readiness Score</h3>
              <button className="modal-close" onClick={() => setShowScoreModal(false)}><HiOutlineX /></button>
            </div>
            {scoreLoading ? (
              <div className="score-loading">
                <span className="loader" style={{ width: 40, height: 40 }}></span>
                <p>AI is analyzing your profiles...</p>
              </div>
            ) : scoreData ? (
              <div className="score-result">
                <div className="score-ring-big">
                  <svg viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="70" fill="none" stroke="var(--surface-3)" strokeWidth="10" />
                    <circle
                      cx="80" cy="80" r="70"
                      fill="none"
                      stroke={scoreData.placementScore >= 70 ? '#00b894' : scoreData.placementScore >= 40 ? '#fdcb6e' : '#ff6b6b'}
                      strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={`${(scoreData.placementScore || 0) * 4.4} 440`}
                      transform="rotate(-90 80 80)"
                      style={{ transition: 'stroke-dasharray 1.5s ease' }}
                    />
                  </svg>
                  <div className="score-ring-value" style={{ color: scoreData.placementScore >= 70 ? '#00b894' : scoreData.placementScore >= 40 ? '#fdcb6e' : '#ff6b6b' }}>
                    {scoreData.placementScore || 0}<span>/100</span>
                  </div>
                </div>
                <p className="score-verdict">
                  {scoreData.placementScore >= 80 ? '🟢 Excellent! You\'re well prepared.' :
                   scoreData.placementScore >= 60 ? '🟡 Good progress, but room to improve.' :
                   scoreData.placementScore >= 40 ? '🟠 Keep grinding, focus on weak areas.' :
                   '🔴 Critical — needs intensive preparation.'}
                </p>
                {scoreData.weaknesses?.length > 0 && (
                  <div className="score-weak-areas">
                    <h4>⚠️ Weak Areas to Focus</h4>
                    <ul>
                      {scoreData.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ===== MAIN STATS AREA ===== */}
      {hasProfiles && (
        <>
          <div className="tabs" style={{ marginTop: 24, marginBottom: 20 }}>
            <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
            <button className={`tab ${activeTab === 'topics' ? 'active' : ''}`} onClick={() => setActiveTab('topics')}>Topics</button>
            <button className={`tab ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveTab('ai')}>AI Insights</button>
            <button className={`tab ${activeTab === 'wager' ? 'active' : ''}`} onClick={() => setActiveTab('wager')} style={{ color: '#f1c40f' }}>The Wager <HiOutlineFire style={{marginBottom: '-2px'}} /></button>
            <button className={`tab ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>Leaderboard</button>
          </div>

          {/* ===== THE WAGER TAB ===== */}
          {activeTab === 'wager' && <WagerDashboard />}

          {/* ===== LEADERBOARD TAB ===== */}
          {activeTab === 'leaderboard' && <Leaderboard />}

          {/* ===== OVERVIEW TAB ===== */}
          {activeTab === 'overview' && (
            <div className="overview-layout stagger-children">
              <div className="overview-top-row">
                {/* Total Problems */}
                <div className="glass-card stat-card">
                  <h4><HiOutlineChartBar /> Total Solved</h4>
                  <div className="stat-big-number">{totalSolved}</div>
                  <div className="stat-breakdown">
                    <span className="stat-pill" style={{ background: 'rgba(0,184,148,0.15)', color: '#00b894' }}>Easy: {totalEasy}</span>
                    <span className="stat-pill" style={{ background: 'rgba(253,203,110,0.15)', color: '#fdcb6e' }}>Med: {totalMedium}</span>
                    <span className="stat-pill" style={{ background: 'rgba(255,107,107,0.15)', color: '#ff6b6b' }}>Hard: {totalHard}</span>
                  </div>
                </div>

                {/* Difficulty Chart with Platform Dropdown */}
                <div className="glass-card stat-card difficulty-card">
                  <div className="card-header-row">
                    <h4>Difficulty Split</h4>
                    <select className="mini-select" value={difficultyPlatform} onChange={e => setDifficultyPlatform(e.target.value)}>
                      <option value="all">All Platforms</option>
                      {profiles.map(p => (
                        <option key={p.platform} value={p.platform}>{platformConfig[p.platform]?.name}</option>
                      ))}
                    </select>
                  </div>

                  {isCodeforcesDifficulty ? (
                    /* Codeforces rating bar chart */
                    <div className="chart-container">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={cfRatingData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                          <XAxis dataKey="rating" stroke="var(--text-muted)" fontSize={11} tickFormatter={(val) => val === 2100 ? '2100+' : val} />
                          <YAxis stroke="var(--text-muted)" fontSize={11} />
                          <Tooltip contentStyle={tooltipStyle} labelFormatter={(val) => val === 2100 ? '2100+' : val} />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={20}>
                            {cfRatingData.map((entry, i) => {
                              const r = parseInt(entry.rating);
                              const color = r >= 2100 ? '#FF8C00' : r >= 1900 ? '#a855f7ff' : r >= 1600 ? '#395ee3ff' : r >= 1400 ? '#22d3ee' : r >= 1200 ? '#00b894' : '#a4a4a4ff';
                              return <Cell key={i} fill={color} />;
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      
                    </div>
                  ) : (
                    /* Pie chart for other platforms */
                    <>
                      <div className="chart-container">
                        <ResponsiveContainer width="100%" height={180}>
                          <PieChart>
                            <Pie data={difficultyData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                              {difficultyData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                            <Tooltip contentStyle={tooltipStyle} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="chart-legend">
                        {difficultyData.length > 0 ? difficultyData.map((d, i) => (
                          <span key={i} className="legend-item">
                            <span className="legend-dot" style={{ background: d.color }}></span>
                            {d.name}: {d.value}
                          </span>
                        )) : <span className="legend-item muted">No data</span>}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Platform Cards Grid */}
              <div className="platform-cards-grid">
                {profiles.map(p => {
                  const PlatformIcon = platformConfig[p.platform]?.icon;
                  const config = platformConfig[p.platform];
                  return (
                    <div key={p._id} className="glass-card stat-card platform-card">
                      <div className="platform-header">
                        {PlatformIcon && <PlatformIcon style={{ color: config.color, fontSize: '1.5rem' }} />}
                        <div>
                          <h4>{config?.name}</h4>
                          <span className="platform-username">@{p.username}</span>
                        </div>
                      </div>
                      <div className="platform-stats">
                        <div className="platform-stat">
                          <span className="platform-stat-value">{p.stats?.totalSolved || 0}</span>
                          <span className="platform-stat-label">Solved</span>
                        </div>
                        <div className="platform-stat">
                          <span className="platform-stat-value">{p.stats?.contestRating || 0}</span>
                          <span className="platform-stat-label">Rating</span>
                        </div>
                        <div className="platform-stat">
                          <span className="platform-stat-value">{p.stats?.ranking || '-'}</span>
                          <span className="platform-stat-label">Rank</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===== TOPICS TAB ===== */}
          {activeTab === 'topics' && (
            <div className="topics-section stagger-children">
              <div className="glass-card" style={{ padding: 24 }}>
                <div className="card-header-row">
                  <h4><HiOutlineAcademicCap /> Topic Coverage</h4>
                  <select className="mini-select" value={topicPlatform} onChange={e => setTopicPlatform(e.target.value)}>
                    <option value="all">All Platforms</option>
                    {profiles.map(p => (
                      <option key={p.platform} value={p.platform}>{platformConfig[p.platform]?.name}</option>
                    ))}
                  </select>
                </div>
                {topTopics.length > 0 ? (
                  <>
                    <div className="chart-container" style={{ height: 350 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topTopics} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                          <XAxis dataKey="topic" stroke="var(--text-muted)" fontSize={11} angle={-45} textAnchor="end" interval={0} height={60} />
                          <YAxis stroke="var(--text-muted)" fontSize={11} label={{ value: 'Questions', angle: -90, position: 'insideLeft', style: { fill: 'var(--text-muted)', fontSize: 12 } }} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Bar dataKey="solved" radius={[6, 6, 0, 0]} barSize={24}>
                            {topTopics.map((t, i) => (
                              <Cell key={i} fill={t.solved >= 20 ? '#00b894' : t.solved >= 5 ? '#fdcb6e' : '#ff6b6b'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="topic-pills">
                      {topTopics.map((t, i) => (
                        <span key={i} className={`badge ${t.solved >= 20 ? 'badge-success' : t.solved >= 5 ? 'badge-warning' : 'badge-danger'}`}>
                          {t.topic}: {t.solved}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="empty-state"><p>No topic data available for this platform.</p></div>
                )}
              </div>
            </div>
          )}

          {/* ===== AI INSIGHTS TAB ===== */}
          {activeTab === 'ai' && (
            <div className="ai-section stagger-children">
              {analysis ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Your AI Assessment</h3>
                    <button className="btn btn-sm btn-primary" onClick={runAnalysis} disabled={analyzing}>
                      {analyzing ? <><span className="loader" style={{ width: 14, height: 14, borderWidth: 2 }}></span> Analyzing...</> : <><HiOutlineRefresh /> Refresh Analysis</>}
                    </button>
                  </div>
                  <div className="glass-card ai-card">
                    <h4><HiOutlineLightningBolt /> Overall Assessment</h4>
                    <p className="ai-text">{typeof analysis.overallAssessment === 'string' ? analysis.overallAssessment : JSON.stringify(analysis.overallAssessment)}</p>
                    {analysis.industryComparison && (
                      <p className="ai-text muted">{typeof analysis.industryComparison === 'string' ? analysis.industryComparison : JSON.stringify(analysis.industryComparison)}</p>
                    )}
                  </div>

                  <div className="ai-grid">
                    <div className="glass-card ai-card">
                      <h4 style={{ color: '#00b894' }}>✅ Strengths</h4>
                      <ul className="ai-list">
                        {(analysis.strengths || []).map((s, i) => <li key={i}>{typeof s === 'string' ? s : JSON.stringify(s)}</li>)}
                      </ul>
                    </div>
                    <div className="glass-card ai-card">
                      <h4 style={{ color: '#ff6b6b' }}>⚠️ Weaknesses</h4>
                      <ul className="ai-list">
                        {(analysis.weaknesses || []).map((w, i) => <li key={i}>{typeof w === 'string' ? w : JSON.stringify(w)}</li>)}
                      </ul>
                    </div>
                  </div>

                  {analysis.thirtyDayPlan && Array.isArray(analysis.thirtyDayPlan) && (
                    <div className="glass-card ai-card">
                      <h4><HiOutlineTrendingUp /> 30-Day Study Plan</h4>
                      <div className="plan-grid">
                        {analysis.thirtyDayPlan.map((week, i) => (
                          <div key={i} className="plan-week">
                            <div className="plan-week-header">
                              <span className="plan-week-num">Week {week.week}</span>
                              <span className="plan-week-problems">{week.dailyProblems} probs/day</span>
                            </div>
                            <p className="plan-week-goal">{week.goal}</p>
                            <div className="plan-week-topics">
                              {(week.topics || []).map((t, j) => <span key={j} className="badge badge-primary">{t}</span>)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.recommendations && Array.isArray(analysis.recommendations) && (
                    <div className="glass-card ai-card">
                      <h4>📋 Recommendations</h4>
                      <div className="recommendations-list">
                        {analysis.recommendations.map((r, i) => (
                          <div key={i} className={`recommendation-item priority-${r.priority}`}>
                            <span className={`badge badge-${r.priority === 'high' ? 'danger' : r.priority === 'medium' ? 'warning' : 'success'}`}>{r.priority}</span>
                            <p>{r.action}</p>
                            {r.estimatedDays && <span className="rec-days">{r.estimatedDays} days</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.topicCoverage && Array.isArray(analysis.topicCoverage) && (
                    <div className="glass-card ai-card">
                      <h4>📊 AI Topic Assessment</h4>
                      <div className="topic-coverage-list">
                        {analysis.topicCoverage.map((t, i) => (
                          <div key={i} className="topic-row">
                            <div className="topic-row-info">
                              <span className="topic-row-name">{t.topic}</span>
                              <span className={`badge badge-${t.status === 'good' ? 'success' : t.status === 'ok' ? 'warning' : 'danger'}`}>
                                {t.percentage}%
                              </span>
                            </div>
                            <div className="topic-row-bar">
                              <div className="topic-row-fill" style={{
                                width: `${t.percentage}%`,
                                background: t.percentage >= 70 ? '#00b894' : t.percentage >= 40 ? '#fdcb6e' : '#ff6b6b'
                              }}></div>
                            </div>
                            {t.recommendation && <span className="topic-row-rec">{t.recommendation}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Show raw response if parsing failed */}
                  {analysis.raw && (
                    <div className="glass-card ai-card">
                      <h4>⚠️ Raw AI Response</h4>
                      <pre className="ai-raw">{analysis.raw}</pre>
                    </div>
                  )}
                </>
              ) : (
                <div className="glass-card ai-card" style={{ textAlign: 'center', padding: 48 }}>
                  <HiOutlineLightningBolt style={{ fontSize: '2.5rem', color: 'var(--accent-primary)', marginBottom: 16 }} />
                  <h3>AI-Powered Analysis</h3>
                  <p style={{ color: 'var(--text-secondary)', margin: '8px 0 24px' }}>
                    Get personalized insights, 30-day study plans, topic coverage analysis, and actionable recommendations.
                  </p>
                  <button className="btn btn-primary btn-lg" onClick={runAnalysis} disabled={analyzing}>
                    {analyzing ? <><span className="loader" style={{ width: 16, height: 16, borderWidth: 2 }}></span> Analyzing...</> : <><HiOutlineLightningBolt /> Run AI Analysis</>}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ===== FLOATING "GET SCORE" BUTTON ===== */}
      {hasProfiles && (
        <button className="fab-score-btn" onClick={getScore} disabled={scoreLoading} title="Get Placement Score">
          <HiOutlineLightningBolt />
          <span>Get Score</span>
        </button>
      )}
    </div>
  );
};

export default Dashboard;