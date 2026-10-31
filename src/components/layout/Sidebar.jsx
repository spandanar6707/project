import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  PlusCircle,
  Clock,
  Layers,
  Users,
  LayoutDashboard,
  GraduationCap,
  FileCheck2,
  X
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdminOrStaff } = useAuth();

  const studentLinks = [
    { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/student/apply', icon: PlusCircle, label: 'Apply for Document' },
    { to: '/student/bulk-request', icon: Layers, label: 'Bulk Document Request' },
    { to: '/student/applications', icon: Clock, label: 'My Applications' },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Admin Dashboard' },
    { to: '/admin/applications', icon: FileCheck2, label: 'All Applications' },
    { to: '/admin/doc-types', icon: Layers, label: 'Document Catalogue' },
    { to: '/admin/users', icon: Users, label: 'User Directory' },
  ];

  const links = isAdminOrStaff ? adminLinks : studentLinks;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-navy-950 text-white flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-navy-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-navy-800 border border-navy-700 flex items-center justify-center text-blue-400 shadow-inner">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-wide text-white">CampusDocs</span>
              <span className="block text-[10px] text-blue-300 font-medium uppercase tracking-wider">
                {isAdminOrStaff ? 'Admin Workspace' : 'Student Portal'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Main Navigation
          </div>
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-300 hover:bg-navy-900 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Quick Institutional Info Footer */}
        <div className="p-4 border-t border-navy-900 bg-navy-900/40">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Role:</span>
            <span className="capitalize font-medium text-blue-300">{user?.role || 'User'}</span>
          </div>
          {user?.dept && (
            <div className="text-xs text-slate-400 flex items-center justify-between mt-1">
              <span>Department:</span>
              <span className="font-medium text-slate-200">{user.dept}</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
