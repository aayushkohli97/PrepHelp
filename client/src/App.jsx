import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import ResumeBuilder from './pages/ResumeBuilder';
import StudyCompanion from './pages/StudyCompanion';
import InterviewCoach from './pages/InterviewCoach';
import P2PInterview from './pages/P2PInterview';
import PrepTrackPage from './pages/PrepTrack';
import { useState } from 'react';
import './styles/index.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="loader-center">
        <div className="loader"></div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;
  // Gate: email must be verified to access protected routes
  if (!user.isEmailVerified) return <Navigate to="/verify-email" />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="loader-center">
        <div className="loader"></div>
      </div>
    );
  }
  if (user && user.isEmailVerified) return <Navigate to="/dashboard" />;
  return children;
};

const AppLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />
      {mobileMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}
      <Navbar onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout><Dashboard /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/preptrack" element={
        <ProtectedRoute>
          <AppLayout><PrepTrackPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/resume" element={
        <ProtectedRoute>
          <AppLayout><ResumeBuilder /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/study" element={
        <ProtectedRoute>
          <AppLayout><StudyCompanion /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/interview" element={
        <ProtectedRoute>
          <AppLayout><InterviewCoach /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/interview/p2p/:roomId" element={
        <ProtectedRoute>
          <AppLayout><P2PInterview /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <DataProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1a1a2e',
                color: '#e8e8f0',
                border: '1px solid rgba(108, 92, 231, 0.3)',
                borderRadius: '10px',
                fontSize: '0.9rem',
              },
              success: { iconTheme: { primary: '#00b894', secondary: '#1a1a2e' } },
              error: { iconTheme: { primary: '#ff6b6b', secondary: '#1a1a2e' } },
              duration: 3000,
            }}
          />
        </DataProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
