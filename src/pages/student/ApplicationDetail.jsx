import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getRequest,
  withdrawRequest,
  acknowledgeRequest,
  downloadDocument,
  downloadFilledForm,
  uploadFilledForm,
  deleteFilledForm,
  triggerDownload,
  parseBatchMetadata
} from '../../services/documentService';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  Upload,
  Trash2,
  Check,
  Calendar,
  Building,
  ArrowLeft,
  Loader2,
  FileCheck,
  FileWarning,
  Layers
} from 'lucide-react';

export const ApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Withdraw Modal State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('');

  // Filled Form Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const data = await getRequest(id);
      setRequest(data);
    } catch (err) {
      console.error('Failed to load request:', err);
      setError('Failed to load application details. It may have been withdrawn or does not exist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [id]);

  // Handle Withdrawal (Hard Delete)
  const handleWithdrawConfirm = async () => {
    try {
      setActionLoading(true);
      await withdrawRequest(id);
      setShowWithdrawModal(false);
      navigate('/student/applications');
    } catch (err) {
      console.error('Failed to withdraw application:', err);
      const detail = err.response?.data?.error?.message || 'Failed to withdraw application.';
      alert(detail);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Acknowledge
  const handleAcknowledge = async () => {
    try {
      setActionLoading(true);
      await acknowledgeRequest(id);
      await fetchRequestDetails();
    } catch (err) {
      console.error('Failed to acknowledge request:', err);
      const detail = err.response?.data?.error?.message || 'Failed to acknowledge receipt.';
      alert(detail);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Download Certificate
  const handleDownloadCertificate = async () => {
    try {
      setActionLoading(true);
      const res = await downloadDocument(id);
      const filename = request.document?.filename || `${request.doc_type_name || 'document'}.pdf`;
      triggerDownload(res.data, filename);
    } catch (err) {
      console.error('Failed to download document:', err);
      alert('Unable to download certificate. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Download Student Filled Form
  const handleDownloadFilled = async () => {
    try {
      setActionLoading(true);
      const res = await downloadFilledForm(id);
      const filename = request.filled_form?.filename || 'filled_form.pdf';
      triggerDownload(res.data, filename);
    } catch (err) {
      console.error('Failed to download filled form:', err);
      alert('Unable to download the filled form.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Upload Filled Form
  const handleUploadForm = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setUploadLoading(true);
      await uploadFilledForm(id, selectedFile);
      setSelectedFile(null);
      await fetchRequestDetails();
    } catch (err) {
      console.error('Failed to upload form:', err);
      const detail = err.response?.data?.error?.message || 'Failed to upload form.';
      alert(detail);
    } finally {
      setUploadLoading(false);
    }
  };

  // Handle Delete Filled Form
  const handleDeleteFilled = async () => {
    if (!window.confirm('Are you sure you want to remove your uploaded filled form?')) return;
    try {
      setActionLoading(true);
      await deleteFilledForm(id);
      await fetchRequestDetails();
    } catch (err) {
      console.error('Failed to remove form:', err);
      alert('Failed to remove filled form.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-navy-900" />
        <span className="text-xs text-slate-500 font-medium">Loading application status...</span>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-600 border border-red-200">
          <FileWarning className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Application Unavailable</h2>
        <p className="text-xs text-slate-500">{error || 'This application record was not found.'}</p>
        <Link to="/student/applications" className="btn-primary inline-flex text-xs">
          Return to My Applications
        </Link>
      </div>
    );
  }

  const isPending = request.status === 'pending';
  const isAnswered = request.status === 'answered';
  const isAcknowledged = request.status === 'acknowledged';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/student/applications')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to My Applications</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {request.doc_type_name || 'Document Request'}
            </h1>
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-medium">
              {request.request_id}
            </span>
          </div>
        </div>

        {/* Withdrawal Action (Only for pending requests) */}
        {isPending && (
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="btn-danger text-xs self-start sm:self-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>Withdraw Application</span>
          </button>
        )}
      </div>

      {/* Visual Lifecycle Progression Timeline */}
      <div className="card p-6">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">
          Application Progress Tracker
        </h2>
        <div className="relative">
          {/* Connector Line */}
          <div className="hidden sm:block absolute top-1/2 left-8 right-8 -translate-y-1/2 h-1 bg-slate-200 -z-0">
            <div
              className={`h-full bg-navy-900 transition-all duration-500 ${
                isPending ? 'w-1/3' : isAnswered ? 'w-2/3' : 'w-full'
              }`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
            {/* Step 1: Submitted */}
            <div className="flex sm:flex-col items-center gap-3 sm:text-center">
              <div className="w-10 h-10 rounded-full bg-navy-900 text-white flex items-center justify-center shadow-md">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Submitted</span>
                <span className="text-[11px] text-slate-500">
                  {new Date(request.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Step 2: Under Review / Answered */}
            <div className="flex sm:flex-col items-center gap-3 sm:text-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all ${
                  isAnswered || isAcknowledged
                    ? 'bg-navy-900 text-white'
                    : 'bg-amber-500 text-white animate-pulse'
                }`}
              >
                {isAnswered || isAcknowledged ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Clock className="w-5 h-5" />
                )}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  {isAnswered || isAcknowledged ? 'Decision Issued' : 'Under Review'}
                </span>
                <span className="text-[11px] text-slate-500">
                  {request.answer
                    ? new Date(request.answer.answered_at).toLocaleDateString()
                    : request.tat?.expected_by
                    ? `Target: ${request.tat.expected_by}`
                    : 'Administrative review in progress'}
                </span>
              </div>
            </div>

            {/* Step 3: Acknowledged / Complete */}
            <div className="flex sm:flex-col items-center gap-3 sm:text-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all ${
                  isAcknowledged
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Completed</span>
                <span className="text-[11px] text-slate-500">
                  {request.acknowledged_at
                    ? new Date(request.acknowledged_at).toLocaleDateString()
                    : 'Pending student confirmation'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Target Turnaround Time Banner (If scheduled by admin) */}
      {request.tat && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
          <Calendar className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-xs font-bold text-blue-900">
              Scheduled Completion Target: {request.tat.expected_by}
            </div>
            {request.tat.note && (
              <p className="text-xs text-blue-800 leading-relaxed">
                <strong>Administrative Note:</strong> {request.tat.note}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Application Details Summary */}
      <div className="card space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900">Application Information</h2>
          <p className="text-xs text-slate-500 mt-0.5">Details submitted by you</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-400 block mb-1">Applicant Name</span>
            <span className="font-semibold text-slate-800">{request.requested_by_name}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-400 block mb-1">Registered Email</span>
            <span className="font-semibold text-slate-800">{request.requested_by}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-400 block mb-1">Submission Date & Time</span>
            <span className="font-semibold text-slate-800">
              {new Date(request.created_at).toLocaleString()}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-400 block mb-1">Last Status Update</span>
            <span className="font-semibold text-slate-800">
              {new Date(request.updated_at).toLocaleString()}
            </span>
          </div>
        </div>

        {(() => {
          const meta = parseBatchMetadata(request.reason);
          return (
            <div className="space-y-3">
              {meta.isBatch && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>
                      Part of Coordinated Bulk Request: <strong className="font-mono">{meta.batchId}</strong>
                    </span>
                  </div>
                  {meta.totalCopies > 1 && (
                    <span className="font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      Copy {meta.copyIndex} of {meta.totalCopies}
                    </span>
                  )}
                </div>
              )}
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Stated Purpose & Need
                </span>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {meta.cleanReason}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Administrative Answer Section */}
      {request.answer && (
        <div className="card border-l-4 border-l-navy-900 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Administration Response</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Answered by {request.answer.answered_by_name || 'Office Staff'} on{' '}
                {new Date(request.answer.answered_at).toLocaleString()}
              </p>
            </div>
            <span className="badge-answered text-xs">Answered</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
            {request.answer.message}
          </div>

          {/* Certificate Download Component (If document was attached) */}
          {request.document && (
            <div className="p-5 bg-navy-50/60 rounded-xl border border-navy-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-navy-900 text-white flex items-center justify-center shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-navy-950 block">
                    {request.document.filename || 'Issued Certificate'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Verified Digital Document ({(request.document.size_bytes / 1024).toFixed(1)} KB)
                  </span>
                </div>
              </div>
              <button
                onClick={handleDownloadCertificate}
                disabled={actionLoading}
                className="btn-primary text-xs py-2 px-4 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Download Verified Certificate</span>
              </button>
            </div>
          )}

          {/* Acknowledge Action (When answered and not yet acknowledged) */}
          {isAnswered && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-emerald-950 block">
                  Confirm Receipt of Document
                </span>
                <span className="text-[11px] text-emerald-700 mt-0.5 block">
                  Please acknowledge that you have reviewed the response or received your certificate.
                </span>
              </div>
              <button
                onClick={handleAcknowledge}
                disabled={actionLoading}
                className="btn-success text-xs py-2 px-4 shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Acknowledge & Complete</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Supporting Document / Filled Form Upload Section */}
      <div className="card space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Supporting Forms & Uploads</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            If required by the admin, download the template above, fill it in, and submit it below
          </p>
        </div>

        {/* Existing Uploaded Form */}
        {request.filled_form ? (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  {request.filled_form.filename}
                </span>
                <span className="text-[11px] text-slate-400">
                  Uploaded Form ({(request.filled_form.size_bytes / 1024).toFixed(1)} KB)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadFilled}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
              <button
                onClick={handleDeleteFilled}
                disabled={actionLoading}
                className="btn-danger text-xs py-1.5 px-3"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUploadForm} className="space-y-3">
            <div className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl p-6 text-center transition-all bg-slate-50/50">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <label className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer">
                <span>Select file to upload</span>
                <input
                  type="file"
                  accept=".pdf,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-slate-400 mt-1">
                Supported formats: PDF, Word (.docx), JPG, PNG
              </p>
              {selectedFile && (
                <div className="mt-3 text-xs font-semibold text-slate-800 bg-white inline-block px-3 py-1 rounded-full border border-slate-200">
                  Selected: {selectedFile.name}
                </div>
              )}
            </div>

            {selectedFile && (
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="btn-primary text-xs"
                >
                  {uploadLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading Form...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Submit Filled Form</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        )}
      </div>

      {/* Withdrawal Confirmation Dialog Modal (Hard Delete Warning) */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900">
                Confirm Permanent Application Withdrawal
              </h3>
              <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-700 text-left leading-relaxed">
                <strong>WARNING: Permanent Action</strong>
                <p className="mt-1 text-[11px]">
                  Withdrawing this application will <strong>permanently delete</strong> its entire record from the institutional portal. You will not be able to recover or view this request once deleted.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="btn-secondary flex-1"
              >
                Keep Application
              </button>
              <button
                type="button"
                onClick={handleWithdrawConfirm}
                disabled={actionLoading}
                className="btn-danger flex-1"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete Permanently</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
