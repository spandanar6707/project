import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  adminLogin as apiAdminLogin,
  userLogin as apiUserLogin,
  getAdminProfile,
  getUserProfile,
  saveAuthData,
  getStoredProfile,
  getStoredToken,
  logout as apiLogout,
} from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from storage and verify with backend
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getStoredToken();
      const storedProfile = getStoredProfile();

      if (storedToken && storedProfile) {
        setToken(storedToken);
        setUser(storedProfile);

        // Fetch fresh profile from backend
        try {
          if (storedProfile.role === 'admin') {
            const freshAdmin = await getAdminProfile();
            setUser(freshAdmin);
            saveAuthData(storedToken, freshAdmin);
          } else {
            const freshUser = await getUserProfile();
            setUser(freshUser);
            saveAuthData(storedToken, freshUser);
          }
        } catch (err) {
          console.warn('Failed to refresh user profile:', err);
          // If 401 or invalid, interceptor handles redirect
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Admin Login
  const loginAdmin = async (email, otp) => {
    const data = await apiAdminLogin(email, otp);
    setToken(data.access_token);
    setUser(data.profile);
    saveAuthData(data.access_token, data.profile);
    return data.profile;
  };

  // Student / Staff Login
  const loginUser = async (email, otp) => {
    const data = await apiUserLogin(email, otp);
    setToken(data.access_token);
    setUser(data.profile);
    saveAuthData(data.access_token, data.profile);
    return data.profile;
  };

  // Logout
  const logout = () => {
    apiLogout();
    setToken(null);
    setUser(null);
  };

  const isAdminOrStaff = user?.role === 'admin' || user?.role === 'office_staff';
  const isStudent = user?.role === 'student';

  const value = {
    user,
    token,
    loading,
    isAdminOrStaff,
    isStudent,
    loginAdmin,
    loginUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
