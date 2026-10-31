import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Building, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout, isAdminOrStaff } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          aria-label="Toggle Navigation"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 py-1 px-3 rounded-full">
          <Building className="w-3.5 h-3.5 text-navy-700" />
          <span>{user?.institution_name || 'Campus Institutional Portal'}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* User Badge */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-navy-50 border border-navy-100 flex items-center justify-center text-navy-900 font-semibold text-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-sm font-semibold text-slate-800 leading-tight flex items-center gap-1.5">
              <span>{user?.name || 'User'}</span>
              {isAdminOrStaff && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-navy-900 text-white">
                  ADMIN
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500">
              {user?.role === 'student' ? `USN: ${user?.usn || 'N/A'}` : user?.email_id}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          title="Sign Out"
          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium border border-transparent hover:border-red-100"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};
