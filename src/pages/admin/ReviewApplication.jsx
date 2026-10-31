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
import { validateUploadFile } from '../../utils/fileSecurity';
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
  Layers,
  Sparkles,
  QrCode,
  Award,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { AIPriorityCard } from '../../components/admin/AIPriorityCard';
import {
  issueCertificate,
  requestApplicationChanges,
  reopenApplication,
} from '../../services/certificateService';

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
  const [decisionType, setDecisionType] = useState('approve'); // approve, request_changes, reject
  const [answerMessage, setAnswerMessage] = useState('');
  const [certificateFile, setCertificateFile] = useState(null);
  const [autoGenerateQr, setAutoGenerateQr] = useState(true);
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
          'Your document request has been processed and approved. The verified digital certificate with cryptographic QR code verification is attached below.'
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
        'Your document request has been approved and issued by the administration. The verified digital certificate with cryptographic QR code verification is attached below.'
      );
    } else if (type === 'request_changes') {
      setAnswerMessage(
        'CORRECTION REQUIRED: Please update your stated purpose and upload a clear, uncropped copy of your student ID or fee receipt.'
      );
    } else if (type === 'reject') {
      setAnswerMessage(
        'REJECTED: Your application cannot be approved at this time due to institutional eligibility requirements.'
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
      alert('Please enter an administrative message or reason.');
      return;
    }

    let fileToSend = certificateFile;

    try {
      setAnswerLoading(true);

      // 1. If Requesting Changes: persist to MySQL database & approval history
      if (decisionType === 'request_changes') {
        await requestApplicationChanges(id, answerMessage.trim());
      }

      // 2. If Approving and auto-generate QR certificate is checked:
      if (decisionType === 'approve' && autoGenerateQr && !certificateFile) {
        const certResult = await issueCertificate({
          application_id: id,
          document_type_name: request.doc_type_name || 'Academic Certificate',
          student_name: request.requested_by_name || 'Student',
          student_usn: request.requested_by || 'USN',
        });
        fileToSend = new File([certResult.pdfBlob], certResult.filename, { type: 'application/pdf' });
      }

      if (fileToSend) {
        const validation = validateUploadFile(fileToSend);
        if (!validation.valid) {
          alert(validation.error);
          return;
        }
      }

      const formattedMessage =
        decisionType === 'request_changes'
          ? `[CORRECTION_REQUIRED]: ${answerMessage.trim()}`
          : answerMessage.trim();

      if (request.answer) {
        // Update existing answer
        await updateAnswer(id, {
          message: formattedMessage,
          document: fileToSend || undefined,
        });
      } else {
        // Post new answer
        await answerRequest(id, {
          message: formattedMessage,
          document: fileToSend || undefined,
        });
      }

      setCertificateFile(null);
      await fetchRequest();
      alert(
        decisionType === 'approve'
          ? 'Application Approved & Official Certificate with QR Code generated!'
          : decisionType === 'request_changes'
          ? 'Corrections requested. Student notified to edit and resubmit.'
          : 'Decision recorded successfully.'
      );
    } catch (err) {
      console.error('Failed to submit decision:', err);
      const detail = err.response?.data?.error?.message || err.message || 'Failed to submit decision.';
      alert(detail);
    } finally {
      setAnswerLoading(false);
    }
  };

  // Authorized Admin Reopen Application
  const handleReopenApplication = async () => {
    if (!window.confirm('Reopen this application? Status will revert to PENDING and the student will be permitted to edit.')) {
      return;
    }

    try {
      setActionLoading(true);
      await reopenApplication(id, 'Admin reopened application for review');
      await deleteAnswer(id);
      await fetchRequest();
      alert('Application reopened! Status is now PENDING.');
    } catch (err) {
      console.error('Failed to reopen application:', err);
      alert('Failed to reopen application.');
    } finally {
      setActionLoading(false);
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

      {/* AI Priority Assessment Banner */}
      <AIPriorityCard request={request} />

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
                <span>Student Supporting Document</span>
              </div>
              <p className="text-[11px] text-blue-700">
                Uploaded: <strong>{request.filled_form.filename}</strong>
              </p>
              <button
                type="button"
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleDecisionTypeChange('approve')}
                className={`py-3 px-3 rounded-xl text-xs font-semibold border-2 transition-all flex flex-col items-center justify-center gap-1.5 ${
                  decisionType === 'approve'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Award className="w-5 h-5 text-emerald-600" />
                <span className="font-bold">Approve Certificate</span>
                <span className="text-[10px] text-emerald-700 font-normal">Auto QR & PDF Sign</span>
              </button>

              <button
                type="button"
                onClick={() => handleDecisionTypeChange('request_changes')}
                className={`py-3 px-3 rounded-xl text-xs font-semibold border-2 transition-all flex flex-col items-center justify-center gap-1.5 ${
                  decisionType === 'request_changes'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span className="font-bold">Request Changes</span>
                <span className="text-[10px] text-amber-700 font-normal">Student must edit & resubmit</span>
              </button>

              <button
                type="button"
                onClick={() => handleDecisionTypeChange('reject')}
                className={`py-3 px-3 rounded-xl text-xs font-semibold border-2 transition-all flex flex-col items-center justify-center gap-1.5 ${
                  decisionType === 'reject'
                    ? 'border-red-600 bg-red-50 text-red-900 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="font-bold">Reject Request</span>
                <span className="text-[10px] text-red-700 font-normal">Declined with reason</span>
              </button>
            </div>

            <form onSubmit={handleAnswerSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {decisionType === 'request_changes'
                    ? 'Mandatory Correction Reason (visible to student):'
                    : 'Administrative Decision Message:'}{' '}
                  <span className="text-red-500">*</span>
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

              {/* Automatic QR Code Checkbox for Approvals */}
              {decisionType === 'approve' && (
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoGenerateQr}
                      onChange={(e) => setAutoGenerateQr(e.target.checked)}
                      className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-indigo-600" />
                      <span>Automatic QR Code & PDF Attestation Generator</span>
                    </span>
                  </label>
                  <p className="text-[11px] text-indigo-700 pl-6 leading-relaxed">
                    CampusDocs will automatically generate a cryptographically unique verification token, embed the official verification QR code into the institutional PDF, and record the attestation in the certificates ledger.
                  </p>
                </div>
              )}

              {/* Certificate File Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {decisionType === 'approve'
                    ? 'Custom Certificate Attachment (Optional - overrides auto generator)'
                    : 'Attach Supporting Form / Document (Optional)'}
                </label>
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Upload className="w-5 h-5 text-slate-400" />
                    <div>
                      <span className="text-xs font-medium text-slate-700 block">
                        {certificateFile ? certificateFile.name : 'Choose PDF document'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {certificateFile
                          ? `${(certificateFile.size / 1024).toFixed(1)} KB`
                          : 'PDF format recommended'}
                      </span>
                    </div>
                  </div>
                  <label className="btn-secondary text-xs py-1.5 px-3 cursor-pointer">
                    <span>Browse File</span>
                    <input
                      type="file"
                      accept=".pdf,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                {/* Reopen Action (If already answered) */}
                {request.answer ? (
                  <button
                    type="button"
                    onClick={handleReopenApplication}
                    disabled={actionLoading}
                    className="btn-secondary text-xs text-amber-700 hover:text-amber-800 flex items-center gap-1.5 w-full sm:w-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reopen Application for Correction</span>
                  </button>
                ) : <div />}

                <button
                  type="submit"
                  disabled={answerLoading}
                  className={`btn-primary text-xs w-full sm:w-auto ${
                    decisionType === 'reject'
                      ? 'bg-red-600 hover:bg-red-700'
                      : decisionType === 'request_changes'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {answerLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>
                        {decisionType === 'reject'
                          ? 'Confirm Rejection'
                          : decisionType === 'request_changes'
                          ? 'Send Correction Request'
                          : 'Approve & Issue Certificate'}
                      </span>
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
