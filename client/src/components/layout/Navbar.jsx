import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import {
  HiOutlineBell, HiOutlineSearch, HiOutlineMenu,
  HiOutlineLogout, HiOutlinePencil, HiOutlineCheck, HiOutlineX
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import './Navbar.css';

const pageTitles = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Your placement readiness overview' },
  '/resume': { title: 'Resume Builder', subtitle: 'AI-powered resume optimization' },
  '/study': { title: 'Study Companion', subtitle: 'AI-assisted learning' },
  '/interview': { title: 'Interview Coach', subtitle: 'Practice mock interviews' }
};

const Navbar = ({ onMenuClick }) => {
  const { user, logout, updateUser } = useAuth();
  const location = useLocation();

  // Separate dropdown states
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Inline name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const pageInfo = pageTitles[location.pathname] || { title: 'PrepHelp', subtitle: '' };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
        setIsEditingName(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update editName when user changes
  useEffect(() => {
    if (user?.name) setEditName(user.name);
  }, [user?.name]);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowProfileDropdown(false); // Close the other
  };

  const toggleProfile = () => {
    setShowProfileDropdown(!showProfileDropdown);
    setShowNotifications(false); // Close the other
    setIsEditingName(false);
  };

  const handleSaveName = async () => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === user?.name) {
      setIsEditingName(false);
      setEditName(user?.name || '');
      return;
    }
    setSavingName(true);
    try {
      const res = await authAPI.updateProfile({ name: trimmed });
      updateUser({ name: res.data.name });
      toast.success('Name updated!');
      setIsEditingName(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update name');
    } finally {
      setSavingName(false);
    }
  };

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') handleSaveName();
    if (e.key === 'Escape') {
      setIsEditingName(false);
      setEditName(user?.name || '');
    }
  };

  return (
    <header className="navbar" id="navbar">
      <div className="navbar-left">
        <button className="navbar-menu-btn" onClick={onMenuClick} id="hamburger-btn">
          <HiOutlineMenu />
        </button>
        <div className="navbar-title">
          <h2>{pageInfo.title}</h2>
          <p>{pageInfo.subtitle}</p>
        </div>
      </div>

      <div className="navbar-right">
        <div className="navbar-search">
          <HiOutlineSearch />
          <input
            type="text"
            placeholder="Search..."
            className="navbar-search-input"
            id="global-search"
          />
        </div>

        {/* ===== NOTIFICATION BELL — separate dropdown ===== */}
        <div className="navbar-notif-container" ref={notifRef}>
          <button
            className="navbar-icon-btn"
            title="Notifications"
            id="notifications-btn"
            onClick={toggleNotifications}
          >
            <HiOutlineBell />
            <span className="notification-dot"></span>
          </button>

          {showNotifications && (
            <div className="notification-dropdown animate-fade-in-up">
              <div className="nd-header">
                <h4>Notifications</h4>
              </div>
              <div className="nd-body">
                <div className="nd-item">
                  <div className="nd-icon">✨</div>
                  <div className="nd-text">
                    <p>Welcome to PrepHelp</p>
                    <span>Get started by adding your coding profiles.</span>
                  </div>
                </div>
                {user?.placementScore > 0 && (
                  <div className="nd-item">
                    <div className="nd-icon">📊</div>
                    <div className="nd-text">
                      <p>AI Analysis Ready</p>
                      <span>Your placement analysis insights are available.</span>
                    </div>
                  </div>
                )}
                {user?.prepCoins > 0 && (
                  <div className="nd-item">
                    <div className="nd-icon">🪙</div>
                    <div className="nd-text">
                      <p>PrepCoins Balance</p>
                      <span>You have {user.prepCoins} PrepCoins to spend on wagers.</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="nd-footer">
                <span className="nd-footer-text">All caught up!</span>
              </div>
            </div>
          )}
        </div>

        {/* ===== AVATAR — separate profile dropdown ===== */}
        <div className="navbar-avatar-container" ref={profileRef}>
          <div
            className="navbar-avatar"
            title={user?.name}
            onClick={toggleProfile}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>

          {showProfileDropdown && (
            <div className="profile-dropdown animate-fade-in-up">
              <div className="pd-header">
                <div className="pd-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
                <div className="pd-info">
                  {isEditingName ? (
                    <div className="pd-name-edit">
                      <input
                        type="text"
                        className="pd-name-input"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={handleNameKeyDown}
                        maxLength={50}
                        autoFocus
                        disabled={savingName}
                      />
                      <div className="pd-name-actions">
                        <button
                          className="pd-name-btn save"
                          onClick={handleSaveName}
                          disabled={savingName}
                          title="Save"
                        >
                          {savingName ? (
                            <span className="loader" style={{ width: 12, height: 12, borderWidth: 2 }}></span>
                          ) : (
                            <HiOutlineCheck />
                          )}
                        </button>
                        <button
                          className="pd-name-btn cancel"
                          onClick={() => { setIsEditingName(false); setEditName(user?.name || ''); }}
                          title="Cancel"
                        >
                          <HiOutlineX />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pd-name-row">
                      <h4>{user?.name}</h4>
                      <button
                        className="pd-edit-btn"
                        onClick={() => setIsEditingName(true)}
                        title="Edit name"
                      >
                        <HiOutlinePencil />
                      </button>
                    </div>
                  )}
                  {/* Email — always read-only */}
                  <p className="pd-email">{user?.email}</p>
                </div>
              </div>

              <div className="pd-body">
                <div className="pd-section">
                  <h5>Account Info</h5>
                  <div className="pd-stat">
                    <span>Email</span>
                    <span className="pd-email-badge">{user?.email}</span>
                  </div>
                  <div className="pd-stat">
                    <span>Readiness Score</span>
                    <span className={`badge ${user?.placementScore >= 70 ? 'badge-success' : user?.placementScore >= 40 ? 'badge-warning' : 'badge-danger'}`}>
                      {user?.placementScore || 0}/100
                    </span>
                  </div>
                  <div className="pd-stat">
                    <span>PrepCoins</span>
                    <span className="badge badge-primary">🪙 {user?.prepCoins || 0}</span>
                  </div>
                </div>
              </div>

              <div className="pd-footer">
                <button className="btn btn-ghost btn-block" onClick={logout} style={{ color: 'var(--accent-danger)' }}>
                  <HiOutlineLogout /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
