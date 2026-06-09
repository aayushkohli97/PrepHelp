import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  
  // Leaderboard cache: key is `${view}-${platform}`
  const [leaderboardCache, setLeaderboardCache] = useState({});
  
  // PrepTrack cache: { tracks, history, chartData }
  const [prepTrackCache, setPrepTrackCache] = useState(null);
  
  // Resume cache: array of saved resumes
  const [resumeCache, setResumeCache] = useState(null);

  // Dashboard AI Analysis cache
  const [analysisCache, setAnalysisCache] = useState(null);

  const clearData = () => {
    setLeaderboardCache({});
    setPrepTrackCache(null);
    setResumeCache(null);
    setAnalysisCache(null);
  };

  // Clear cache when user logs out
  useEffect(() => {
    if (!user) {
      clearData();
    }
  }, [user]);

  return (
    <DataContext.Provider value={{
      leaderboardCache, setLeaderboardCache,
      prepTrackCache, setPrepTrackCache,
      resumeCache, setResumeCache,
      analysisCache, setAnalysisCache,
      clearData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useDataCache = () => useContext(DataContext);
