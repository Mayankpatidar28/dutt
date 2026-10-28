const API_BASE = '/api';

function getStoredToken() {
  try {
    return localStorage.getItem('dutt_token');
  } catch (e) {
    return null;
  }
}

async function request(endpoint, options = {}) {
  const token = getStoredToken();
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === 'object' && !isFormData) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.statusCode = response.status;
    error.errorCode = data.errorCode || 'API_ERROR';
    error.details = data.details || null;
    throw error;
  }

  return data.data !== undefined ? data.data : data;
}

export const api = {
  // Auth
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getMe: () => request('/auth/me', { method: 'GET' }),

  // User profile
  getProfile: () => request('/users/profile', { method: 'GET' }),
  updateProfile: (payload) => request('/users/profile', { method: 'PATCH', body: payload }),

  // Assessment
  startAssessment: () => request('/assessment/start', { method: 'POST' }),
  submitAssessment: (payload) => request('/assessment/submit', { method: 'POST', body: payload }),
  getAssessmentResult: () => request('/assessment/result', { method: 'GET' }),

  // Conversations
  createConversation: (payload) => request('/conversations', { method: 'POST', body: payload }),
  listConversations: () => request('/conversations', { method: 'GET' }),
  getConversation: (id) => request(`/conversations/${id}`, { method: 'GET' }),
  deleteConversation: (id) => request(`/conversations/${id}`, { method: 'DELETE' }),
  sendMessage: (id, payload) => request(`/conversations/${id}/messages`, { method: 'POST', body: payload }),
  approveAction: (id, payload) => request(`/conversations/${id}/actions/approve`, { method: 'POST', body: payload }),
  endConversation: (id) => request(`/conversations/${id}/end`, { method: 'POST' }),

  // AI Direct
  chatAI: (payload) => request('/ai/chat', { method: 'POST', body: payload }),
  correctGrammar: (payload) => request('/ai/correct', { method: 'POST', body: payload }),
  evaluateSpeaking: (payload) => request('/ai/evaluate', { method: 'POST', body: payload }),
  extractVocab: (payload) => request('/ai/vocabulary', { method: 'POST', body: payload }),

  // Voice & Pronunciation
  transcribeAudio: (payload) => request('/voice/transcribe', { method: 'POST', body: payload }),
  synthesizeSpeech: (payload) => request('/voice/synthesize', { method: 'POST', body: payload }),
  evaluatePronunciation: (payload) => request('/voice/pronunciation', { method: 'POST', body: payload }),

  // Learning & Dashboard
  getDashboard: () => request('/learning/dashboard', { method: 'GET' }),
  getRecommendations: () => request('/learning/recommendations', { method: 'GET' }),
  getMistakes: () => request('/learning/mistakes', { method: 'GET' }),
  getVocabulary: (filter) => request(`/learning/vocabulary${filter ? `?filter=${filter}` : ''}`, { method: 'GET' }),
  reviewVocabulary: (id, remembered) => request(`/learning/vocabulary/${id}/review`, { method: 'POST', body: { remembered } }),
  getLessons: () => request('/learning/lessons', { method: 'GET' }),

  // Progress
  getProgressSummary: () => request('/progress', { method: 'GET' }),
  getWeeklyProgress: () => request('/progress/weekly', { method: 'GET' }),
  getMonthlyProgress: () => request('/progress/monthly', { method: 'GET' }),
};

export default api;
