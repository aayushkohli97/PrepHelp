import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, profileAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ---- Phase 3: Global profile/stats cache ----
  const [profiles, setProfiles] = useState(null);       // null = not yet fetched
  const [profilesLoading, setProfilesLoading] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem('prephelp_token');
    const storedUser = sessionStorage.getItem('prephelp_user');
    if (token && storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      // Verify token is still valid
      authAPI.getMe()
        .then(res => {
          const fresh = { ...res.data, token };
          setUser(fresh);
          sessionStorage.setItem('prephelp_user', JSON.stringify(fresh));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch profiles once when user is set and profiles haven't been loaded yet
  useEffect(() => {
    if (user && user.isEmailVerified && profiles === null && !profilesLoading) {
      fetchProfiles();
    }
  }, [user]);

  const register = async (name, email, password) => {
    try {
      setError(null);
      const res = await authAPI.register({ name, email, password });
      const userData = res.data;
      // Store token for verification requests, but mark as unverified
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
      // Handle 403 needsVerification
      if (err.response?.status === 403 && err.response?.data?.needsVerification) {
        const data = err.response.data;
        // Store token so the verify page can make requests
        sessionStorage.setItem('prephelp_token', data.token);
        sessionStorage.setItem('prephelp_user', JSON.stringify({
          email: data.email,
          isEmailVerified: false,
          token: data.token,
        }));
        setUser({ email: data.email, isEmailVerified: false, token: data.token });
        return { needsVerification: true, email: data.email };
      }
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('prephelp_token');
    sessionStorage.removeItem('prephelp_user');
    setUser(null);
    setProfiles(null); // Clear cached profiles on logout
  };

  const updateUser = (newData) => {
    setUser(prev => {
      const updated = { ...prev, ...newData };
      sessionStorage.setItem('prephelp_user', JSON.stringify(updated));
      return updated;
    });
  };

  // ---- Phase 3: Profile data caching ----
  const fetchProfiles = useCallback(async (force = false) => {
    if (profiles !== null && !force) return profiles; // Cache hit
    setProfilesLoading(true);
    try {
      const res = await profileAPI.getStats();
      setProfiles(res.data);
      return res.data;
    } catch (err) {
      setProfiles([]); // Set empty array so we don't keep retrying
      return [];
    } finally {
      setProfilesLoading(false);
    }
  }, [profiles]);

  const refreshProfiles = useCallback(async () => {
    setProfilesLoading(true);
    try {
      const res = await profileAPI.getStats();
      setProfiles(res.data);
      return res.data;
    } catch (err) {
      return profiles || [];
    } finally {
      setProfilesLoading(false);
    }
  }, [profiles]);

  return (
    <AuthContext.Provider value={{
      user, loading, error,
      register, login, logout, updateUser,
      profiles, profilesLoading, fetchProfiles, refreshProfiles, setProfiles,
    }}>
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
