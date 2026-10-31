import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { ApplyDocument } from './pages/student/ApplyDocument';
import { BulkApplyDocument } from './pages/student/BulkApplyDocument';
import { MyApplications } from './pages/student/MyApplications';
import { ApplicationDetail } from './pages/student/ApplicationDetail';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AllApplications } from './pages/admin/AllApplications';
import { ReviewApplication } from './pages/admin/ReviewApplication';
import { ManageDocTypes } from './pages/admin/ManageDocTypes';
import { ManageUsers } from './pages/admin/ManageUsers';

// Helper Root Redirect
const RootRedirect = () => {
  const { user, token, loading } = useAuth();

  if (loading) return null;
  if (!token || !user) return <Navigate to="/login" replace />;

  if (user.role === 'admin' || user.role === 'office_staff') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Navigate to="/student/dashboard" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Root Redirection */}
          <Route path="/" element={<RootRedirect />} />

          {/* Student Protected Portal */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['student', 'faculty', 'office_staff', 'admin']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/student/dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="apply" element={<ApplyDocument />} />
            <Route path="bulk-request" element={<BulkApplyDocument />} />
            <Route path="applications" element={<MyApplications />} />
            <Route path="applications/:id" element={<ApplicationDetail />} />
          </Route>

          {/* Admin / Dean Protected Portal */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin', 'office_staff']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="applications" element={<AllApplications />} />
            <Route path="review/:id" element={<ReviewApplication />} />
            <Route path="doc-types" element={<ManageDocTypes />} />
            <Route path="users" element={<ManageUsers />} />
          </Route>

          {/* Fallback Catch-all Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
