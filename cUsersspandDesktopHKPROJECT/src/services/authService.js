import api from './api';

// Admin login: POST /api/v1/auth/admin/login
export const adminLogin = async (email_id, otp) => {
  const response = await api.post('/api/v1/auth/admin/login', { email_id, otp });
  return response.data; // TokenResponse
};

// Student / Staff / Faculty login: POST /api/v1/auth/login
export const userLogin = async (email_id, otp) => {
  const response = await api.post('/api/v1/auth/login', { email_id, otp });
  return response.data; // TokenResponse
};

// Get admin's own profile
export const getAdminProfile = async () => {
  const response = await api.get('/api/v1/admin/me');
  return response.data; // AdminProfile
};

// Get current user's own profile
export const getUserProfile = async () => {
  const response = await api.get('/api/v1/users/me');
  return response.data; // UserProfile
};

// Logout — clear local storage
export const logout = () => {
  localStorage.removeItem('campusdocs_token');
  localStorage.removeItem('campusdocs_profile');
};

// Token helpers
export const saveAuthData = (token, profile) => {
  localStorage.setItem('campusdocs_token', token);
  localStorage.setItem('campusdocs_profile', JSON.stringify(profile));
};

export const getStoredProfile = () => {
  try {
    const stored = localStorage.getItem('campusdocs_profile');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const getStoredToken = () => localStorage.getItem('campusdocs_token');
