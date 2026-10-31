import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getRequests,
  groupRequestsByBatch,
  parseBatchMetadata,
  downloadDocument,
  triggerDownload
} from '../../services/documentService';
import {
  FileText,
  Clock,
  CheckCircle2,
  Search,
  ExternalLink,
  PlusCircle,
  Loader2,
  Calendar,
  Layers,
  Download,
  AlertCircle,
  FileCheck2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const MyApplications = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, pending, answered, acknowledged
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'batches'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // desc (newest), asc (oldest)
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = { limit: 100 };
      if (activeTab !== 'all') {
        params.status = activeTab;
      }
      const data = await getRequests(params);
      setRequests(data.items || []);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [activeTab]);

  const handleDownloadCert = async (req) => {
    try {
      setDownloadingId(req.request_id);
      const response = await downloadDocument(req.request_id);
      const ext = response.headers['content-type']?.includes('pdf') ? 'pdf' : 'bin';
      const cleanName = (req.doc_type_name || 'certificate').toLowerCase().replace(/\s+/g, '_');
      triggerDownload(response.data, `${cleanName}_${req.request_id}.${ext}`);
    } catch (err) {
      console.error('Certificate download failed:', err);
      alert('Could not download document. The file may not yet be available or permission was denied.');
    } finally {
      setDownloadingId(null);
    }
  };

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

  const getBatchAggregateBadge = (status) => {
    switch (status) {
      case 'acknowledged':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            All Completed
          </span>
        );
      case 'answered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            All Answered
          </span>
        );
      case 'partially_answered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5" />
            Partially Answered
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            <Clock className="w-3.5 h-3.5" />
            Under Review
          </span>
        );
    }
  };

  // Filtered and sorted list
  const filteredRequests = requests
    .filter((req) => {
      const q = searchQuery.toLowerCase();
      const typeName = (req.doc_type_name || '').toLowerCase();
      const reqId = (req.request_id || '').toLowerCase();
      const reason = (req.reason || '').toLowerCase();
      return typeName.includes(q) || reqId.includes(q) || reason.includes(q);
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  // Group into batches and standalone
  const { batches, standalone } = groupRequestsByBatch(filteredRequests);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            My Document Applications
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track individual progress, monitor bulk requests, and download verified certificates
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link to="/student/bulk-request" className="btn-secondary text-xs shrink-0 py-2 px-3.5">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Bulk Request</span>
          </Link>
          <Link to="/student/apply" className="btn-primary text-xs shrink-0 py-2 px-3.5">
            <PlusCircle className="w-4 h-4" />
            <span>New Application</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs & View Mode Selector */}
      <div className="card space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Applications' },
              { id: 'pending', label: 'Under Review' },
              { id: 'answered', label: 'Answered / Ready' },
              { id: 'acknowledged', label: 'Completed' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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

          {/* View Mode Toggle & Sort Control */}
          <div className="flex items-center gap-3">
            {/* View Mode Toggle: Table vs Batches */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-navy-950 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Individual List ({filteredRequests.length})
              </button>
              <button
                type="button"
                onClick={() => setViewMode('batches')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                  viewMode === 'batches'
                    ? 'bg-white text-navy-950 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Bulk Batches ({batches.length})</span>
              </button>
            </div>

            {/* Sort Control */}
            <div className="flex items-center gap-1.5">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-navy-900"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
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
            placeholder="Search by Document Name, Batch ID, Application ID, or Purpose..."
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Main Content Area: Loading / Empty / Content */}
      {loading ? (
        <div className="card py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-navy-900" />
          <span className="text-xs text-slate-500 font-medium">Fetching applications from server...</span>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="card py-16 text-center px-4">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">No applications found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No applications match your search query.'
              : 'You have no applications in this status category.'}
          </p>
        </div>
      ) : viewMode === 'batches' ? (
        /* ========================================================================= */
        /* BULK BATCHES VIEW */
        /* ========================================================================= */
        <div className="space-y-4">
          {batches.length === 0 ? (
            <div className="card p-12 text-center text-slate-400">
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-slate-700">No Bulk Requests Found</p>
              <p className="text-xs text-slate-500 mt-1">
                You haven't submitted any coordinated bulk batches yet.
              </p>
              <Link
                to="/student/bulk-request"
                className="btn-primary inline-flex text-xs mt-4 py-2 px-4"
              >
                <Layers className="w-4 h-4" />
                <span>Create Bulk Request</span>
              </Link>
            </div>
          ) : (
            batches.map((batch) => {
              const completedCount = batch.statusSummary.answered + batch.statusSummary.acknowledged;
              const percent = Math.round((completedCount / batch.totalCount) * 100);

              return (
                <div
                  key={batch.batchId}
                  className="card p-5 space-y-4 border-l-4 border-l-blue-600 shadow-md"
                >
                  {/* Batch Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-navy-950 bg-slate-100 px-2 py-0.5 rounded">
                          {batch.batchId}
                        </span>
                        {getBatchAggregateBadge(batch.aggregateStatus)}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                        <span>Submitted {new Date(batch.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}</span>
                        <span>•</span>
                        <span><strong>{batch.totalCount}</strong> Certificates Included</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="sm:text-right min-w-[160px]">
                      <div className="text-xs font-bold text-slate-800 mb-1">
                        {completedCount} of {batch.totalCount} Completed ({percent}%)
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Batch Items Table */}
                  <div className="border border-slate-200/80 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">Document</th>
                          <th className="py-2.5 px-3">Copy / Item</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Target TAT</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {batch.items.map((item) => (
                          <tr key={item.request_id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-900">
                                {item.doc_type_name || 'Certificate'}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono truncate max-w-xs mt-0.5">
                                {item.batchMeta.cleanReason}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-slate-700">
                              <span className="font-medium bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[11px]">
                                Copy {item.batchMeta.copyIndex} of {item.batchMeta.totalCopies}
                              </span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              {getStatusBadge(item.status)}
                            </td>
                            <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                              {item.tat?.expected_by ? (
                                <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  {item.tat.expected_by}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Not scheduled</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right whitespace-nowrap space-x-1.5">
                              {item.answer?.has_document && (
                                <button
                                  type="button"
                                  onClick={() => handleDownloadCert(item)}
                                  disabled={downloadingId === item.request_id}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200 transition-colors"
                                >
                                  {downloadingId === item.request_id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Download className="w-3 h-3 text-emerald-600" />
                                  )}
                                  <span>Download</span>
                                </button>
                              )}
                              <Link
                                to={`/student/applications/${item.request_id}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-navy-900 hover:text-white text-slate-700 font-semibold text-[11px] transition-colors"
                              >
                                <span>Detail</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* INDIVIDUAL APPLICATIONS TABLE VIEW */
        /* ========================================================================= */
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Application ID</th>
                  <th className="py-3.5 px-4">Document Type</th>
                  <th className="py-3.5 px-4">Submission Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">TAT Target</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredRequests.map((req) => {
                  const meta = parseBatchMetadata(req.reason);

                  return (
                    <tr key={req.request_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600 font-semibold">
                        {req.request_id}
                        {meta.isBatch && (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                              <Layers className="w-2.5 h-2.5" />
                              {meta.batchId}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-2">
                          <span>{req.doc_type_name || 'Certificate'}</span>
                          {meta.isBatch && meta.totalCopies > 1 && (
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                              Copy {meta.copyIndex} of {meta.totalCopies}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 truncate max-w-xs mt-0.5">
                          {meta.cleanReason}
                        </div>
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
                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                        {req.answer?.has_document && (
                          <button
                            type="button"
                            onClick={() => handleDownloadCert(req)}
                            disabled={downloadingId === req.request_id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition-colors"
                          >
                            {downloadingId === req.request_id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                            <span>Download</span>
                          </button>
                        )}
                        <Link
                          to={`/student/applications/${req.request_id}`}
                          className="btn-primary inline-flex text-xs py-1.5 px-3"
                        >
                          <span>Details</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
