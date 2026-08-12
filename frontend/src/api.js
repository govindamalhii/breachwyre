// ============================================================
// Breachwyre - API Service Layer
// Centralized Axios instance with JWT auth interceptors
// ============================================================
import axios from 'axios'

// ── API Base URL ───────────────────────────────────────────
// Development:  Uses Vite proxy → /api → localhost:3001
// Production:   Uses VITE_API_URL env var → your Render backend URL
//               e.g. https://breachwyre-backend.onrender.com
const BASE_URL = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api'

// Base API URL — proxied via Vite to backend on port 3001
const API = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request Interceptor: Attach JWT token ─────────────────
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bw_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response Interceptor: Handle 401 / token expiry ───────
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('bw_token')
      localStorage.removeItem('bw_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── Auth Endpoints ─────────────────────────────────────────
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login:    (data) => API.post('/auth/login', data),
  me:       ()     => API.get('/auth/me'),
}

// ── Incident Endpoints ─────────────────────────────────────
export const incidentAPI = {
  create:       (data)        => API.post('/incidents', data),
  list:         ()            => API.get('/incidents'),
  get:          (id)          => API.get(`/incidents/${id}`),
  uploadFiles:  (id, formData) =>
    API.post(`/incidents/${id}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateStatus: (id, status)  => API.patch(`/incidents/${id}/status`, { status }),
  assign:       (id, expertId) => API.patch(`/incidents/${id}/assign`, { expert_id: expertId }),
}

// ── Expert Endpoints ───────────────────────────────────────
export const expertAPI = {
  queue:       ()          => API.get('/expert/queue'),
  getCase:     (id)        => API.get(`/expert/${id}`),
  addNote:     (id, note)  => API.post(`/expert/${id}/notes`, { note }),
  updateStatus:(id, status) => API.patch(`/expert/${id}/status`, { status }),
}

// ── AI Triage Endpoints ────────────────────────────────────
export const aiAPI = {
  classify: (data) => API.post('/ai/classify', data),
}

export default API
