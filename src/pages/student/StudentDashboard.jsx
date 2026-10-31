import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getRequests, getRequestCountsByStatus } from '../../services/documentService';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  ExternalLink,
  Calendar,
  Building,
  Loader2,
  Layers
} from 'lucide-react';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [counts, setCounts] = useState({ pending: 0, answered: 0, acknowledged: 0, total: 0 });
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [countsData, requestsData] = await Promise.all([
          getRequestCountsByStatus(true),
          getRequests({ limit: 5 }),
        ]);
        setCounts(countsData);
        setRecentRequests(requestsData.items || []);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="badge-pending">
            <Clock className="w-3 h-3" />
            Under Review
          </span>
        );
      case 'answered':
        return (
          <span className="badge-answered">
            <CheckCircle2 className="w-3 h-3" />
            Answered / Ready
          </span>
        );
      case 'acknowledged':
        return (
          <span className="badge-acknowledged">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      default:
        return <span className="px-2 py-0.5 rounded text-xs bg-slate-100">{status}</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold backdrop-blur-sm border border-blue-400/20">
              <Building className="w-3.5 h-3.5" />
              <span>{user?.dept || 'Institutional Services'}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'Student'}!
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Track your institutional document requests, download verified certificates, or submit a new application online.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/student/apply"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-5 py-3 rounded-xl shadow-md transition-all hover:shadow-blue-500/25 shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Apply for Document</span>
            </Link>
            <Link
              to="/student/bulk-request"
              className="inline-flex items-center justify-center gap-2 bg-navy-800/80 hover:bg-navy-700/80 text-white font-semibold text-sm px-4 py-3 rounded-xl border border-navy-700/60 shadow-sm transition-all shrink-0"
            >
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Bulk Request</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="card border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Applications
            </span>
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : counts.total}
          </div>
          <p className="text-xs text-slate-400 mt-1">Submitted requests</p>
        </div>

        <div className="card border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Under Review
            </span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : counts.pending}
          </div>
          <p className="text-xs text-slate-400 mt-1">Awaiting administrative decision</p>
        </div>

        <div className="card border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Answered / Ready
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : counts.answered}
          </div>
          <p className="text-xs text-slate-400 mt-1">Certificate or response issued</p>
        </div>

        <div className="card border-l-4 border-l-indigo-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Completed
            </span>
            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : counts.acknowledged}
          </div>
          <p className="text-xs text-slate-400 mt-1">Acknowledged by you</p>
        </div>
      </div>

      {/* Recent Applications Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Applications</h2>
            <p className="text-xs text-slate-500 mt-0.5">Your most recent document submissions</p>
          </div>
          <Link
            to="/student/applications"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <Loader2 className="w-6 h-6 animate-spin text-navy-900" />
          </div>
        ) : recentRequests.length === 0 ? (
          <div className="py-10 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">No applications yet</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              You haven't requested any institutional documents yet.
            </p>
            <Link to="/student/apply" className="btn-primary inline-flex text-xs">
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create First Application</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-3">Application ID</th>
                  <th className="pb-3 px-3">Document Type</th>
                  <th className="pb-3 px-3">Submission Date</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {recentRequests.map((req) => (
                  <tr key={req.request_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono text-xs text-slate-600 font-medium">
                      {req.request_id}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {req.doc_type_name || 'Standard Document'}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-500">
                      {new Date(req.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-3">{getStatusBadge(req.status)}</td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/student/applications/${req.request_id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors"
                      >
                        <span>Track</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
