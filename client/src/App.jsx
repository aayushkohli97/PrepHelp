import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ResumeBuilder from './pages/ResumeBuilder';
import StudyCompanion from './pages/StudyCompanion';
import InterviewCoach from './pages/InterviewCoach';
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
  return user ? children : <Navigate to="/login" />;
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
  return !user ? children : <Navigate to="/dashboard" />;
};

const AppLayout = ({ children }) => {
  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
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

      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout><Dashboard /></AppLayout>
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

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
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
      </AuthProvider>
    </Router>
  );
}

export default App;
