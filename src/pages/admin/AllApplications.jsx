import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getRequests,
  getDocTypes,
  bulkSetTat,
  answerRequest,
  parseBatchMetadata
} from '../../services/documentService';
import {
  FileText,
  Clock,
  CheckCircle2,
  Search,
  Calendar,
  Layers,
  ExternalLink,
  Loader2,
  CheckSquare,
  Square,
  AlertCircle,
  FileCheck2,
  XCircle,
  ArrowRight,
  Filter,
  Check,
  X,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

export const AllApplications = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';

  const [requests, setRequests] = useState([]);
  const [docTypes, setDocTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialStatus);
  const [selectedDocTypeId, setSelectedDocTypeId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState([]);

  // Bulk TAT Modal State
  const [showBulkTatModal, setShowBulkTatModal] = useState(false);
  const [bulkTatDate, setBulkTatDate] = useState('');
  const [bulkTatNote, setBulkTatNote] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  // Bulk Approve Modal State
  const [showBulkApproveModal, setShowBulkApproveModal] = useState(false);
  const [bulkApproveMessage, setBulkApproveMessage] = useState(
    'Your document request has been verified and processed by the institutional desk.'
  );

  // Bulk Reject Modal State
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState(
    'Application returned: Incomplete supporting documents or requirement clearance pending.'
  );

  // Live Batch Processing Progress Modal
  const [bulkProgress, setBulkProgress] = useState(null); // { current, total, actionType, running }
  const [bulkSummaryResult, setBulkSummaryResult] = useState(null); // { actionType, total, successCount, failureCount, failures }

  const fetchApplicationsAndTypes = async () => {
    try {
      setLoading(true);
      const params = { limit: 100 };
      if (activeTab !== 'all') {
        params.status = activeTab;
      }
      if (selectedDocTypeId !== 'all') {
        params.doc_type_id = selectedDocTypeId;
      }

      const [reqData, typesData] = await Promise.all([
        getRequests(params),
        getDocTypes({ limit: 100 }).catch(() => ({ items: [] })),
      ]);

      setRequests(reqData.items || []);
      setDocTypes(typesData.items || []);
      setSelectedIds([]); // clear selection when filters change
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicationsAndTypes();
  }, [activeTab, selectedDocTypeId]);

  // Toggle selection for a single request
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    const q = searchQuery.toLowerCase();
    const student = (req.requested_by_name || '').toLowerCase();
    const email = (req.requested_by || '').toLowerCase();
    const docType = (req.doc_type_name || '').toLowerCase();
    const reqId = (req.request_id || '').toLowerCase();
    const dept = (req.requested_by_dept || '').toLowerCase();
    const reason = (req.reason || '').toLowerCase();
    return (
      student.includes(q) ||
      email.includes(q) ||
      docType.includes(q) ||
      reqId.includes(q) ||
      dept.includes(q) ||
      reason.includes(q)
    );
  });

  const pendingInView = filteredRequests.filter((r) => r.status === 'pending');
  const allPendingSelected =
    pendingInView.length > 0 && pendingInView.every((r) => selectedIds.includes(r.request_id));

  // Select all or deselect all pending in current view
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const pendingIds = pendingInView.map((r) => r.request_id);
      setSelectedIds(pendingIds);
    } else {
      setSelectedIds([]);
    }
  };

  // Submit Bulk TAT (Native backend API: POST /api/v1/docdesk/requests/bulk-tat)
  const handleBulkTatSubmit = async (e) => {
    e.preventDefault();
    if (!bulkTatDate || selectedIds.length === 0) return;

    try {
      setBulkLoading(true);
      await bulkSetTat({
        expected_by: bulkTatDate,
        note: bulkTatNote.trim() || undefined,
        request_ids: selectedIds,
      });

      setShowBulkTatModal(false);
      const count = selectedIds.length;
      setSelectedIds([]);
      setBulkTatDate('');
      setBulkTatNote('');
      await fetchApplicationsAndTypes();
      setBulkSummaryResult({
        actionType: 'Target Turnaround Time Scheduled',
        total: count,
        successCount: count,
        failureCount: 0,
        failures: [],
      });
    } catch (err) {
      console.error('Failed to set bulk TAT:', err);
      const detail =
        err.response?.data?.error?.message ||
        'Failed to set bulk turnaround time. Verify that all selected requests are pending and valid.';
      alert(detail);
    } finally {
      setBulkLoading(false);
    }
  };

  // Submit Bulk Approval (Sequential real backend API calls)
  const handleBulkApproveSubmit = async (e) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;

    setShowBulkApproveModal(false);
    setBulkProgress({ current: 0, total: selectedIds.length, actionType: 'Approving', running: true });

    let successCount = 0;
    const failures = [];

    for (let i = 0; i < selectedIds.length; i++) {
      const reqId = selectedIds[i];
      setBulkProgress({ current: i + 1, total: selectedIds.length, actionType: 'Approving', running: true });

      try {
        await answerRequest(reqId, {
          message: bulkApproveMessage.trim(),
        });
        successCount++;
      } catch (err) {
        console.error(`Failed to approve request ${reqId}:`, err);
        failures.push({
          id: reqId,
          error: err.response?.data?.error?.message || 'Permission or state error',
        });
      }
    }

    setBulkProgress(null);
    setSelectedIds([]);
    await fetchApplicationsAndTypes();

    setBulkSummaryResult({
      actionType: 'Application Approval & Response',
      total: selectedIds.length,
      successCount,
      failureCount: failures.length,
      failures,
    });
  };

  // Submit Bulk Rejection (Sequential real backend API calls)
  const handleBulkRejectSubmit = async (e) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;

    setShowBulkRejectModal(false);
    setBulkProgress({ current: 0, total: selectedIds.length, actionType: 'Rejecting / Returning', running: true });

    let successCount = 0;
    const failures = [];

    for (let i = 0; i < selectedIds.length; i++) {
      const reqId = selectedIds[i];
      setBulkProgress({ current: i + 1, total: selectedIds.length, actionType: 'Rejecting / Returning', running: true });

      try {
        await answerRequest(reqId, {
          message: `[REJECTED]: ${bulkRejectReason.trim()}`,
        });
        successCount++;
      } catch (err) {
        console.error(`Failed to reject request ${reqId}:`, err);
        failures.push({
          id: reqId,
          error: err.response?.data?.error?.message || 'Permission or state error',
        });
      }
    }

    setBulkProgress(null);
    setSelectedIds([]);
    await fetchApplicationsAndTypes();

    setBulkSummaryResult({
      actionType: 'Application Rejection / Deficiencies',
      total: selectedIds.length,
      successCount,
      failureCount: failures.length,
      failures,
    });
  };

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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-navy-100 text-navy-800">
              <FileCheck2 className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-navy-800">
              Administrative Desk
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Institutional Applications Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Process student requests, schedule turnaround targets, and execute bulk verification actions
          </p>
        </div>

        {/* Bulk Processing Action Bar */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 bg-navy-950 text-white p-2.5 rounded-xl shadow-xl border border-navy-800 animate-in fade-in slide-in-from-top-2">
            <div className="px-2 py-1 text-xs font-bold text-blue-300 border-r border-navy-800 pr-3">
              {selectedIds.length} Selected
            </div>

            <button
              type="button"
              onClick={() => setShowBulkTatModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Bulk Set TAT</span>
            </button>

            <button
              type="button"
              onClick={() => setShowBulkApproveModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Bulk Approve</span>
            </button>

            <button
              type="button"
              onClick={() => setShowBulkRejectModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Bulk Reject</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-slate-400 hover:text-white text-xs px-2 py-1"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Filter Tabs, Document Type Filter & Search Bar */}
      <div className="card space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Applications' },
              { id: 'pending', label: 'Pending Review' },
              { id: 'answered', label: 'Answered' },
              { id: 'acknowledged', label: 'Completed' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchParams({ status: tab.id });
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Document Type Dropdown Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Doc Type:</span>
            <select
              value={selectedDocTypeId}
              onChange={(e) => setSelectedDocTypeId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-navy-900 max-w-[200px] truncate"
            >
              <option value="all">All Document Types</option>
              {docTypes.map((dt) => (
                <option key={dt.doc_type_id} value={dt.doc_type_id}>
                  {dt.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Student Name, Email, Batch ID, Application ID, or Document Type..."
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Applications Directory Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-navy-900" />
            <span className="text-xs text-slate-500 font-medium">Fetching applications from server...</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No applications match criteria</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Try adjusting your status filter, document category, or search keywords.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={allPendingSelected}
                      onChange={handleSelectAll}
                      disabled={pendingInView.length === 0}
                      title="Select all pending applications on page"
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="py-3.5 px-4">Application Details</th>
                  <th className="py-3.5 px-4">Applicant Student</th>
                  <th className="py-3.5 px-4">Submission Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">TAT Target</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredRequests.map((req) => {
                  const isSelected = selectedIds.includes(req.request_id);
                  const isPending = req.status === 'pending';
                  const meta = parseBatchMetadata(req.reason);

                  return (
                    <tr
                      key={req.request_id}
                      className={`transition-colors ${
                        isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(req.request_id)}
                          disabled={!isPending}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-30"
                        />
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-2">
                          <span>{req.doc_type_name || 'Certificate'}</span>
                          {meta.isBatch && (
                            <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Layers className="w-2.5 h-2.5" />
                              {meta.batchId}
                            </span>
                          )}
                          {meta.isBatch && meta.totalCopies > 1 && (
                            <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                              Copy {meta.copyIndex}/{meta.totalCopies}
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-xs text-slate-400 mt-0.5">
                          {req.request_id}
                        </div>
                        <div className="text-xs text-slate-500 truncate max-w-sm mt-0.5">
                          {meta.cleanReason}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {req.requested_by_name || 'Student'}
                        </div>
                        <div className="text-xs text-slate-400">
                          {req.requested_by}
                        </div>
                        {req.requested_by_dept && (
                          <div className="text-[11px] text-slate-500 font-medium">
                            {req.requested_by_dept}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(req.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(req.status)}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {req.tat?.expected_by ? (
                          <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {req.tat.expected_by}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not scheduled</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Link
                          to={`/admin/review/${req.request_id}`}
                          className="btn-primary inline-flex text-xs py-1.5 px-3"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* BULK SET TAT MODAL */}
      {/* ========================================================================= */}
      {showBulkTatModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Bulk Turnaround Time Target
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkTatModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Set the estimated completion date for <strong>{selectedIds.length}</strong> selected applications via the backend's native bulk TAT endpoint.
            </p>

            <form onSubmit={handleBulkTatSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expected Completion Date (India Date) <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={bulkTatDate}
                  onChange={(e) => setBulkTatDate(e.target.value)}
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institutional Note (Optional)
                </label>
                <input
                  type="text"
                  maxLength={200}
                  placeholder="e.g. Forwarded for HOD clearance..."
                  value={bulkTatNote}
                  onChange={(e) => setBulkTatNote(e.target.value)}
                  className="input-field text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkTatModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkLoading}
                  className="btn-primary text-xs flex items-center gap-2"
                >
                  {bulkLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Calendar className="w-3.5 h-3.5" />
                  )}
                  <span>Set TAT for All</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BULK APPROVE MODAL */}
      {/* ========================================================================= */}
      {showBulkApproveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Bulk Application Approval
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkApproveModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Verification Warning:</strong> Never approve without verifying student eligibility. This action will submit official approvals for <strong>{selectedIds.length}</strong> selected applications.
              </span>
            </div>

            <form onSubmit={handleBulkApproveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Approval Message to Students <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  maxLength={500}
                  value={bulkApproveMessage}
                  onChange={(e) => setBulkApproveMessage(e.target.value)}
                  className="input-field text-xs leading-relaxed resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkApproveModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Execute Bulk Approval</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BULK REJECT MODAL */}
      {/* ========================================================================= */}
      {showBulkRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Bulk Application Rejection / Return
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkRejectModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>
                <strong>Deficiency Notice:</strong> You are about to reject/return <strong>{selectedIds.length}</strong> selected applications. Please provide a clear explanation to the applicants.
              </span>
            </div>

            <form onSubmit={handleBulkRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rejection Reason / Required Actions <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  maxLength={500}
                  value={bulkRejectReason}
                  onChange={(e) => setBulkRejectReason(e.target.value)}
                  placeholder="Specify deficiency, missing documents, or institutional policy..."
                  className="input-field text-xs leading-relaxed resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkRejectModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Execute Bulk Rejection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REAL-TIME PROGRESS MODAL */}
      {/* ========================================================================= */}
      {bulkProgress && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {bulkProgress.actionType} Selected Applications
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Executing individual backend verification calls...
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between font-semibold text-slate-700">
                <span>Progress</span>
                <span>{bulkProgress.current} / {bulkProgress.total}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(bulkProgress.current / bulkProgress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EXECUTION SUMMARY RESULT MODAL */}
      {/* ========================================================================= */}
      {bulkSummaryResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {bulkSummaryResult.actionType} Complete
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Batch processing finished on the institutional backend
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 space-y-1 text-left">
              <div className="flex justify-between">
                <span>Total Applications Selected:</span>
                <span className="font-bold">{bulkSummaryResult.total}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Successfully Processed:</span>
                <span className="font-bold">{bulkSummaryResult.successCount}</span>
              </div>
              {bulkSummaryResult.failureCount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Failures / Skipped:</span>
                  <span className="font-bold">{bulkSummaryResult.failureCount}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setBulkSummaryResult(null)}
              className="btn-primary w-full py-2 text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
