import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineBell, HiOutlineSearch, HiOutlineMenu, HiOutlineLogout } from 'react-icons/hi';
import './Navbar.css';

const pageTitles = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Your placement readiness overview' },
  '/resume': { title: 'Resume Builder', subtitle: 'AI-powered resume optimization' },
  '/study': { title: 'Study Companion', subtitle: 'AI-assisted learning' },
  '/interview': { title: 'Interview Coach', subtitle: 'Practice mock interviews' }
};

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showProfile, setShowProfile] = useState(false);
  const dropdownRef = useRef(null);
  
  const pageInfo = pageTitles[location.pathname] || { title: 'PrepHelp', subtitle: '' };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="navbar" id="navbar">
      <div className="navbar-left">
        <button className="navbar-menu-btn" onClick={onMenuClick}>
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
        <button 
          className="navbar-icon-btn" 
          title="Notifications" 
          id="notifications-btn"
          onClick={() => setShowProfile(!showProfile)}
        >
          <HiOutlineBell />
          <span className="notification-dot"></span>
        </button>
        
        <div className="navbar-avatar-container" ref={dropdownRef}>
          <div 
            className="navbar-avatar" 
            title={user?.name}
            onClick={() => setShowProfile(!showProfile)}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>

          {showProfile && (
            <div className="profile-dropdown animate-fade-in-up">
              <div className="pd-header">
                <div className="pd-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
                <div className="pd-info">
                  <h4>{user?.name}</h4>
                  <p>{user?.email}</p>
                </div>
              </div>
              
              <div className="pd-body">
                <div className="pd-section">
                  <h5>Your Placement Stats</h5>
                  <div className="pd-stat">
                    <span>Readiness Score</span>
                    <span className={`badge ${user?.placementScore >= 70 ? 'badge-success' : user?.placementScore >= 40 ? 'badge-warning' : 'badge-danger'}`}>
                      {user?.placementScore || 0}/100
                    </span>
                  </div>
                </div>

                <div className="pd-section">
                  <h5>Recent Notifications</h5>
                  <div className="pd-notification">
                    <div className="pd-notif-icon">✨</div>
                    <div className="pd-notif-text">
                      <p>Welcome to PrepHelp</p>
                      <span>Get started by adding your complete coding profile.</span>
                    </div>
                  </div>
                  {user?.placementScore > 0 && (
                    <div className="pd-notification">
                      <div className="pd-notif-icon">📊</div>
                      <div className="pd-notif-text">
                        <p>AI Analysis Ready</p>
                        <span>You have generated your placement analysis insights.</span>
                      </div>
                    </div>
                  )}
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
