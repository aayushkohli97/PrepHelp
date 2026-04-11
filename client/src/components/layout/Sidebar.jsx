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

    </aside>
  );
};

export default Sidebar;
