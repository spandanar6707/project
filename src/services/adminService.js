import api from './api';

// Create a user (student, office_staff, or faculty)
export const createAdminUser = async (userData) => {
  const response = await api.post('/api/v1/admin/users', userData);
  return response.data; // AdminUserView { role, name, email_id, phone_number, usn, dept, designation, otp, created_at, updated_at }
};

// List users by role
export const getAdminUsers = async ({ role = 'student', limit = 50, cursor } = {}) => {
  const params = { limit };
  if (role) params.role = role;
  if (cursor) params.cursor = cursor;
  const response = await api.get('/api/v1/admin/users', { params });
  return response.data; // UserList { count, next_cursor, items }
};

// Get single user by email
export const getAdminUser = async (email_id) => {
  const response = await api.get(`/api/v1/admin/users/${encodeURIComponent(email_id)}`);
  return response.data; // AdminUserView
};

// Update user by email
export const updateAdminUser = async (email_id, updates) => {
  const response = await api.patch(`/api/v1/admin/users/${encodeURIComponent(email_id)}`, updates);
  return response.data;
};

// Delete user by email
export const deleteAdminUser = async (email_id) => {
  const response = await api.delete(`/api/v1/admin/users/${encodeURIComponent(email_id)}`);
  return response.data;
};

// Regenerate user OTP
export const regenerateUserOtp = async (email_id) => {
  const response = await api.post(`/api/v1/admin/users/${encodeURIComponent(email_id)}/regenerate-otp`);
  return response.data; // AdminUserView
};
