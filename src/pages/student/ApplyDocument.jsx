import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getDocTypes,
  createRequest,
  parseDocTypeDescription,
} from '../../services/documentService';
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  Send,
  Loader2,
  Info,
  ArrowLeft,
  Clock,
  FileCheck,
  Search,
  Check,
} from 'lucide-react';

export const ApplyDocument = () => {
  const [docTypes, setDocTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [reason, setReason] = useState('');
  const [searchDoc, setSearchDoc] = useState('');
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  const fetchActiveDocTypes = async () => {
    try {
      setLoadingTypes(true);
      setError('');
      // Strictly query active document types only
      const res = await getDocTypes({ status: 'active', limit: 100 });
      const activeItems = res.items || [];
      setDocTypes(activeItems);
      if (activeItems.length > 0) {
        setSelectedType(activeItems[0].doc_type_id);
      }
    } catch (err) {
      console.error('Failed to load document types:', err);
      const detail =
        err.response?.data?.error?.message ||
        'Failed to fetch available document catalogue from the server.';
      setError(detail);
    } finally {
      setLoadingTypes(false);
    }
  };

  useEffect(() => {
    fetchActiveDocTypes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedType) {
      setError('Please select a document type from the catalogue.');
      return;
    }

    if (reason.trim().length < 5) {
      setError('Please enter a statement of purpose with at least 5 characters.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await createRequest({
        doc_type_id: selectedType,
        reason: reason.trim(),
      });

      setSuccess('Application submitted successfully! Redirecting to tracker...');
      setTimeout(() => {
        navigate(`/student/applications/${res.request_id}`);
      }, 1200);
    } catch (err) {
      console.error('Failed to submit application:', err);
      const detail =
        err.response?.data?.error?.message ||
        err.response?.data?.detail ||
        'Failed to submit your application. Please check your inputs and try again.';
      setError(detail);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDocObj = docTypes.find((d) => d.doc_type_id === selectedType);
  const parsedSelected = selectedDocObj ? parseDocTypeDescription(selectedDocObj.description) : null;

  // Filter doc types by search input
  const filteredDocTypes = docTypes.filter((d) => {
    const q = searchDoc.toLowerCase();
    const nameMatch = (d.name || '').toLowerCase().includes(q);
    const descMatch = (d.description || '').toLowerCase().includes(q);
    return nameMatch || descMatch;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </button>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Apply for Institutional Document
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Select a verified document from the college catalogue and submit your issuance application
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-xs text-red-700 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Notice:</span>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-xs text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">{success}</span>
            <p className="mt-0.5">Opening your application tracker...</p>
          </div>
        </div>
      )}

      {loadingTypes ? (
        <div className="card py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-navy-900" />
          <span className="text-xs text-slate-500 font-medium">
            Fetching active catalogue documents from server...
          </span>
        </div>
      ) : docTypes.length === 0 ? (
        <div className="card py-16 text-center space-y-4">
          <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-600 border border-amber-200">
            <Info className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-800">No Documents Currently Available</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Your college administration has not yet activated any document types in the portal catalogue. Document types must be created and set to <strong>Active</strong> in the Admin Document Catalogue to appear here.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={fetchActiveDocTypes}
              className="btn-secondary text-xs inline-flex mx-auto"
            >
              Check for Updated Catalogue
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Choose Document */}
          <div className="card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Step 1: Choose Document Type <span className="text-red-500">*</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select the certificate you require from the {docTypes.length} active types
                </p>
              </div>

              {/* Quick Search */}
              {docTypes.length > 4 && (
                <div className="relative w-full sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={searchDoc}
                    onChange={(e) => setSearchDoc(e.target.value)}
                    placeholder="Search documents..."
                    className="input-field pl-8 text-xs py-1.5"
                  />
                </div>
              )}
            </div>

            {/* Document Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {filteredDocTypes.map((type) => {
                const isSelected = selectedType === type.doc_type_id;
                const parsed = parseDocTypeDescription(type.description);

                return (
                  <div
                    key={type.doc_type_id}
                    onClick={() => setSelectedType(type.doc_type_id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-navy-900 bg-navy-50/50 shadow-md ring-1 ring-navy-900'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <FileText
                            className={`w-4 h-4 shrink-0 ${
                              isSelected ? 'text-navy-900' : 'text-slate-400'
                            }`}
                          />
                          <span className="text-sm font-bold text-slate-900 leading-tight">
                            {type.name}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-navy-900 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      {parsed.description && (
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {parsed.description}
                        </p>
                      )}
                    </div>

                    {/* Metadata tags */}
                    <div className="pt-2 mt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{parsed.processingTime || '1-2 days'}</span>
                      </span>
                      {parsed.requiredDocs && (
                        <span className="text-blue-700 font-medium">Docs Required</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Document Detailed Preview & Guidelines */}
          {selectedDocObj && parsedSelected && (
            <div className="p-5 bg-gradient-to-r from-blue-50/80 to-slate-50 border border-blue-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900">
                <FileCheck className="w-4 h-4 text-blue-700" />
                <span>Selected: {selectedDocObj.name}</span>
              </div>

              {parsedSelected.description && (
                <p className="text-xs text-slate-700 leading-relaxed">
                  {parsedSelected.description}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                {parsedSelected.requiredDocs && (
                  <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-xs">
                    <span className="font-bold text-slate-800 block text-[11px] mb-0.5">
                      Checklist / Documents to Prepare:
                    </span>
                    <span className="text-slate-600 text-[11px] leading-relaxed">
                      {parsedSelected.requiredDocs}
                    </span>
                  </div>
                )}

                <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-xs flex items-center gap-2.5">
                  <Clock className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 block text-[11px]">
                      Expected Institutional Processing Time:
                    </span>
                    <span className="text-slate-600 text-[11px]">
                      {parsedSelected.processingTime || '1-2 business days'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Statement of Need */}
          <div className="card space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-bold text-slate-900">
                  Step 2: Purpose & Statement of Need <span className="text-red-500">*</span>
                </h2>
                <span className="text-[11px] text-slate-400 font-mono">
                  {reason.length} / 1000 characters
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Clearly state why you require this document. This helps college administration review and endorse your request promptly.
              </p>
            </div>

            <textarea
              rows={4}
              required
              minLength={5}
              maxLength={1000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Applying for an education loan with SBI / Applying for passport appointment / Submitting for campus recruitment drive..."
              className="input-field leading-relaxed resize-y"
            />

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2 leading-relaxed">
              <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <span>
                After submission, your request will appear in the college administration review queue. If specific forms are required, the office staff will attach them directly to your application ticket.
              </span>
            </div>
          </div>

          {/* Submission Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/student/dashboard')}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedType || reason.trim().length < 5}
              className="btn-primary text-xs py-2.5 px-5"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Application...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Application to Office</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
