import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = sessionStorage.getItem('prephelp_token');
    const storedUser = sessionStorage.getItem('prephelp_user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      // Verify token
      authAPI.getMe()
        .then(res => {
          setUser(res.data);
          sessionStorage.setItem('prephelp_user', JSON.stringify(res.data));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const register = async (name, email, password) => {
    try {
      setError(null);
      const res = await authAPI.register({ name, email, password });
      const userData = res.data;
      sessionStorage.setItem('prephelp_token', userData.token);
      sessionStorage.setItem('prephelp_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
      throw new Error(msg);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const res = await authAPI.login({ email, password });
      const userData = res.data;
      sessionStorage.setItem('prephelp_token', userData.token);
      sessionStorage.setItem('prephelp_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('prephelp_token');
    sessionStorage.removeItem('prephelp_user');
    setUser(null);
  };

  const updateUser = (newData) => {
    setUser(prev => ({ ...prev, ...newData }));
    sessionStorage.setItem('prephelp_user', JSON.stringify({ ...user, ...newData }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, register, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
