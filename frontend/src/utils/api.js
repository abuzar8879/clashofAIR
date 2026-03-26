import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

api.defaults.withCredentials = true
api.interceptors.request.use(
  config => {
    const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/)
    if (match) {
      config.headers['X-CSRF-Token'] = decodeURIComponent(match[1])
    }
    return config
  },
  error => Promise.reject(error)
)

// Response interceptor - handle auth errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user')
    }
    return Promise.reject(error)
  }
)

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/register', data),
  login: (data) => api.post('/login', data),
  googleOAuth: (data) => api.post('/oauth/google', data),
  me: () => api.get('/me'),
}

// Events APIs
export const eventsAPI = {
  getAll: (params) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
}

// Questions APIs
export const questionsAPI = {
  getForExam: (eventId) => api.get(`/questions/${eventId}`),
  getAdmin: (eventId) => api.get(`/questions/${eventId}/admin`),
  create: (data) => api.post('/questions', data),
  update: (id, data) => api.put(`/questions/${id}`, data),
  delete: (id) => api.delete(`/questions/${id}`),
  bulkImport: (data) => api.post('/questions/bulk', data),
}

// Exam APIs
export const examAPI = {
  register: (eventId) => api.post('/register-event', { event_id: eventId }),
  submit: (data) => api.post('/submit-exam', data),
  getStatus: (eventId) => api.get(`/exam-status/${eventId}`),
  logViolation: (data) => api.post('/violations', data),
}

// Results APIs
export const resultsAPI = {
  getResult: (eventId) => api.get(`/result/${eventId}`),
  getLeaderboard: (eventId, params) => api.get(`/leaderboard/${eventId}`, { params }),
  getMyResults: (limit = 5) => api.get('/my-results', { params: { limit } }),
}

// Admin APIs
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getUserAttempts: (id) => api.get(`/admin/users/${id}/attempts`),
  getResults: (params) => api.get('/admin/results', { params }),
  recalculate: (eventId) => api.post(`/admin/recalculate/${eventId}`),
  exportCSV: (eventId) => `${BASE_URL}/api/admin/export/${eventId}`,
  getEvents: () => api.get('/admin/events'),
  getViolations: (params) => api.get('/admin/violations', { params }),
}

export default api
