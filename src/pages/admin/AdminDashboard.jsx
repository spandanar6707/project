import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getRequests, getRequestCountsByStatus } from '../../services/documentService';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Layers,
  ArrowRight,
  ExternalLink,
  Shield,
  Loader2,
  Calendar
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [counts, setCounts] = useState({ pending: 0, answered: 0, acknowledged: 0, total: 0 });
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminDashboard = async () => {
      try {
        setLoading(true);
        const [countsData, requestsData] = await Promise.all([
          getRequestCountsByStatus(false),
          getRequests({ limit: 6 }),
        ]);
        setCounts(countsData);
        setRecentRequests(requestsData.items || []);
      } catch (err) {
        console.error('Failed to load admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminDashboard();
  }, []);

  const chartData = [
    { name: 'Pending Review', count: counts.pending, color: '#f59e0b' },
    { name: 'Answered / Ready', count: counts.answered, color: '#10b981' },
    { name: 'Completed', count: counts.acknowledged, color: '#4f46e5' },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="badge-pending">
            <Clock className="w-3 h-3" />
            Pending Review
          </span>
        );
      case 'answered':
        return (
          <span className="badge-answered">
            <CheckCircle2 className="w-3 h-3" />
            Answered
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
      {/* Admin Welcome Header */}
      <div className="bg-navy-950 rounded-2xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-navy-900">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>Administrative Command Center</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Institutional Administration – {user?.institution_name || 'Campus Portal'}
          </h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Oversee document requests, evaluate student submissions, issue official certificates, and configure institutional catalogue parameters.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link to="/admin/applications" className="btn-primary text-xs py-2.5">
            <FileText className="w-4 h-4" />
            <span>Review Applications</span>
          </Link>
          <Link to="/admin/users" className="btn-secondary text-xs py-2.5">
            <Users className="w-4 h-4" />
            <span>Manage Users</span>
          </Link>
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
          <p className="text-xs text-slate-400 mt-1">Across all departments</p>
        </div>

        <div className="card border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Awaiting Review
            </span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : counts.pending}
          </div>
          <p className="text-xs text-slate-400 mt-1">Pending admin action</p>
        </div>

        <div className="card border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Processed / Answered
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : counts.answered}
          </div>
          <p className="text-xs text-slate-400 mt-1">Response or certificate issued</p>
        </div>

        <div className="card border-l-4 border-l-indigo-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Acknowledged
            </span>
            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : counts.acknowledged}
          </div>
          <p className="text-xs text-slate-400 mt-1">Confirmed received by student</p>
        </div>
      </div>

      {/* Analytics Chart & Catalogue Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Application Status Distribution</h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time breakdown of current requests</p>
            </div>
          </div>
          <div className="h-64">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-navy-900" />
              </div>
            ) : counts.total === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No application data available to display chart.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quick Portal Administration Shortcuts */}
        <div className="card space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Administrative Tools</h2>
            <p className="text-xs text-slate-500 mt-0.5">Quick platform setup operations</p>
          </div>

          <div className="space-y-3">
            <Link
              to="/admin/doc-types"
              className="p-3.5 rounded-xl border border-slate-200 hover:border-navy-900 hover:bg-slate-50 transition-all flex items-center justify-between group block"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Document Catalogue
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Add or archive certificate types
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-navy-900 group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              to="/admin/users"
              className="p-3.5 rounded-xl border border-slate-200 hover:border-navy-900 hover:bg-slate-50 transition-all flex items-center justify-between group block"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Student Provisioning
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Generate student accounts & OTPs
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-navy-900 group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              to="/admin/applications?status=pending"
              className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 transition-all flex items-center justify-between group block"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-950 block">
                    Pending Queue ({counts.pending})
                  </span>
                  <span className="text-[11px] text-amber-700">
                    Process requests awaiting evaluation
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-700 group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Submissions Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Student Applications</h2>
            <p className="text-xs text-slate-500 mt-0.5">Most recent incoming requests</p>
          </div>
          <Link
            to="/admin/applications"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>View All Applications</span>
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
            <h3 className="text-sm font-semibold text-slate-700">No applications received yet</h3>
            <p className="text-xs text-slate-400 mt-1">
              When students submit document requests, they will appear in this feed.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-3">Application ID</th>
                  <th className="pb-3 px-3">Student Name</th>
                  <th className="pb-3 px-3">Document Type</th>
                  <th className="pb-3 px-3">Submission Date</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {recentRequests.map((req) => (
                  <tr key={req.request_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono text-xs text-slate-600 font-semibold">
                      {req.request_id}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">
                        {req.requested_by_name || 'Student'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {req.requested_by}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {req.doc_type_name || 'Document'}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">{getStatusBadge(req.status)}</td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <Link
                        to={`/admin/review/${req.request_id}`}
                        className="btn-primary inline-flex text-xs py-1.5 px-3"
                      >
                        <span>Evaluate</span>
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
