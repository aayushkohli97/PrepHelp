import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { preptrackAPI } from '../services/api';
import {
  HiOutlineFire, HiOutlinePlus, HiOutlineCheck,
  HiOutlineClock, HiOutlineX, HiOutlineTrash,
  HiOutlineLightningBolt, HiOutlineCurrencyDollar,
  HiOutlineChartBar, HiOutlineTrendingUp,
  HiOutlinePencil
} from 'react-icons/hi';
import { FiArrowUpRight } from 'react-icons/fi';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import toast from 'react-hot-toast';
import { useDataCache } from '../context/DataContext';
import './PrepTrack.css';

// ========================= CONSTANTS =========================
const BOARD_CONFIG = {
  daily:   { label: 'Daily Board',   emoji: '⚡', betMin: 100, betMax: 100,  durationLabel: '24 Hours', maxPast: 2 },
  weekly:  { label: 'Weekly Board',  emoji: '🎯', betMin: 250, betMax: 500,  durationLabel: '7 Days', maxPast: 3 },
  monthly: { label: 'Monthly Board', emoji: '🏆', betMin: 750, betMax: 1000, durationLabel: '30 Days', maxPast: 1 }
};

// ========================= COUNTDOWN HOOK =========================
const useCountdown = (endTime) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!endTime) { setTimeLeft(''); setIsExpired(false); return; }

    const tick = () => {
      const end = new Date(endTime).getTime();
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('00:00:00');
        setIsExpired(true);
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      if (d > 0) {
        setTimeLeft(`${d}d ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
      } else {
        setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
      }
      setIsExpired(false);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return { timeLeft, isExpired };
};

// ========================= COOLDOWN HOOK =========================
const useCooldownTimer = (submittedAt) => {
  const [cooldownTimeLeft, setCooldownTimeLeft] = useState('');
  const [isCooldownActive, setIsCooldownActive] = useState(false);

  useEffect(() => {
    if (!submittedAt) { setIsCooldownActive(false); return; }

    const tick = () => {
      const lastSubmission = new Date(submittedAt).getTime();
      const now = Date.now();
      const timePassed = now - lastSubmission;
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (timePassed < twentyFourHours) {
        setIsCooldownActive(true);
        const msLeft = twentyFourHours - timePassed;
        const h = Math.floor(msLeft / (1000 * 60 * 60));
        const m = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
        setCooldownTimeLeft(`${h}h ${m}m`);
      } else {
        setIsCooldownActive(false);
        setCooldownTimeLeft('');
      }
    };

    tick();
    const interval = setInterval(tick, 60000); // update every minute
    return () => clearInterval(interval);
  }, [submittedAt]);

  return { cooldownTimeLeft, isCooldownActive };
};

// ========================= CUSTOM TOOLTIP =========================
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length || payload[0].value == null) return null;
  return (
    <div className="preptrack-tooltip">
      <div className="label">{label}</div>
      <div className="value">{payload[0].value}%</div>
    </div>
  );
};

// ========================= BOARD CARD =========================
const BoardCard = ({ type, track, onToggleTask, onLockStart, onEvaluate, onCreateNew, onEditDraft, lastSubmittedAt }) => {
  const config = BOARD_CONFIG[type];
  const { timeLeft, isExpired } = useCountdown(track?.endTime);
  const { cooldownTimeLeft, isCooldownActive } = useCooldownTimer(type === 'daily' && track?.status === 'draft' ? lastSubmittedAt : null);

  // No track for this type
  if (!track) {
    return (
      <div className="board-card glass-card empty-card">
        <div className="board-header">
          <div className="board-header-left">
            <div className={`board-type-icon ${type}`}>{config.emoji}</div>
            <div>
              <div className="board-title">{config.label}</div>
              <div className="board-subtitle">{config.durationLabel} · {config.betMin === config.betMax ? `${config.betMin}` : `${config.betMin}-${config.betMax}`} coins</div>
            </div>
          </div>
        </div>
        <div className="board-body">
          <div className="board-empty-state">
            <HiOutlinePlus />
            <p>No active {type} challenge. Start one to bet on your goals!</p>
            <button className="btn btn-primary btn-sm" onClick={() => onCreateNew(type)}>
              <HiOutlinePlus /> Create {config.label}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isActive = track.status === 'active';
  const isDraft = track.status === 'draft';
  const isFinished = track.status === 'evaluated' || track.status === 'failed';
  const completedCount = track.tasks.filter(t => t.isCompleted).length;
  const totalCount = track.tasks.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className={`board-card glass-card ${isActive ? 'board-active' : ''} ${isFinished ? 'board-evaluated' : ''}`}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>
        {(isDraft ? new Date() : new Date(track.startTime || track.createdAt || new Date())).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
      <div className="board-header">
        <div className="board-header-left">
          <div className={`board-type-icon ${type}`}>{config.emoji}</div>
          <div>
            <div className="board-title">{isFinished ? `Past ${config.label}` : config.label}</div>
            <div className="board-subtitle">{completedCount}/{totalCount} tasks · {track.betAmount} coins bet</div>
          </div>
        </div>
        <span className={`board-status status-${track.status}`}>{track.status}</span>
      </div>

      <div className="board-body">
        {/* Timer */}
        {isActive && (
          <div className="timer-section">
            <HiOutlineClock style={{ fontSize: '1.2rem', color: isExpired ? '#ff6b6b' : 'var(--accent-success)' }} />
            <div>
              <div className={`timer-display ${isExpired ? 'timer-expired' : ''}`}>{timeLeft}</div>
              <div className="timer-label">{isExpired ? 'Time Expired!' : 'Time Remaining'}</div>
            </div>
          </div>
        )}

        {/* Bet display for draft */}
        {isDraft && (
          <div className="bet-display">
            <HiOutlineCurrencyDollar /> {track.betAmount} PrepCoins locked
          </div>
        )}

        {/* Task list */}
        <div className="task-list">
          {track.tasks.map((task) => {
            // Determine styles based on status
            let itemClass = 'task-item';
            let icon = null;
            let showCheckbox = true;

            if (isFinished) {
              if (task.isCompleted) {
                itemClass += ' past-completed';
                icon = <HiOutlineCheck />;
              } else if (task.rolledOverToNext) {
                itemClass += ' past-rolled';
                icon = <FiArrowUpRight />;
                showCheckbox = false;
              } else {
                itemClass += ' past-failed';
                icon = <HiOutlineX />;
              }
            } else {
              if (task.isRolledOver) {
                itemClass += ' rolled-over';
              }
              if (task.isCompleted) {
                itemClass += ' completed';
                icon = <HiOutlineCheck />;
              }
            }

            return (
              <div
                key={task._id}
                className={itemClass}
                onClick={() => isActive && onToggleTask(track._id, task._id)}
                style={{ cursor: isActive ? 'pointer' : 'default' }}
              >
                {showCheckbox ? (
                  <div className={`task-checkbox ${task.isCompleted ? 'checked' : ''} ${isFinished && !task.isCompleted ? 'failed-box' : ''}`}>
                    {icon}
                  </div>
                ) : (
                  <div className="task-icon-only">
                    {icon}
                  </div>
                )}
                <span className="task-text">{task.description}</span>
                {!isFinished && task.isRolledOver && <span className="task-rolled-badge">ROLLOVER</span>}
              </div>
            );
          })}
        </div>

        {/* Progress bar for active */}
        {isActive && (
          <div style={{ marginTop: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6 }}>
              <span>Progress</span>
              <span>{progressPct}%</span>
            </div>
            <div style={{ height: 6, background: 'var(--surface-3)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                width: `${progressPct}%`,
                height: '100%',
                background: progressPct >= 100 ? '#00b894' : progressPct >= 50 ? '#fdcb6e' : 'var(--accent-primary)',
                transition: 'width 0.5s ease',
                borderRadius: 3
              }} />
            </div>
          </div>
        )}

        {/* AI Feedback for finished tracks */}
        {isFinished && track.aiFeedback && (
          <div className="ai-feedback-section">
            <div className="score-row" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>Score</div>
                <div className={`score-value ${track.completionScore >= 70 ? 'score-high' : track.completionScore >= 40 ? 'score-mid' : 'score-low'}`}>
                  {track.completionScore}%
                </div>
              </div>
              <div className="earned-coins">
                <HiOutlineCurrencyDollar /> +{track.earnedCoins}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="board-footer">
        {isDraft && (
          <>
            <button className="btn btn-secondary" onClick={() => onEditDraft(track)}>
              <HiOutlinePencil /> Edit
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <button 
                className="btn btn-success" 
                onClick={() => onLockStart(track._id)}
                disabled={isCooldownActive}
                style={{ opacity: isCooldownActive ? 0.6 : 1, cursor: isCooldownActive ? 'not-allowed' : 'pointer' }}
              >
                <HiOutlineFire /> Lock & Start
              </button>
              {isCooldownActive && (
                <div style={{ fontSize: '0.75rem', color: '#ff6b6b', marginTop: '4px', fontWeight: '500' }}>
                  Available in {cooldownTimeLeft}
                </div>
              )}
            </div>
          </>
        )}
        {isActive && (
          <button className="btn btn-primary" onClick={() => onEvaluate(track)}>
            <HiOutlineLightningBolt /> {isExpired ? 'Evaluate Now' : 'Submit Early'}
          </button>
        )}
      </div>
    </div>
  );
};

// ========================= MAIN PAGE =========================
const PrepTrackPage = () => {
  const { user, updateUser } = useAuth();
  const [tracks, setTracks] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const { prepTrackCache, setPrepTrackCache } = useDataCache();
  
  const [activeTab, setActiveTab] = useState('daily');
  const scrollContainerRef = useRef(null);

  // Create / Edit modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState('daily');
  const [createBet, setCreateBet] = useState(100);
  const [createTasks, setCreateTasks] = useState([]);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editTrackId, setEditTrackId] = useState(null);

  // Rollover Modal
  const [showRolloverModal, setShowRolloverModal] = useState(false);
  const [trackToEvaluate, setTrackToEvaluate] = useState(null);
  const [selectedRolloverIds, setSelectedRolloverIds] = useState([]);
  const [evaluating, setEvaluating] = useState(false);

  const taskInputRef = useRef(null);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Scroll to right most on tab switch
  useEffect(() => {
    if (scrollContainerRef.current) {
      setTimeout(() => {
        scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
      }, 50);
    }
  }, [activeTab, tracks, history]);

  const loadData = async (force = false) => {
    if (!force && prepTrackCache) {
      setTracks(prepTrackCache.tracks);
      setHistory(prepTrackCache.history);
      setChartData(prepTrackCache.chartData);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [activeRes, historyRes] = await Promise.all([
        preptrackAPI.getActive(),
        preptrackAPI.getHistory()
      ]);
      setTracks(activeRes.data);
      setHistory(historyRes.data);
      processChartData(historyRes.data);
    } catch (err) {
      console.error('Failed to load PrepTrack data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && (tracks.length > 0 || history.length > 0)) {
      setPrepTrackCache({ tracks, history, chartData });
    }
  }, [tracks, history, chartData, loading, setPrepTrackCache]);

  const processChartData = (historyData) => {
    if (!historyData || historyData.length === 0) {
      setChartData([]);
      return;
    }

    const sortedData = [...historyData].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    const firstDate = new Date(sortedData[0].createdAt);
    firstDate.setHours(0, 0, 0, 0);
    const lastDate = new Date(sortedData[sortedData.length - 1].createdAt);
    lastDate.setHours(0, 0, 0, 0);

    const dateMap = new Map();
    sortedData.forEach(t => {
      const d = new Date(t.createdAt);
      d.setHours(0, 0, 0, 0);
      dateMap.set(d.getTime(), t.completionScore || 0);
    });

    const data = [];
    const currentDate = new Date(firstDate);
    while (currentDate <= lastDate) {
      const time = currentDate.getTime();
      const dayLabel = currentDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      
      data.push({
        day: dayLabel,
        score: dateMap.has(time) ? dateMap.get(time) : null
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    setChartData(data);
  };

  // ---- Handlers ----
  const handleToggleTask = async (trackId, taskId) => {
    try {
      const res = await preptrackAPI.toggleTask(trackId, taskId);
      setTracks(prev => prev.map(t => t._id === trackId ? res.data.track : t));
    } catch (err) {
      toast.error('Failed to toggle task.');
    }
  };

  const handleLockStart = async (trackId) => {
    const trackToLock = tracks.find(t => t._id === trackId);
    if (trackToLock && trackToLock.tasks.length === 0) {
      return toast.error('Cannot lock a challenge with 0 tasks! Edit to add tasks.');
    }
    try {
      const res = await preptrackAPI.lock(trackId);
      updateUser({ prepCoins: res.data.prepCoins });
      setTracks(prev => prev.map(t => t._id === trackId ? res.data.track : t));
      toast.success('PrepTrack locked and started! Timer is running. 🔥');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start.');
    }
  };

  const initEvaluate = (track) => {
    const completedCount = track.tasks.filter(t => t.isCompleted).length;
    if (completedCount < track.tasks.length) {
      setTrackToEvaluate(track);
      setSelectedRolloverIds([]);
      setShowRolloverModal(true);
    } else {
      executeEvaluate(track._id, []);
    }
  };

  const toggleRolloverSelection = (taskId) => {
    setSelectedRolloverIds(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const executeEvaluate = async (trackId, rolloverTaskIds) => {
    setEvaluating(true);
    try {
      const res = await preptrackAPI.evaluate(trackId, { rolloverTaskIds });
      const { track: evaluatedTrack, earnedCoins, prepCoins, rolloverTrack } = res.data;
      const score = evaluatedTrack.completionScore;
      const betAmount = evaluatedTrack.betAmount;

      setTracks(prev => prev.filter(t => t._id !== trackId));
      setHistory(prev => [...prev, evaluatedTrack]);
      processChartData([...history, evaluatedTrack]);

      if (rolloverTrack) {
        setTracks(prev => [...prev, rolloverTrack]);
        toast('⚠️ Tasks rolled over to a new daily draft!', { icon: '🔄' });
      }

      updateUser({ prepCoins });

      if (score >= 100) {
        toast.success(`🏆 PERFECT! You earned ${earnedCoins} coins (2x your bet)!`);
      } else if (score >= 50) {
        const bonus = earnedCoins - betAmount;
        toast.success(`✅ Score: ${score}% — Bet refunded + ${bonus} bonus coins! Total: ${earnedCoins} 💰`);
      } else {
        toast.error(`💀 Score: ${score}% — Below 50%. You lost your ${betAmount} coins. Grind harder.`);
      }
      setShowRolloverModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Evaluation failed.');
    } finally {
      setEvaluating(false);
    }
  };

  const openCreateModal = (type = 'daily') => {
    setEditMode(false);
    setEditTrackId(null);
    setCreateType(type);
    const config = BOARD_CONFIG[type];
    setCreateBet(config.betMin);
    setCreateTasks([]);
    setNewTaskInput('');
    setShowCreateModal(true);
    setTimeout(() => taskInputRef.current?.focus(), 100);
  };

  const openEditModal = (track) => {
    setEditMode(true);
    setEditTrackId(track._id);
    setCreateType(track.type);
    setCreateBet(track.betAmount);
    setCreateTasks(track.tasks.map(t => ({
      description: t.description,
      isRolledOver: t.isRolledOver || false
    })));
    setNewTaskInput('');
    setShowCreateModal(true);
    setTimeout(() => taskInputRef.current?.focus(), 100);
  };

  const handleCreateTypeChange = (type) => {
    setCreateType(type);
    const config = BOARD_CONFIG[type];
    setCreateBet(config.betMin);
  };

  const addTask = () => {
    if (!newTaskInput.trim()) return;
    setCreateTasks(prev => [...prev, { description: newTaskInput.trim(), isRolledOver: false }]);
    setNewTaskInput('');
    taskInputRef.current?.focus();
  };

  const removeTask = (idx) => {
    setCreateTasks(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCreate = async () => {
    let finalTasks = [...createTasks];
    if (newTaskInput.trim()) {
      finalTasks.push({ description: newTaskInput.trim(), isRolledOver: false });
      setNewTaskInput('');
    }

    if (!editMode && finalTasks.length === 0) return toast.error('Add at least one task!');

    const config = BOARD_CONFIG[createType];
    if (createBet < config.betMin || createBet > config.betMax) {
      return toast.error(`Bet must be between ${config.betMin}-${config.betMax} for ${createType}.`);
    }

    setCreateLoading(true);
    try {
      if (editMode && editTrackId) {
        const res = await preptrackAPI.editDraft(editTrackId, {
          tasks: finalTasks,
          betAmount: createBet
        });
        setTracks(prev => prev.map(t => t._id === editTrackId ? res.data.track : t));
        setShowCreateModal(false);
        toast.success('Draft updated successfully! ✏️');
      } else {
        const res = await preptrackAPI.create({
          type: createType,
          tasks: finalTasks,
          betAmount: createBet
        });
        setTracks(prev => [...prev, res.data.track]);
        setShowCreateModal(false);
        toast.success(`${config.label} created! Lock it to start the timer. 🎯`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || (editMode ? 'Failed to update.' : 'Failed to create.'));
    } finally {
      setCreateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page" id="preptrack-page">
        <div className="loader-center"><div className="loader"></div></div>
      </div>
    );
  }

  // Determine current active/draft for activeTab
  const currentTrack = tracks.find(t => t.type === activeTab && (t.status === 'active' || t.status === 'draft'));
  
  // Determine past tracks for activeTab
  const allPastTracks = history.filter(t => t.type === activeTab); // history is naturally oldest to newest
  const config = BOARD_CONFIG[activeTab];
  const pastTracks = allPastTracks.slice(-config.maxPast);
  const latestPastBoard = allPastTracks[allPastTracks.length - 1];
  const lastSubmittedAt = latestPastBoard?.submittedAt;

  const hasCompletedToday = activeTab === 'daily' && allPastTracks.some(t => {
    const d = new Date(t.startTime || t.createdAt);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  });

  return (
    <div className="page" id="preptrack-page">
      {/* Header */}
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <HiOutlineFire style={{ color: '#ff6b6b' }} /> PrepTrack
        </h1>
        <p>Bet your PrepCoins on your goals. Complete tasks. Get AI-evaluated. Earn rewards.</p>
      </div>

      {/* Balance Bar */}
      <div className="preptrack-balance-bar">
        <div className="balance-info">
          <div className="balance-icon">
            <HiOutlineCurrencyDollar />
          </div>
          <div>
            <div className="balance-label">Your Balance</div>
            <div className="balance-value">{user?.prepCoins ?? 0} PrepCoins</div>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => openCreateModal(activeTab)}>
          <HiOutlinePlus /> New {BOARD_CONFIG[activeTab].label}
        </button>
      </div>

      {/* Progress Graph */}
      {chartData.length > 0 && (
        <div className="preptrack-graph-section" style={{ marginBottom: '24px' }}>
          <div className="glass-card">
            <h3><HiOutlineTrendingUp style={{ color: 'var(--accent-success)' }} /> Progress Over Time</h3>
            <p className="graph-subtitle">Your completion scores across all PrepTrack challenges</p>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00b894" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00b894" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="5 5" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} domain={[0, 100]} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="score" stroke="#00b894" strokeWidth={3} dot={{ r: 5, fill: '#00b894', stroke: '#0a0a0f', strokeWidth: 2 }} activeDot={{ r: 7, fill: '#55efc4' }} fill="url(#scoreGradient)" connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="preptrack-tabs">
        <button 
          className={`preptrack-tab ${activeTab === 'daily' ? 'active' : ''}`}
          onClick={() => setActiveTab('daily')}
        >
          Daily
        </button>
        <button 
          className={`preptrack-tab ${activeTab === 'weekly' ? 'active' : ''}`}
          onClick={() => setActiveTab('weekly')}
        >
          Weekly
        </button>
        <button 
          className={`preptrack-tab ${activeTab === 'monthly' ? 'active' : ''}`}
          onClick={() => setActiveTab('monthly')}
        >
          Monthly
        </button>
      </div>

      {/* HORIZONTAL SCROLL BOARD GRID */}
      <div className="preptrack-horizontal-scroll" ref={scrollContainerRef}>
        {pastTracks.map(t => (
          <BoardCard
            key={t._id}
            type={activeTab}
            track={t}
            onToggleTask={handleToggleTask}
            onLockStart={handleLockStart}
            onEvaluate={initEvaluate}
            onCreateNew={openCreateModal}
            onEditDraft={openEditModal}
            lastSubmittedAt={lastSubmittedAt}
          />
        ))}
        
        {!currentTrack && hasCompletedToday ? (
          <div className="board-card glass-card empty-card" style={{ justifyContent: 'center' }}>
             <div className="board-empty-state">
               <HiOutlineCheck style={{ fontSize: '3rem', color: 'var(--accent-success)', marginBottom: '1rem' }} />
               <p style={{ textAlign: 'center', fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>You have completed your daily track for today.</p>
               <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Come back tomorrow!</p>
             </div>
          </div>
        ) : (
          <BoardCard
            type={activeTab}
            track={currentTrack}
            onToggleTask={handleToggleTask}
            onLockStart={handleLockStart}
            onEvaluate={initEvaluate}
            onCreateNew={openCreateModal}
            onEditDraft={openEditModal}
            lastSubmittedAt={lastSubmittedAt}
          />
        )}
      </div>



      {/* ====== CREATE MODAL ====== */}
      {showCreateModal && (
        <div className="create-board-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="create-board-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <h3>{editMode ? <><HiOutlinePencil style={{ color: '#fdcb6e' }} /> Edit Draft</> : <><HiOutlineFire style={{ color: '#ff6b6b' }} /> New Challenge</>}</h3>
              <button className="btn btn-ghost" style={{ padding: 4 }} onClick={() => setShowCreateModal(false)}><HiOutlineX /></button>
            </div>
            <p className="modal-desc">{editMode ? 'Update your tasks and bet before locking.' : 'Set your tasks, lock your bet, and start the countdown.'}</p>

            {/* Type Selector */}
            {!editMode && (
              <div className="type-selector">
                {Object.entries(BOARD_CONFIG).map(([key, cfg]) => (
                  <button key={key} className={`type-btn ${createType === key ? 'selected' : ''}`} onClick={() => handleCreateTypeChange(key)}>
                    <div className="type-name">{cfg.emoji} {key.charAt(0).toUpperCase() + key.slice(1)}</div>
                    <div className="type-range">{cfg.betMin === cfg.betMax ? `${cfg.betMin} coins` : `${cfg.betMin}-${cfg.betMax} coins`}</div>
                  </button>
                ))}
              </div>
            )}
            
            {editMode && (
              <div className="bet-display" style={{ marginBottom: 16, justifyContent: 'center' }}>
                {BOARD_CONFIG[createType].emoji} Editing {createType.charAt(0).toUpperCase() + createType.slice(1)} Board
              </div>
            )}

            {/* Bet Input */}
            <div className="input-group" style={{ marginBottom: 16 }}>
              <label>Bet Amount (PrepCoins)</label>
              {BOARD_CONFIG[createType].betMin === BOARD_CONFIG[createType].betMax ? (
                <div className="bet-display" style={{ justifyContent: 'center' }}>
                  <HiOutlineCurrencyDollar /> {BOARD_CONFIG[createType].betMin} coins (fixed)
                </div>
              ) : (
                <input type="number" className="input-field" min={BOARD_CONFIG[createType].betMin} max={BOARD_CONFIG[createType].betMax} value={createBet} onChange={e => setCreateBet(Number(e.target.value))} />
              )}
            </div>

            {/* Tasks */}
            <div className="input-group" style={{ marginBottom: 8 }}>
              <label>Tasks ({createTasks.length} added)</label>
            </div>

            {createTasks.length > 0 && (
              <div className="draft-task-list">
                {createTasks.map((t, i) => (
                  <div key={i} className={`draft-task-item ${t.isRolledOver ? 'rolled' : ''}`}>
                    <span>{i + 1}. {t.description}</span>
                    {t.isRolledOver && <span className="task-rolled-badge">ROLLOVER</span>}
                    <button onClick={() => removeTask(i)}><HiOutlineTrash /></button>
                  </div>
                ))}
              </div>
            )}

            <div className="task-input-area">
              <input ref={taskInputRef} className="input-field" placeholder="e.g., Solve 3 LeetCode mediums on DP" value={newTaskInput} onChange={e => setNewTaskInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} />
              <button className="btn btn-secondary" onClick={addTask}><HiOutlinePlus /></button>
            </div>

            <div className="modal-actions-row">
              <button className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="btn btn-success" onClick={handleCreate} disabled={createLoading || (!editMode && createTasks.length === 0 && !newTaskInput.trim())}>
                {createLoading ? <><span className="loader" style={{ width: 14, height: 14, borderWidth: 2 }}></span> {editMode ? 'Saving...' : 'Creating...'}</> : <><HiOutlineCheck /> {editMode ? 'Save Changes' : 'Create Challenge'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== ROLLOVER MODAL ====== */}
      {showRolloverModal && trackToEvaluate && (
        <div className="create-board-overlay" onClick={() => !evaluating && setShowRolloverModal(false)}>
          <div className="create-board-modal rollover-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <h3><HiOutlineClock style={{ color: '#fdcb6e' }} /> Rollover Tasks?</h3>
              <button className="btn btn-ghost" style={{ padding: 4 }} onClick={() => !evaluating && setShowRolloverModal(false)} disabled={evaluating}><HiOutlineX /></button>
            </div>
            <p className="modal-desc">You have incomplete tasks. Select the ones you want to roll over to your next daily challenge.</p>

            <div className="draft-task-list">
              {trackToEvaluate.tasks.filter(t => !t.isCompleted).map(t => (
                <div 
                  key={t._id} 
                  className={`draft-task-item ${selectedRolloverIds.includes(t._id) ? 'selected-rollover' : ''}`}
                  onClick={() => toggleRolloverSelection(t._id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={`task-checkbox ${selectedRolloverIds.includes(t._id) ? 'checked' : ''}`}>
                    {selectedRolloverIds.includes(t._id) && <HiOutlineCheck />}
                  </div>
                  <span style={{ marginLeft: '10px' }}>{t.description}</span>
                </div>
              ))}
            </div>

            <div className="modal-actions-row">
              <button className="btn btn-ghost" onClick={() => !evaluating && setShowRolloverModal(false)} disabled={evaluating}>Cancel</button>
              <button className="btn btn-primary" onClick={() => executeEvaluate(trackToEvaluate._id, selectedRolloverIds)} disabled={evaluating}>
                {evaluating ? <><span className="loader" style={{ width: 14, height: 14, borderWidth: 2 }}></span> Evaluating...</> : <><HiOutlineLightningBolt /> Submit Evaluation</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrepTrackPage;
