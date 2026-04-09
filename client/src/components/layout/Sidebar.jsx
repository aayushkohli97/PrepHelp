import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineViewGrid,
  HiOutlineDocumentText,
  HiOutlineChatAlt2,
  HiOutlineMicrophone,
  HiOutlineLogout,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineSparkles
} from 'react-icons/hi';
import { useState } from 'react';
import './Sidebar.css';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: HiOutlineViewGrid, description: 'Profile Analysis' },
  { path: '/resume', label: 'Resume', icon: HiOutlineDocumentText, description: 'AI Optimizer' },
  { path: '/study', label: 'Study AI', icon: HiOutlineChatAlt2, description: 'Chat Companion' },
  { path: '/interview', label: 'Interview', icon: HiOutlineMicrophone, description: 'Voice Coach', premium: true }
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`} id="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <HiOutlineSparkles />
          </div>
          {!collapsed && <span className="logo-text">PrepHelp</span>}
        </div>
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <HiOutlineChevronRight /> : <HiOutlineChevronLeft />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''} ${item.premium ? 'premium' : ''}`
            }
            title={collapsed ? item.label : ''}
          >
            <div className="sidebar-link-icon">
              <item.icon />
            </div>
            {!collapsed && (
              <div className="sidebar-link-text">
                <span className="sidebar-link-label">{item.label}</span>
                <span className="sidebar-link-desc">{item.description}</span>
              </div>
            )}
            {!collapsed && item.premium && (
              <span className="premium-badge">PRO</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && user && (
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user.name}</span>
              <span className="sidebar-user-score">Score: {user.placementScore || 0}/100</span>
            </div>
          </div>
        )}
        <button className="sidebar-logout" onClick={logout} title="Logout">
          <HiOutlineLogout />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
