import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://campus-os-backend-8sjf.onrender.com';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor — attach Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('campusdocs_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('campusdocs_token');
      localStorage.removeItem('campusdocs_profile');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
