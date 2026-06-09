import { NavLink } from 'react-router-dom';
import {
  HiOutlineViewGrid,
  HiOutlineDocumentText,
  HiOutlineChatAlt2,
  HiOutlineMicrophone,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineSparkles,
  HiOutlineFire
} from 'react-icons/hi';
import './Sidebar.css';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: HiOutlineViewGrid, description: 'Profile Analysis' },
  { path: '/preptrack', label: 'PrepTrack', icon: HiOutlineFire, description: 'Gamified Goals' },
  { path: '/resume', label: 'Resume', icon: HiOutlineDocumentText, description: 'AI Optimizer' },
  { path: '/study', label: 'Study AI', icon: HiOutlineChatAlt2, description: 'Chat Companion' },
  { path: '/interview', label: 'Interview', icon: HiOutlineMicrophone, description: 'Voice Coach', premium: true }
];

const Sidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const handleNavClick = () => {
    // On mobile, close sidebar when a link is clicked
    if (window.innerWidth <= 768) {
      setMobileOpen(false);
    }
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`} id="sidebar">
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
            onClick={handleNavClick}
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
