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
  updateProfile: (data) => API.put('/auth/profile', data)
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

export default API;
