import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 30000
});

// Add token to every request
API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('prephelp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('prephelp_token');
      sessionStorage.removeItem('prephelp_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/profile', data),
  verifyEmail: (data) => API.post('/auth/verify-email', data),
  resendOtp: (data) => API.post('/auth/resend-otp', data),
  forgotPassword: (data) => API.post('/auth/forgot-password', data),
  resetPassword: (data) => API.post('/auth/reset-password', data),
};

// Profile API
export const profileAPI = {
  fetchAll: (profiles) => API.post('/profile/fetch', { profiles }),
  fetchSingle: (platform, username) => API.post('/profile/fetch-single', { platform, username }),
  removeProfile: (platform, password) => API.post('/profile/remove', { platform, password }),
  verifyPassword: (password) => API.post('/profile/verify-password', { password }),
  getStats: () => API.get('/profile/stats'),
  getAnalysis: () => API.get('/profile/analysis')
};

// Resume API
export const resumeAPI = {
  upload: (formData) => API.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  save: (data) => API.post('/resume/save-resume', data),
  create: (data) => API.post('/resume/create', data),
  getAll: () => API.get('/resume'),
  getList: () => API.get('/resume/list'),
  getOne: (id) => API.get(`/resume/${id}`),
  update: (id, data) => API.put(`/resume/${id}`, data),
  analyze: (id) => API.post(`/resume/${id}/analyze`),
  optimize: (id) => API.post(`/resume/${id}/optimize`),
  delete: (id) => API.delete(`/resume/${id}`)
};

// Chat API
export const chatAPI = {
  sendMessage: (message, conversationId) => API.post('/chat/message', { message, conversationId }),
  getConversations: () => API.get('/chat/conversations'),
  getConversation: (id) => API.get(`/chat/conversations/${id}`),
  deleteConversation: (id) => API.delete(`/chat/conversations/${id}`)
};

// Interview API
export const interviewAPI = {
  start: (type) => API.post('/interview/start', { type }),
  respond: (sessionId, answer) => API.post('/interview/respond', { sessionId, answer }),
  end: (sessionId) => API.post('/interview/end', { sessionId }),
  getHistory: () => API.get('/interview/history'),
  getReport: (id) => API.get(`/interview/report/${id}`)
};

// PrepTrack API
export const preptrackAPI = {
  create: (data) => API.post('/preptrack/create', data),
  lock: (id) => API.post(`/preptrack/lock/${id}`),
  editDraft: (id, data) => API.put(`/preptrack/edit/${id}`, data),
  toggleTask: (trackId, taskId) => API.put(`/preptrack/toggle-task/${trackId}/${taskId}`),
  evaluate: (id, data) => API.post(`/preptrack/evaluate/${id}`, data),
  getActive: () => API.get('/preptrack/active'),
  getHistory: () => API.get('/preptrack/history'),
  deleteDraft: (id) => API.delete(`/preptrack/${id}`)
};

// Leaderboard API
export const leaderboardAPI = {
  // ✅ UPDATED: platform param added (default: 'leetcode')
  getGlobal: (platform = 'leetcode') => API.get('/leaderboard/global', { params: { platform } }),
  getRivals: (platform = 'leetcode') => API.get('/leaderboard/rivals', { params: { platform } }),
  // ✅ UNTOUCHED
  addRival:    (handle) => API.post('/leaderboard/rival', { handle }),
  removeRival: (id)     => API.delete(`/leaderboard/rival/${id}`)
};

export default API;