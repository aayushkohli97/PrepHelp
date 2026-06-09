import { useState, useEffect } from 'react';
import { wagerAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { HiOutlineFire, HiOutlineCurrencyDollar, HiOutlineCheckCircle, HiOutlineClock } from 'react-icons/hi';
import toast from 'react-hot-toast';

const WagerDashboard = () => {
  const { user, updateUser } = useAuth();
  const [activeWagers, setActiveWagers] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [wagerForm, setWagerForm] = useState({ type: 'daily', targetQuestions: 5, betAmount: 10 });
  const [historyChartData, setHistoryChartData] = useState([]);

  useEffect(() => {
    loadWagers();
  }, []);

  const loadWagers = async () => {
    try {
      const [activeRes, historyRes] = await Promise.all([
        wagerAPI.getActive(),
        wagerAPI.getHistory()
      ]);
      setActiveWagers(activeRes.data);
      setHistory(historyRes.data);
      processChartData(historyRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const processChartData = (historyData) => {
    // Generate simple chart data mapping day to completion percentage
    const recent = [...historyData].slice(-7).reverse();
    const data = recent.map(w => ({
      name: new Date(w.createdAt).toLocaleDateString(undefined, { weekday: 'short' }),
      percentage: Math.min(100, Math.round((w.completedQuestions / w.targetQuestions) * 100))
    }));
    setHistoryChartData(data.length > 0 ? data : [
      { name: 'Mon', percentage: 0 }, { name: 'Tue', percentage: 0 }
    ]);
  };

  const createWager = async (e) => {
    e.preventDefault();
    if (wagerForm.betAmount > user.prepCoins) {
      return toast.error("You don't have enough PrepCoins!");
    }
    setLoading(true);
    try {
      const res = await wagerAPI.create(wagerForm);
      updateUser({ prepCoins: res.data.prepCoins });
      toast.success("Wager placed successfully!");
      loadWagers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create wager");
    } finally {
      setLoading(false);
    }
  };

  const handleResolveMock = async (wagerId, targetQuestions) => {
    // For demo purposes, we will mock "resolving" a wager by passing a completed amount
    // In a real app, this would be triggered via a cron job reading LeetCode stats
    const randomCompleted = Math.floor(Math.random() * (targetQuestions + 2)); 
    try {
      const res = await wagerAPI.resolve(wagerId, randomCompleted);
      updateUser({ prepCoins: res.data.prepCoins });
      if (res.data.reward > 0) {
        toast.success(`Wager completed! You won ${res.data.reward} PrepCoins!`);
      } else {
        toast.error(`Wager resolved. Goal missed.`);
      }
      loadWagers();
    } catch (err) {
      toast.error("Failed to resolve wager");
    }
  };

  return (
    <div className="wager-dashboard stagger-children">
      
      <div className="glass-card stat-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>Your Balance</h3>
          <h1 style={{ margin: 0, marginTop: '5px', color: '#f1c40f', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HiOutlineCurrencyDollar /> {user.prepCoins} PrepCoins
          </h1>
        </div>
        <HiOutlineFire style={{ fontSize: '3rem', color: '#e74c3c', opacity: 0.8 }} />
      </div>

      <div className="wager-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        
        {/* Place a Bet */}
        <div className="glass-card">
          <h4>Place a New Wager</h4>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '15px' }}>Bet your PrepCoins on your coding goals. Meet the goal to earn them back and more!</p>
          <form onSubmit={createWager} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="input-group">
              <label>Frequency</label>
              <select className="input-field" value={wagerForm.type} onChange={e => setWagerForm({...wagerForm, type: e.target.value})}>
                <option value="daily">Daily Goal</option>
                <option value="weekly">Weekly Goal</option>
                <option value="monthly">Monthly Goal</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Target Questions</label>
                <input type="number" min="1" className="input-field" value={wagerForm.targetQuestions} onChange={e => setWagerForm({...wagerForm, targetQuestions: Number(e.target.value)})} />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Bet Amount</label>
                <input type="number" min="1" className="input-field" value={wagerForm.betAmount} onChange={e => setWagerForm({...wagerForm, betAmount: Number(e.target.value)})} />
              </div>
            </div>

            <div className="wager-preview" style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', fontSize: '0.9rem' }}>
              <strong>Potential Payout:</strong> If you solve all {wagerForm.targetQuestions} questions, you'll earn your bet back.
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Placing Bet...' : 'Pledge & Bet'}
            </button>
          </form>
        </div>

        {/* Active Wagers */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h4>Active Wagers</h4>
          {activeWagers.length === 0 ? (
            <div className="empty-state" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>No active wagers. Place a bet to start!</span>
            </div>
          ) : (
            <div className="active-wagers-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
              {activeWagers.map(wager => {
                const pct = Math.min(100, (wager.completedQuestions / wager.targetQuestions) * 100);
                return (
                  <div key={wager._id} style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong><span style={{textTransform: 'capitalize'}}>{wager.type}</span> Goal</strong>
                      <span style={{ color: 'var(--primary-color)' }}>{wager.betAmount} Coins</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '5px' }}>
                      <span>{wager.completedQuestions} / {wager.targetQuestions} Solved</span>
                      <span>{Math.round(pct)}%</span>
                    </div>
                    <div className="progress-bar" style={{ height: '8px', background: 'var(--surface-3)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? '#00b894' : 'var(--primary-color)' }}></div>
                    </div>
                    {/* MOCK RESOLVE BUTTON FOR DEV */}
                    <button onClick={() => handleResolveMock(wager._id, wager.targetQuestions)} className="btn btn-xs btn-ghost" style={{ marginTop: '10px', fontSize: '0.75rem' }}>
                      Simulate API Resolve
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="glass-card" style={{ marginTop: '20px' }}>
        <h4><HiOutlineCheckCircle style={{ color: '#00b894' }} /> Consistency Graph</h4>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '15px' }}>Your target completion percentage over time.</p>
        <div style={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <Line type="monotone" dataKey="percentage" stroke="#00b894" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="5 5" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip contentStyle={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: '8px', color: '#fff' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default WagerDashboard;
