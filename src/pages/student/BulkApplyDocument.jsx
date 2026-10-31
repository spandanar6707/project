import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getDocTypes,
  parseDocTypeDescription,
  submitBulkRequests
} from '../../services/documentService';
import {
  Layers,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Search,
  ShieldCheck,
  Building,
  User,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Loader2,
  FileCheck2,
  Sparkles,
  Info,
  CheckSquare,
  Square
} from 'lucide-react';

export const BulkApplyDocument = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Catalogue & Loading state
  const [docTypes, setDocTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Documents Basket: map of doc_type_id -> { docType, quantity, customPurpose }
  const [selectedDocs, setSelectedDocs] = useState({});

  // Purpose options
  const [useCommonPurpose, setUseCommonPurpose] = useState(true);
  const [commonPurpose, setCommonPurpose] = useState('');
  const [docsConfirmed, setDocsConfirmed] = useState(false);

  // Modals & Submission Flow
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(null); // { current, total, docTypeName, copyNum, totalCopies }
  const [submitResult, setSubmitResult] = useState(null); // { batchId, total, successCount, failureCount, successes, failures }
  const [errorMsg, setErrorMsg] = useState('');

  // Load active document types from backend
  useEffect(() => {
    const fetchActiveCatalogue = async () => {
      try {
        setLoading(true);
        const data = await getDocTypes({ status: 'active', limit: 100 });
        setDocTypes(data.items || []);
      } catch (err) {
        console.error('Failed to load document types:', err);
        setErrorMsg('Failed to fetch available document catalogue from the server.');
      } finally {
        setLoading(false);
      }
    };

    fetchActiveCatalogue();
  }, []);

  // Filter catalogue by search query
  const filteredDocTypes = docTypes.filter((doc) => {
    const q = searchQuery.toLowerCase();
    return (
      doc.name.toLowerCase().includes(q) ||
      (doc.description || '').toLowerCase().includes(q)
    );
  });

  // Toggle selection of a document type
  const handleToggleSelect = (doc) => {
    setSelectedDocs((prev) => {
      const copy = { ...prev };
      if (copy[doc.doc_type_id]) {
        delete copy[doc.doc_type_id];
      } else {
        copy[doc.doc_type_id] = {
          doc_type_id: doc.doc_type_id,
          name: doc.name,
          rawDoc: doc,
          quantity: 1,
          customPurpose: '',
        };
      }
      return copy;
    });
  };

  // Adjust quantity for a selected document type (1 to 5)
  const handleUpdateQuantity = (doc_type_id, delta) => {
    setSelectedDocs((prev) => {
      const current = prev[doc_type_id];
      if (!current) return prev;
      const nextQty = Math.max(1, Math.min(5, current.quantity + delta));
      return {
        ...prev,
        [doc_type_id]: { ...current, quantity: nextQty },
      };
    });
  };

  // Update individual purpose for a specific document type
  const handleUpdatePurpose = (doc_type_id, purposeText) => {
    setSelectedDocs((prev) => {
      const current = prev[doc_type_id];
      if (!current) return prev;
      return {
        ...prev,
        [doc_type_id]: { ...current, customPurpose: purposeText },
      };
    });
  };

  // Remove a document type from basket
  const handleRemove = (doc_type_id) => {
    setSelectedDocs((prev) => {
      const copy = { ...prev };
      delete copy[doc_type_id];
      return copy;
    });
  };

  // Calculations
  const selectedList = Object.values(selectedDocs);
  const totalTypesCount = selectedList.length;
  const totalCopiesCount = selectedList.reduce((sum, item) => sum + item.quantity, 0);

  // Aggregated required supporting documents across all selected types
  const aggregatedSupportingDocs = Array.from(
    new Set(
      selectedList
        .map((item) => {
          const parsed = parseDocTypeDescription(item.rawDoc.description);
          return parsed.requiredDocs;
        })
        .filter(Boolean)
        .flatMap((s) => s.split(',').map((p) => p.trim()))
        .filter((s) => s.length > 0)
    )
  );

  // Validate form readiness
  const isFormValid = () => {
    if (totalCopiesCount === 0) return false;
    if (useCommonPurpose) {
      if (!commonPurpose.trim() || commonPurpose.trim().length < 5) return false;
    } else {
      for (const item of selectedList) {
        if (!item.customPurpose.trim() || item.customPurpose.trim().length < 5) {
          return false;
        }
      }
    }
    return docsConfirmed;
  };

  // Open pre-submission summary modal
  const handleOpenSummary = (e) => {
    e.preventDefault();
    if (!isFormValid()) return;
    setErrorMsg('');
    setShowSummaryModal(true);
  };

  // Submit Bulk Request to Backend
  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    setErrorMsg('');

    // Prepare items payload with calculated purpose
    const submissionItems = selectedList.map((item) => ({
      doc_type_id: item.doc_type_id,
      name: item.name,
      quantity: item.quantity,
      purpose: useCommonPurpose ? commonPurpose.trim() : item.customPurpose.trim(),
    }));

    try {
      const result = await submitBulkRequests({
        items: submissionItems,
        onProgress: (progress) => {
          setSubmitProgress(progress);
        },
      });

      setSubmitResult(result);
    } catch (err) {
      console.error('Bulk submission failure:', err);
      setErrorMsg('An error occurred during bulk processing. Some requests may have been submitted.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-navy-100 text-navy-800">
              <Layers className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-navy-800">
              Bulk Processing
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Bulk Document Request
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Select multiple certificate categories and specify copies in a single coordinated submission
          </p>
        </div>

        <Link
          to="/student/apply"
          className="btn-secondary text-xs self-start sm:self-auto py-2 px-3.5"
        >
          <FileText className="w-4 h-4" />
          <span>Single Application</span>
        </Link>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Layout: 2 Columns (Selection Grid + Review Basket) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Available Documents Catalogue (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search certificate types..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap px-1">
              {filteredDocTypes.length} Available
            </span>
          </div>

          {/* Documents Grid */}
          {loading ? (
            <div className="card p-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p className="text-xs font-medium">Loading institutional document types...</p>
            </div>
          ) : filteredDocTypes.length === 0 ? (
            <div className="card p-12 text-center text-slate-400">
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-slate-700">No matching document types</p>
              <p className="text-xs mt-1">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredDocTypes.map((doc) => {
                const parsed = parseDocTypeDescription(doc.description);
                const isSelected = !!selectedDocs[doc.doc_type_id];
                const selectedItem = selectedDocs[doc.doc_type_id];

                return (
                  <div
                    key={doc.doc_type_id}
                    className={`card p-4 transition-all flex flex-col justify-between border ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/20 shadow-md ring-1 ring-blue-500'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      {/* Header with Title and Checkbox */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <FileText className="w-4 h-4" />
                          </div>
                          <h2 className="text-xs font-bold text-slate-900 leading-snug">
                            {doc.name}
                          </h2>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(doc)}
                          className={`p-1 rounded-md transition-colors ${
                            isSelected
                              ? 'text-blue-600 hover:text-blue-800'
                              : 'text-slate-300 hover:text-slate-600'
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-300" />
                          )}
                        </button>
                      </div>

                      {/* Description */}
                      <p className="text-[11px] text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                        {parsed.description || 'Institutional document request verified by office staff.'}
                      </p>

                      {/* Metadata: TAT & Required Documents */}
                      <div className="space-y-1 mb-3 text-[11px]">
                        {parsed.processingTime && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>Processing Time: <strong>{parsed.processingTime}</strong></span>
                          </div>
                        )}
                        {parsed.requiredDocs && (
                          <div className="flex items-start gap-1.5 text-slate-500">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">Requires: {parsed.requiredDocs}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer: Action / Stepper */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      {isSelected ? (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[11px] font-semibold text-blue-900">
                            Copies:
                          </span>
                          <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-blue-200 shadow-sm">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(doc.doc_type_id, -1)}
                              disabled={selectedItem.quantity <= 1}
                              className="p-0.5 rounded text-slate-500 hover:text-navy-950 disabled:opacity-30"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold text-navy-950 px-1.5">
                              {selectedItem.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(doc.doc_type_id, 1)}
                              disabled={selectedItem.quantity >= 5}
                              className="p-0.5 rounded text-slate-500 hover:text-navy-950 disabled:opacity-30"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(doc)}
                          className="w-full text-xs font-semibold py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-navy-900 hover:text-white text-slate-700 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Select Document</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Basket Summary, Purpose, & Submission (5 Cols) */}
        <div className="lg:col-span-5 space-y-5 sticky top-6">
          <form onSubmit={handleOpenSummary} className="card p-5 space-y-5 border-t-4 border-t-navy-900 shadow-lg">
            {/* Basket Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-navy-900" />
                <h2 className="text-sm font-bold text-slate-900">Bulk Request Summary</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-navy-100 text-navy-900">
                {totalCopiesCount} {totalCopiesCount === 1 ? 'Document' : 'Documents'} ({totalTypesCount} Types)
              </span>
            </div>

            {/* Selected Items List */}
            {selectedList.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-slate-400">
                <Layers className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                <p className="text-xs font-medium text-slate-600">No documents selected</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Check certificates on the left to build your bulk request.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {selectedList.map((item) => (
                  <div
                    key={item.doc_type_id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Quantity: <span className="font-semibold text-navy-950">{item.quantity} {item.quantity === 1 ? 'copy' : 'copies'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-xs">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.doc_type_id, -1)}
                          disabled={item.quantity <= 1}
                          className="text-slate-400 hover:text-slate-800 disabled:opacity-30"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-slate-800 px-1">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.doc_type_id, 1)}
                          disabled={item.quantity >= 5}
                          className="text-slate-400 hover:text-slate-800 disabled:opacity-30"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemove(item.doc_type_id)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Purpose Configuration */}
            {selectedList.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Purpose of Request <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseCommonPurpose(!useCommonPurpose)}
                    className="text-[11px] text-blue-600 hover:underline font-medium"
                  >
                    {useCommonPurpose ? 'Set individual purpose per document' : 'Use one common purpose'}
                  </button>
                </div>

                {useCommonPurpose ? (
                  <div>
                    <textarea
                      required
                      minLength={5}
                      maxLength={400}
                      rows={3}
                      value={commonPurpose}
                      onChange={(e) => setCommonPurpose(e.target.value)}
                      placeholder="e.g. Applying for higher education abroad and scholarship verification..."
                      className="input-field text-xs resize-none leading-relaxed"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                      <span>Minimum 5 characters</span>
                      <span>{commonPurpose.length} / 400</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedList.map((item) => (
                      <div key={item.doc_type_id} className="space-y-1">
                        <span className="text-[11px] font-semibold text-slate-700">
                          {item.name}:
                        </span>
                        <input
                          type="text"
                          required
                          minLength={5}
                          maxLength={350}
                          placeholder={`Purpose for ${item.name}...`}
                          value={item.customPurpose}
                          onChange={(e) => handleUpdatePurpose(item.doc_type_id, e.target.value)}
                          className="input-field text-xs py-1.5"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Aggregated Supporting Documents Checklist */}
            {selectedList.length > 0 && aggregatedSupportingDocs.length > 0 && (
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-2 text-xs text-blue-950">
                <div className="flex items-center gap-2 font-bold text-blue-900">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Required Supporting Documents</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  The documents you selected require the following verifications upon office review:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-blue-900 font-medium pl-1">
                  {aggregatedSupportingDocs.map((docReq, idx) => (
                    <li key={idx}>{docReq}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Confirmation Checkbox */}
            {selectedList.length > 0 && (
              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={docsConfirmed}
                  onChange={(e) => setDocsConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  I confirm that all requested documents and quantities are accurate, and I possess the required supporting credentials for verification.
                </span>
              </label>
            )}

            {/* Proceed Button */}
            <button
              type="submit"
              disabled={!isFormValid()}
              className="btn-primary w-full py-2.5 text-xs font-semibold shadow-md disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <span>Review Bulk Request ({totalCopiesCount})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 2: PRE-SUBMISSION SUMMARY MODAL */}
      {/* ========================================================================= */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-navy-50 text-navy-950 flex items-center justify-center">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Confirm Bulk Document Submission
                  </h3>
                  <p className="text-xs text-slate-500">
                    Please review your applicant details and document breakdown
                  </p>
                </div>
              </div>
            </div>

            {/* Student Details Card */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 block">Applicant Name</span>
                <span className="font-bold text-slate-800">{user?.name || 'Student'}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Roll No / USN</span>
                <span className="font-bold text-slate-800">{user?.usn || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Department</span>
                <span className="font-bold text-slate-800">{user?.dept || 'Institutional'}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Registered Email</span>
                <span className="font-bold text-slate-800 truncate block">{user?.email_id}</span>
              </div>
            </div>

            {/* Document Breakdown Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Selected Documents</span>
                <span className="text-navy-950">{totalCopiesCount} Total Certificates</span>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Document Type</th>
                      <th className="py-2 px-3 text-center">Copies</th>
                      <th className="py-2 px-3">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedList.map((item) => (
                      <tr key={item.doc_type_id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-semibold text-slate-800">
                          {item.name}
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-navy-950">
                          {item.quantity}
                        </td>
                        <td className="py-2 px-3 text-slate-600 text-[11px] truncate max-w-[200px]">
                          {useCommonPurpose ? commonPurpose : item.customPurpose}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Institutional Information Note */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Coordinated Processing:</strong> Your requests will be submitted sequentially to the institutional backend and tagged with a shared Batch ID. Each document maintains its own official verification status and individual downloadable certificate.
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowSummaryModal(false)}
                className="btn-secondary text-xs"
              >
                Back to Edit
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmSubmit}
                className="btn-primary text-xs flex items-center gap-2 px-5 py-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting Batch...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Submit Bulk Request</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: LIVE PROGRESS & SUBMISSION RESULT MODAL */}
      {/* ========================================================================= */}
      {(submitting || submitResult) && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            {!submitResult ? (
              // Live Progress Screen
              <div className="text-center space-y-4 py-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner animate-pulse">
                  <Loader2 className="w-7 h-7 animate-spin" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Submitting Bulk Document Requests
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Communicating sequentially with the institutional backend...
                  </p>
                </div>

                {submitProgress && (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between font-semibold text-slate-700">
                      <span>{submitProgress.docTypeName} {submitProgress.totalCopies > 1 ? `(Copy ${submitProgress.copyNum}/${submitProgress.totalCopies})` : ''}</span>
                      <span>{submitProgress.current} / {submitProgress.total}</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{
                          width: `${(submitProgress.current / submitProgress.total) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Finished Result Screen
              <div className="space-y-4 text-center py-2">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Bulk Request Submitted!
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Batch Tracking ID: <span className="font-mono font-bold text-navy-950">{submitResult.batchId}</span>
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 space-y-1 text-left">
                  <div className="flex justify-between">
                    <span>Total Documents Requested:</span>
                    <span className="font-bold">{submitResult.total}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Successfully Created:</span>
                    <span className="font-bold">{submitResult.successCount}</span>
                  </div>
                  {submitResult.failureCount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Failed:</span>
                      <span className="font-bold">{submitResult.failureCount}</span>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Your applications are now under review with Student Affairs. You can track progress or download approved certificates in My Applications.
                </p>

                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/student/applications')}
                    className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-2"
                  >
                    <span>View in My Applications</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
