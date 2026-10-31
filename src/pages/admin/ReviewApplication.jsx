import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getRequest,
  answerRequest,
  updateAnswer,
  deleteAnswer,
  setTat,
  downloadDocument,
  downloadFilledForm,
  triggerDownload,
  parseBatchMetadata
} from '../../services/documentService';
import {
  FileText,
  Clock,
  CheckCircle2,
  Calendar,
  Download,
  Upload,
  Trash2,
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileCheck2,
  User,
  Phone,
  Building,
  Mail,
  ShieldCheck,
  Send,
  XCircle,
  HelpCircle,
  Layers
} from 'lucide-react';

export const ReviewApplication = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Turnaround Time State
  const [tatDate, setTatDate] = useState('');
  const [tatNote, setTatNote] = useState('');
  const [tatLoading, setTatLoading] = useState(false);

  // Decision Form State
  const [decisionType, setDecisionType] = useState('approve'); // approve, reject, request_info
  const [answerMessage, setAnswerMessage] = useState('');
  const [certificateFile, setCertificateFile] = useState(null);
  const [answerLoading, setAnswerLoading] = useState(false);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const data = await getRequest(id);
      setRequest(data);
      if (data.tat) {
        setTatDate(data.tat.expected_by || '');
        setTatNote(data.tat.note || '');
      }
      if (data.answer) {
        setAnswerMessage(data.answer.message || '');
      } else {
        // Default prefilled message
        setAnswerMessage(
          'Your document request has been processed and approved. The verified certificate is attached below.'
        );
      }
    } catch (err) {
      console.error('Failed to load application:', err);
      setError('Failed to fetch request details from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [id]);

  // Handle Decision Type Switch & Message Template
  const handleDecisionTypeChange = (type) => {
    setDecisionType(type);
    if (type === 'approve') {
      setAnswerMessage(
        'Your document request has been approved and issued by the administration. The verified certificate is attached.'
      );
    } else if (type === 'reject') {
      setAnswerMessage(
        'REJECTED: Your application cannot be approved at this time due to institutional eligibility requirements.'
      );
    } else if (type === 'request_info') {
      setAnswerMessage(
        'Additional verification is required. Please download the attached form, fill in the necessary details, and upload it back to this application.'
      );
    }
  };

  // Submit TAT Update
  const handleTatSubmit = async (e) => {
    e.preventDefault();
    if (!tatDate) return;

    try {
      setTatLoading(true);
      await setTat(id, {
        expected_by: tatDate,
        note: tatNote.trim() || undefined,
      });
      await fetchRequest();
      alert('Target turnaround schedule saved successfully!');
    } catch (err) {
      console.error('Failed to update TAT:', err);
      const detail = err.response?.data?.error?.message || 'Failed to update turnaround time.';
      alert(detail);
    } finally {
      setTatLoading(false);
    }
  };

  // Submit Answer / Decision
  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    if (!answerMessage.trim()) {
      alert('Please enter an administrative message.');
      return;
    }

    try {
      setAnswerLoading(true);
      if (request.answer) {
        // Update existing answer
        await updateAnswer(id, {
          message: answerMessage.trim(),
          document: certificateFile || undefined,
        });
      } else {
        // Post new answer
        await answerRequest(id, {
          message: answerMessage.trim(),
          document: certificateFile || undefined,
        });
      }

      setCertificateFile(null);
      await fetchRequest();
      alert('Decision submitted successfully!');
    } catch (err) {
      console.error('Failed to submit answer:', err);
      const detail = err.response?.data?.error?.message || 'Failed to submit decision.';
      alert(detail);
    } finally {
      setAnswerLoading(false);
    }
  };

  // Delete Answer / Revert to Pending
  const handleDeleteAnswer = async () => {
    if (!window.confirm('Are you sure you want to revert this application back to Pending?')) return;

    try {
      setActionLoading(true);
      await deleteAnswer(id);
      await fetchRequest();
      alert('Answer removed. Application returned to Pending review.');
    } catch (err) {
      console.error('Failed to remove answer:', err);
      alert('Failed to remove answer.');
    } finally {
      setActionLoading(false);
    }
  };

  // Download Student's Uploaded Filled Form
  const handleDownloadStudentForm = async () => {
    try {
      setActionLoading(true);
      const res = await downloadFilledForm(id);
      const filename = request.filled_form?.filename || 'student_form.pdf';
      triggerDownload(res.data, filename);
    } catch (err) {
      console.error('Failed to download student form:', err);
      alert('Unable to download student submission.');
    } finally {
      setActionLoading(false);
    }
  };

  // Download Existing Issued Certificate
  const handleDownloadCertificate = async () => {
    try {
      setActionLoading(true);
      const res = await downloadDocument(id);
      const filename = request.document?.filename || 'issued_document.pdf';
      triggerDownload(res.data, filename);
    } catch (err) {
      console.error('Failed to download document:', err);
      alert('Unable to download certificate.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-navy-900" />
        <span className="text-xs text-slate-500 font-medium">Loading evaluation dossier...</span>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-600 border border-red-200">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Application Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'This application record could not be loaded.'}</p>
        <Link to="/admin/applications" className="btn-primary inline-flex text-xs">
          Return to All Applications
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Top Header */}
      <div>
        <button
          onClick={() => navigate('/admin/applications')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Applications Directory</span>
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Review Application: {request.doc_type_name || 'Document'}
              </h1>
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-medium">
                {request.request_id}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Submitted on {new Date(request.created_at).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                request.status === 'pending'
                  ? 'bg-amber-100 text-amber-800'
                  : request.status === 'answered'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              Status: {request.status.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Student Dossier & Request Reason */}
        <div className="space-y-6 lg:col-span-1">
          {/* Student Profile Card */}
          <div className="card space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <User className="w-4 h-4 text-navy-900" />
              <span>Student Dossier</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Applicant Name</span>
                <span className="font-semibold text-slate-800 text-sm">
                  {request.requested_by_name || 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Institutional Email</span>
                <span className="font-mono text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {request.requested_by}
                </span>
              </div>

              {request.requested_by_phone_number && (
                <div>
                  <span className="text-slate-400 block mb-0.5">Contact Number</span>
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {request.requested_by_phone_number}
                  </span>
                </div>
              )}

              {request.requested_by_dept && (
                <div>
                  <span className="text-slate-400 block mb-0.5">Department</span>
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    {request.requested_by_dept}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Turnaround Time Scheduler */}
          <div className="card space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Turnaround Schedule</span>
            </div>

            <form onSubmit={handleTatSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Completion Date
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={tatDate}
                  onChange={(e) => setTatDate(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Optional Status Note
                </label>
                <input
                  type="text"
                  maxLength={500}
                  value={tatNote}
                  onChange={(e) => setTatNote(e.target.value)}
                  placeholder="e.g. Awaiting Dean signature"
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={tatLoading}
                className="btn-secondary w-full text-xs"
              >
                {tatLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Save Target Date</span>
                )}
              </button>
            </form>
          </div>

          {/* Student Uploaded Form (If available) */}
          {request.filled_form && (
            <div className="card p-4 bg-blue-50/50 border-blue-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                <FileText className="w-4 h-4 text-blue-700" />
                <span>Student Uploaded Document</span>
              </div>
              <p className="text-[11px] text-blue-700">
                The student has uploaded a completed form: <strong>{request.filled_form.filename}</strong>
              </p>
              <button
                onClick={handleDownloadStudentForm}
                disabled={actionLoading}
                className="btn-primary w-full text-xs py-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Student Submission</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Statement of Need & Decision Workspace */}
        <div className="space-y-6 lg:col-span-2">
          {/* Stated Purpose & Request Details */}
          {(() => {
            const meta = parseBatchMetadata(request.reason);
            return (
              <div className="card space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Student Statement of Need
                  </h2>
                  {meta.isBatch && (
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Batch: {meta.batchId}</span>
                      {meta.totalCopies > 1 && (
                        <span>(Copy {meta.copyIndex} of {meta.totalCopies})</span>
                      )}
                    </span>
                  )}
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {meta.cleanReason}
                </div>
              </div>
            );
          })()}

          {/* Existing Decision / Issued Certificate Info */}
          {request.answer && (
            <div className="card border-l-4 border-l-emerald-600 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Current Issued Response</h3>
                  <span className="text-[11px] text-slate-400">
                    By {request.answer.answered_by_name} on{' '}
                    {new Date(request.answer.answered_at).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={handleDeleteAnswer}
                  disabled={actionLoading}
                  className="btn-danger text-xs py-1 px-2.5"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Revert Decision</span>
                </button>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl text-xs text-slate-700 leading-relaxed">
                {request.answer.message}
              </div>

              {request.document && (
                <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-medium text-slate-800 truncate">
                      {request.document.filename}
                    </span>
                  </div>
                  <button
                    onClick={handleDownloadCertificate}
                    className="btn-secondary text-xs py-1 px-2.5"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Decision Form Workspace */}
          <div className="card space-y-6 shadow-md border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {request.answer ? 'Update Application Decision' : 'Process & Evaluate Application'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Issue an approval certificate, request missing details, or reject the application
              </p>
            </div>

            {/* Decision Mode Selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDecisionTypeChange('approve')}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                  decisionType === 'approve'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Approve & Issue</span>
              </button>

              <button
                type="button"
                onClick={() => handleDecisionTypeChange('reject')}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                  decisionType === 'reject'
                    ? 'border-red-600 bg-red-50 text-red-900 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <XCircle className="w-4 h-4 text-red-600" />
                <span>Reject Request</span>
              </button>

              <button
                type="button"
                onClick={() => handleDecisionTypeChange('request_info')}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                  decisionType === 'request_info'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>Request Info / Form</span>
              </button>
            </div>

            <form onSubmit={handleAnswerSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Administrative Decision Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  maxLength={2000}
                  value={answerMessage}
                  onChange={(e) => setAnswerMessage(e.target.value)}
                  placeholder="Enter message visible to the student..."
                  className="input-field leading-relaxed"
                />
              </div>

              {/* Certificate File Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Attach Official Document / Certificate (Optional)
                </label>
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Upload className="w-5 h-5 text-slate-400" />
                    <div>
                      <span className="text-xs font-medium text-slate-700 block">
                        {certificateFile ? certificateFile.name : 'Choose PDF or Word document'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {certificateFile
                          ? `${(certificateFile.size / 1024).toFixed(1)} KB`
                          : 'Max size determined by server'}
                      </span>
                    </div>
                  </div>
                  <label className="btn-secondary text-xs py-1.5 px-3 cursor-pointer">
                    <span>Browse File</span>
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={answerLoading}
                  className={`btn-primary text-xs ${
                    decisionType === 'reject'
                      ? 'bg-red-600 hover:bg-red-700'
                      : decisionType === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-navy-900 hover:bg-navy-800'
                  }`}
                >
                  {answerLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit {decisionType === 'reject' ? 'Rejection' : 'Decision'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
