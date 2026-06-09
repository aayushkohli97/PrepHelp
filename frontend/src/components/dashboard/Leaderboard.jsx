import { useState, useEffect } from 'react';
import { leaderboardAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineUserAdd, HiOutlineSearch, HiOutlineGlobe, HiOutlineUsers } from 'react-icons/hi';
import { HiOutlineTrophy } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { useDataCache } from '../../context/DataContext';
import './Leaderboard.css';

const PLATFORMS = [
  { value: 'leetcode',   label: 'LeetCode',  color: '#FFA116' },
  { value: 'codeforces', label: 'Codeforces', color: '#1890FF' },
  { value: 'codechef',   label: 'CodeChef',   color: '#9b7b69' },
  { value: 'hackerrank', label: 'HackerRank', color: '#00EA64' },
];

// ── Crown SVG ──
const Crown = ({ color }) => (
  <svg width="28" height="22" viewBox="0 0 28 22" fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 2px 4px ${color}88)` }}>
    <path d="M2 18L6 8L11 14L14 4L17 14L22 8L26 18H2Z"
      fill={color} stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <rect x="2" y="18" width="24" height="3" rx="1.5" fill={color}/>
    <circle cx="2"  cy="8" r="2" fill={color}/>
    <circle cx="14" cy="4" r="2" fill={color}/>
    <circle cx="26" cy="8" r="2" fill={color}/>
  </svg>
);

// ── Skeleton ──
const SkeletonRows = () => (
  <div className="lb-bar-container">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="lb-skeleton-row" style={{ animationDelay: `${i * 0.1}s` }}>
        <div className="lb-skeleton-block" style={{ width: 32, height: 14, borderRadius: 4, flexShrink: 0 }} />
        <div className="lb-skeleton-circle" />
        <div className="lb-skeleton-block" style={{ width: 100 }} />
        <div className="lb-skeleton-block" style={{ flex: 1 }} />
        <div className="lb-skeleton-block" style={{ width: 50, flexShrink: 0 }} />
      </div>
    ))}
  </div>
);

// ── PEDESTAL BAR UI (Top 3) ──
const PodiumCard = ({ lbUser, podiumRank, platform, currentUserId }) => {
  const isMe = String(lbUser._id) === String(currentUserId);
  const platformColor = PLATFORMS.find(p => p.value === platform)?.color || '#FFA116';

  const crownColors = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };
  const crownColor  = crownColors[podiumRank];

  return (
    <div className={`lb-podium-step rank-${podiumRank} ${isMe ? 'is-me' : ''}`}>
      
      {/* 1. The Avatar sitting ON TOP of the bar */}
      <div className="lb-podium-top">
        <div className="lb-crown-wrap">
          <Crown color={crownColor} />
        </div>
        <div className="lb-podium-avatar" style={{ borderColor: crownColor }}>
          {lbUser.avatar
            ? <img src={lbUser.avatar} alt={lbUser.name} />
            : <span>{lbUser.name?.charAt(0).toUpperCase()}</span>
          }
        </div>
      </div>

      {/* 2. The Physical Vertical Bar (Pedestal) */}
      <div className="lb-podium-pedestal">
        <div className="lb-podium-name">
          {lbUser.name}
          {isMe && <span className="lb-you-badge">You</span>}
        </div>
        <div className="lb-podium-rating" style={{ color: platformColor }}>
          {lbUser.rating > 0 ? lbUser.rating : '—'}
        </div>
      </div>

    </div>
  );
};

// ── Bar Row (rank 4+) ──
const BarRow = ({ lbUser, index, maxRating, platform, currentUserId }) => {
  const isMe  = String(lbUser._id) === String(currentUserId);
  const rank  = index + 1;
  const barPct = maxRating > 0 && lbUser.rating > 0
    ? Math.max((lbUser.rating / maxRating) * 100, 4)
    : 0;

  return (
    <div className={`lb-bar-row ${isMe ? 'is-me' : ''}`}>
      <div className="lb-bar-rank">#{rank}</div>

      <div className="lb-bar-user">
        <div className="lb-bar-avatar">
          {lbUser.avatar
            ? <img src={lbUser.avatar} alt={lbUser.name} />
            : lbUser.name?.charAt(0).toUpperCase()
          }
        </div>
        <div className="lb-bar-name-wrap">
          <span className="lb-bar-name">
            {lbUser.name}
            {isMe && <span className="lb-you-badge">You</span>}
          </span>
          {lbUser.handle && (
            <span className="lb-bar-handle">@{lbUser.handle}</span>
          )}
        </div>
      </div>

      <div className="lb-bar-track">
        <div
          className={`lb-bar-fill platform-${platform}`}
          style={{ width: `${barPct}%` }}
        />
      </div>

      <div className={`lb-bar-rating platform-${platform}`}>
        {lbUser.rating > 0
          ? lbUser.rating
          : <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>—</span>
        }
      </div>
    </div>
  );
};

// ── Main Component ──
const Leaderboard = () => {
  const { user } = useAuth();
  const [view,            setView]            = useState('global');
  const [platform,        setPlatform]        = useState('leetcode');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [maxRating,       setMaxRating]       = useState(1);
  const [loading,         setLoading]         = useState(false);
  const [searchHandle,    setSearchHandle]    = useState('');
  const [searchLoading,   setSearchLoading]   = useState(false);
  const { leaderboardCache, setLeaderboardCache } = useDataCache();

  useEffect(() => { fetchLeaderboard(); }, [view, platform]);

  const fetchLeaderboard = async (force = false) => {
    const cacheKey = `${view}-${platform}`;
    if (!force && leaderboardCache[cacheKey]) {
      setLeaderboardData(leaderboardCache[cacheKey].users);
      setMaxRating(leaderboardCache[cacheKey].maxRating);
      return;
    }

    setLoading(true);
    try {
      const res = view === 'global'
        ? await leaderboardAPI.getGlobal(platform)
        : await leaderboardAPI.getRivals(platform);
      setLeaderboardData(res.data.users    || []);
      setMaxRating(      res.data.maxRating > 0 ? res.data.maxRating : 1);
    } catch {
      toast.error('Failed to load leaderboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && leaderboardData.length > 0) {
      const cacheKey = `${view}-${platform}`;
      setLeaderboardCache(prev => ({
        ...prev,
        [cacheKey]: { users: leaderboardData, maxRating }
      }));
    }
  }, [leaderboardData, maxRating, loading, view, platform, setLeaderboardCache]);

  const handleAddRival = async (e) => {
    e.preventDefault();
    if (!searchHandle.trim()) return;
    setSearchLoading(true);
    try {
      await leaderboardAPI.addRival(searchHandle.trim());
      toast.success(`Successfully added ${searchHandle} to rivals!`);
      setSearchHandle('');
      
      // Invalidate rivals cache
      setLeaderboardCache(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => {
          if (k.startsWith('rivals-')) delete next[k];
        });
        return next;
      });

      if (view === 'rivals') fetchLeaderboard(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add rival.');
    } finally {
      setSearchLoading(false);
    }
  };

  const top3 = leaderboardData.slice(0, 3);
  const rest  = leaderboardData.slice(3);
  const platformColor = PLATFORMS.find(p => p.value === platform)?.color || '#FFA116';

  // Helper to render bar section
  const renderBars = (list, startIndex) => (
    <>
      <div className="lb-col-labels">
        <span style={{ minWidth: 42 }}>Rank</span>
        <span style={{ minWidth: 160 }}>User</span>
        <span style={{ flex: 1 }}>Rating Bar</span>
        <span style={{ minWidth: 60, textAlign: 'right' }}>Rating</span>
      </div>
      <div className="lb-bar-container">
        {list.map((u, i) => (
          <BarRow
            key={u._id}
            lbUser={u}
            index={i + startIndex}
            maxRating={maxRating}
            platform={platform}
            currentUserId={user?.id || user?._id}
          />
        ))}
      </div>
    </>
  );

  return (
    <div className="leaderboard-container stagger-children">

      {/* ── Header ── */}
      <div className="leaderboard-header glass-card">
        <div className="lb-header-left">
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <HiOutlineTrophy style={{ color: '#f1c40f', fontSize: '1.3rem' }} />
            Rating Leaderboard
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '0.88rem' }}>
            Ranked by contest rating — switch platform to compare.
          </p>
        </div>

        <div className="lb-header-controls">
          <div className="lb-tabs">
            <button
              className={`lb-tab-btn ${view === 'global' ? 'active' : ''}`}
              onClick={() => setView('global')}
            >
              <HiOutlineGlobe style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Global
            </button>
            <button
              className={`lb-tab-btn ${view === 'rivals' ? 'active' : ''}`}
              onClick={() => setView('rivals')}
            >
              <HiOutlineUsers style={{ verticalAlign: 'middle', marginRight: 4 }} />
              My Rivals
            </button>
          </div>

          <div className="lb-select-wrap">
            <select
              className="lb-select"
              value={platform}
              onChange={e => setPlatform(e.target.value)}
              style={{ borderColor: platformColor + '66' }}
            >
              {PLATFORMS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Add Rival ── */}
      {view === 'rivals' && (
        <div className="add-rival-card glass-card"
          style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <HiOutlineUserAdd style={{ fontSize: '1.5rem', color: 'var(--primary-color)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 4px 0' }}>Add a Rival</h4>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Search by exact name or email to add to your personal leaderboard.
            </span>
          </div>
          <form onSubmit={handleAddRival} style={{ display: 'flex', gap: 10, flex: 1 }}>
            <div className="input-group" style={{ flex: 1, margin: 0 }}>
              <div style={{ position: 'relative' }}>
                <HiOutlineSearch style={{
                  position: 'absolute', top: '50%', left: 10,
                  transform: 'translateY(-50%)', color: 'var(--text-muted)'
                }} />
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: 35 }}
                  placeholder="Enter name or email..."
                  value={searchHandle}
                  onChange={e => setSearchHandle(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary"
              disabled={searchLoading || !searchHandle.trim()}>
              {searchLoading ? 'Adding...' : 'Add Rival'}
            </button>
          </form>
        </div>
      )}

      {/* ── Leaderboard Body ── */}
      <div className="glass-card" style={{ padding: '24px 20px', overflow: 'hidden' }}>
        {loading ? (
          <SkeletonRows />
        ) : leaderboardData.length === 0 ? (
          <div className="lb-empty">
            <span className="lb-empty-icon">🏆</span>
            <span>
              {view === 'rivals'
                ? 'No rivals yet — add someone to compete!'
                : 'No users found on this platform yet.'
              }
            </span>
          </div>
        ) : (
          <>
            {/* ── Podium Top 3 ── */}
            {top3.length > 0 && (
              <div className="lb-podium-wrap">
                {[
                  top3[1] && { user: top3[1], rank: 2 },
                  top3[0] && { user: top3[0], rank: 1 },
                  top3[2] && { user: top3[2], rank: 3 },
                ].filter(Boolean).map(({ user: u, rank }) => (
                  <PodiumCard
                    key={u._id}
                    lbUser={u}
                    podiumRank={rank}
                    platform={platform}
                    currentUserId={user?.id || user?._id}
                  />
                ))}
              </div>
            )}

            {/* ── Bar rows ── */}
            <div className="lb-divider" style={{ marginTop: '20px' }} />
            {rest.length > 0
              ? renderBars(rest, 3)
              : renderBars(top3, 0)
            }
          </>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;