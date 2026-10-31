import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getDocTypes,
  createDocType,
  updateDocType,
  deleteDocType,
  formatDocTypeDescription,
  parseDocTypeDescription,
  INITIAL_CATALOGUE_PRESETS,
} from '../../services/documentService';
import {
  Layers,
  PlusCircle,
  Archive,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Loader2,
  Sparkles,
  Info,
  Search,
  Edit3,
  Clock,
  FileCheck,
  Check,
  X,
  AlertTriangle,
  RotateCcw,
  FileText,
  Table,
  LayoutGrid,
  Shield,
  KeyRound,
  UserCheck,
  ArrowRight,
} from 'lucide-react';

export const ManageDocTypes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [docTypes, setDocTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, archived
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('table'); // table or grid
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form State (Add / Edit)
  const [editingDocType, setEditingDocType] = useState(null);
  const [targetDeleteDoc, setTargetDeleteDoc] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    requiredDocs: '',
    processingTime: '1-2 business days',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Notifications
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchTypes = async () => {
    try {
      setLoading(true);
      const params = { limit: 100 };
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      const data = await getDocTypes(params);
      setDocTypes(data.items || []);
    } catch (err) {
      console.error('Failed to load doc types:', err);
      const msg = err.response?.data?.error?.message || 'Failed to fetch catalogue from server.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, [filterStatus]);

  // Open Add Modal with empty form
  const handleOpenAdd = () => {
    setFormData({
      name: '',
      description: '',
      requiredDocs: '',
      processingTime: '1-2 business days',
    });
    setFormError('');
    setShowAddModal(true);
  };

  // Open Add Modal pre-populated with an individual suggestion
  const handleSelectSuggestion = (preset) => {
    setFormData({
      name: preset.name,
      description: preset.description,
      requiredDocs: preset.requiredDocs,
      processingTime: preset.processingTime,
    });
    setFormError('');
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (docType) => {
    const parsed = parseDocTypeDescription(docType.description);
    setEditingDocType(docType);
    setFormData({
      name: docType.name,
      description: parsed.description,
      requiredDocs: parsed.requiredDocs,
      processingTime: parsed.processingTime || '1-2 business days',
    });
    setFormError('');
    setShowEditModal(true);
  };

  // Submit Add Document Type
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (formData.name.trim().length < 3) {
      setFormError('Document name must be at least 3 characters.');
      return;
    }

    try {
      setSubmitting(true);
      const formattedDesc = formatDocTypeDescription(
        formData.description,
        formData.requiredDocs,
        formData.processingTime
      );

      await createDocType({
        name: formData.name.trim(),
        description: formattedDesc,
      });

      setShowAddModal(false);
      showToast(`Document "${formData.name.trim()}" added to catalogue successfully!`);
      await fetchTypes();
    } catch (err) {
      console.error('Failed to add document type:', err);
      let detail =
        err.response?.data?.error?.message ||
        err.response?.data?.detail ||
        'Failed to save document type to backend.';

      if (err.response?.status === 409) {
        detail = 'A document type with this name already exists in your institution catalogue (it may be archived).';
      } else if (err.response?.status === 403) {
        detail = `Backend Authorization Restriction (HTTP 403): Your account role is "${user?.role || 'admin'}". The backend endpoint POST /api/v1/docdesk/doc-types strictly requires an "office_staff" account (Student Affairs). Please sign in as a Student Affairs Staff member to persist changes.`;
      }
      setFormError(detail);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit Document Type
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingDocType) return;
    setFormError('');

    if (formData.name.trim().length < 3) {
      setFormError('Document name must be at least 3 characters.');
      return;
    }

    try {
      setSubmitting(true);
      const formattedDesc = formatDocTypeDescription(
        formData.description,
        formData.requiredDocs,
        formData.processingTime
      );

      await updateDocType(editingDocType.doc_type_id, {
        name: formData.name.trim(),
        description: formattedDesc,
      });

      setShowEditModal(false);
      setEditingDocType(null);
      showToast(`Document "${formData.name.trim()}" updated successfully!`);
      await fetchTypes();
    } catch (err) {
      console.error('Failed to update document type:', err);
      let detail =
        err.response?.data?.error?.message ||
        err.response?.data?.detail ||
        'Failed to update document type.';
      if (err.response?.status === 403) {
        detail = `Backend Authorization Restriction (HTTP 403): Your account role is "${user?.role || 'admin'}". Modifying document types requires an "office_staff" account (Student Affairs).`;
      }
      setFormError(detail);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Active / Deactivate (Archive) Status
  const handleToggleStatus = async (docType) => {
    const nextStatus = docType.status === 'active' ? 'archived' : 'active';
    try {
      await updateDocType(docType.doc_type_id, { status: nextStatus });
      showToast(
        `Document "${docType.name}" is now ${
          nextStatus === 'active' ? 'Active & visible to students' : 'Deactivated / Archived'
        }.`
      );
      await fetchTypes();
    } catch (err) {
      console.error('Failed to update status:', err);
      const detail = err.response?.data?.error?.message || 'Failed to update document status.';
      showToast(detail, 'error');
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!targetDeleteDoc) return;
    try {
      setSubmitting(true);
      await deleteDocType(targetDeleteDoc.doc_type_id);
      setShowDeleteModal(false);
      showToast(`Document "${targetDeleteDoc.name}" deleted from backend catalogue.`);
      setTargetDeleteDoc(null);
      await fetchTypes();
    } catch (err) {
      console.error('Failed to delete document type:', err);
      const detail =
        err.response?.data?.error?.message ||
        'Cannot delete this document type because existing applications reference it. Deactivate it instead to preserve audit history.';
      showToast(detail, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics calculation
  const totalCount = docTypes.length;
  const activeCount = docTypes.filter((d) => d.status === 'active').length;
  const inactiveCount = docTypes.filter((d) => d.status === 'archived').length;

  // Search filter
  const filteredDocTypes = docTypes.filter((d) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = (d.name || '').toLowerCase().includes(q);
    const descMatch = (d.description || '').toLowerCase().includes(q);
    const idMatch = (d.doc_type_id || '').toLowerCase().includes(q);
    return nameMatch || descMatch || idMatch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-semibold border transition-all animate-in fade-in slide-in-from-top-4 ${
            toastMessage.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-200'
              : 'bg-emerald-50 text-emerald-900 border-emerald-200'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-navy-100 text-navy-800">
              <Layers className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-navy-800">
              Admin Dashboard
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Document Catalogue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure certificate categories, required supporting documents, and processing times
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className={`btn-secondary text-xs py-2 px-3.5 ${
              showSuggestions ? 'bg-slate-100 text-slate-900 border-slate-300' : ''
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{showSuggestions ? 'Hide Suggestions' : 'Suggested Documents'}</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="btn-primary text-xs py-2 px-4 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Document</span>
          </button>
        </div>
      </div>

      {/* RBAC Status & Institutional Guidance Banner */}
      {user?.role === 'office_staff' ? (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900 shadow-sm">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold">Student Affairs Office Staff Session: </span>
              <span className="text-emerald-800 font-medium">{user?.email_id} ({user?.dept || 'Student Affairs'})</span>
              <span className="text-emerald-700 ml-1.5 hidden md:inline">— Authorized to create, modify, and deactivate document types.</span>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 self-start sm:self-auto shrink-0">
            Write Permissions Active
          </span>
        </div>
      ) : (
        <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-sm">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-950 flex items-center gap-2">
                <span>System Administrator Session (Role: admin)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 uppercase tracking-wider">
                  Catalogue Read-Only
                </span>
              </div>
              <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                The institutional backend enforces Role-Based Access Control (RBAC): creating or editing document types (<code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-900">POST /api/v1/docdesk/doc-types</code>) is strictly delegated to the <strong>Office Staff (Student Affairs)</strong> role. System Admins manage infrastructure and users. To add or update document types, sign in with your institution's Student Affairs Staff account.
              </p>
            </div>
          </div>
          <Link
            to="/admin/users"
            className="self-start sm:self-center shrink-0 px-3.5 py-1.5 rounded-lg bg-amber-900 text-white font-semibold text-xs hover:bg-amber-800 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>User Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 border-l-4 border-l-navy-900">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Total Catalogue Types
          </span>
          <div className="text-2xl font-bold text-slate-900">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : totalCount}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Configured in database</span>
        </div>

        <div className="card p-4 border-l-4 border-l-emerald-600">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Active Documents
          </span>
          <div className="text-2xl font-bold text-emerald-700">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : activeCount}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Visible to student applications</span>
        </div>

        <div className="card p-4 border-l-4 border-l-amber-500">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Inactive / Deactivated
          </span>
          <div className="text-2xl font-bold text-amber-700">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : inactiveCount}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Hidden from student requests</span>
        </div>
      </div>

      {/* Suggested Documents Section (Individual Addition) */}
      {showSuggestions && (
        <div className="p-5 bg-gradient-to-r from-amber-50/70 via-slate-50 to-blue-50/60 border border-amber-200/80 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Predefined Institutional Suggestions (Add Individually)
              </h2>
            </div>
            <span className="text-[11px] text-slate-500">
              Click "Add" on any template to preview, customize, and save to your backend
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {INITIAL_CATALOGUE_PRESETS.map((preset) => {
              const alreadyExists = docTypes.some(
                (d) => d.name.toLowerCase() === preset.name.toLowerCase()
              );

              return (
                <div
                  key={preset.name}
                  className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between transition-all ${
                    alreadyExists
                      ? 'bg-white/60 border-slate-200/80 opacity-75'
                      : 'bg-white border-amber-200/80 shadow-xs hover:border-amber-400'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{preset.name}</span>
                      {alreadyExists && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          In Catalogue
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {preset.description}
                    </p>
                    <div className="text-[10px] text-slate-400 pt-1">
                      Docs: {preset.requiredDocs} • {preset.processingTime}
                    </div>
                  </div>

                  <div className="pt-3 mt-2 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => handleSelectSuggestion(preset)}
                      disabled={alreadyExists}
                      className={`text-xs font-semibold px-3 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                        alreadyExists
                          ? 'text-slate-400 bg-slate-100 cursor-not-allowed'
                          : 'bg-navy-900 text-white hover:bg-navy-800'
                      }`}
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>{alreadyExists ? 'Already Added' : 'Add to Catalogue'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Tabs, Search Bar, & View Toggle */}
      <div className="card space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1">
            {[
              { id: 'all', label: 'All Documents' },
              { id: 'active', label: 'Active Only' },
              { id: 'archived', label: 'Inactive / Archived' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  filterStatus === tab.id
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Showing {filteredDocTypes.length} of {totalCount}
            </span>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                title="Table View"
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  viewMode === 'table' ? 'bg-white text-navy-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                title="Card Grid View"
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-navy-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
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
            placeholder="Search catalogue by document name, description, required documents, or ID..."
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Document Types Display (Table or Grid View) */}
      {loading ? (
        <div className="card py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-navy-900" />
          <span className="text-xs text-slate-500 font-medium">Loading document catalogue from server...</span>
        </div>
      ) : filteredDocTypes.length === 0 ? (
        <div className="card py-16 text-center space-y-3">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Document Types Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {searchQuery
              ? 'No catalogue items matched your search query. Try clearing the search term.'
              : 'The institutional document catalogue is currently empty. Click "Add Document" to create one or browse the "Suggested Documents" suggestions above.'}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => setShowSuggestions(true)}
              className="btn-secondary text-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Browse Suggested Documents</span>
            </button>
            <button onClick={handleOpenAdd} className="btn-primary text-xs">
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Custom Document</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* ========================================================================= */
        /* TABLE VIEW */
        /* ========================================================================= */
        <div className="card p-0 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Document Name</th>
                  <th className="py-3.5 px-4">Purpose & Requirements</th>
                  <th className="py-3.5 px-4">Est. TAT</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredDocTypes.map((type) => {
                  const isActive = type.status === 'active';
                  const parsed = parseDocTypeDescription(type.description);

                  return (
                    <tr
                      key={type.doc_type_id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        !isActive ? 'bg-slate-50/30' : ''
                      }`}
                    >
                      {/* Name & ID */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs">{type.name}</div>
                        <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                          {type.doc_type_id}
                        </span>
                      </td>

                      {/* Purpose & Required Supporting Documents */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                          {parsed.description || (
                            <span className="italic text-slate-400">No general description provided.</span>
                          )}
                        </p>
                        {parsed.requiredDocs && (
                          <div className="mt-1 flex items-start gap-1.5 text-[11px] text-blue-800 bg-blue-50/60 p-1.5 rounded border border-blue-100">
                            <FileCheck className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <span>
                              <strong>Required:</strong> {parsed.requiredDocs}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Processing Time */}
                      <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {parsed.processingTime || '1-2 days'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <Check className="w-3 h-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <Archive className="w-3 h-3" />
                              Inactive
                            </>
                          )}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(type.created_at).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(type)}
                            className="btn-secondary text-xs py-1 px-2.5"
                            title="Edit properties"
                          >
                            <Edit3 className="w-3 h-3 text-slate-600" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleToggleStatus(type)}
                            className={`text-xs py-1 px-2.5 rounded-lg font-medium transition-colors border flex items-center gap-1 ${
                              isActive
                                ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                            }`}
                            title={isActive ? 'Deactivate from student view' : 'Activate for student applications'}
                          >
                            {isActive ? (
                              <>
                                <Archive className="w-3 h-3" />
                                <span>Deactivate</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Activate</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => {
                              setTargetDeleteDoc(type);
                              setShowDeleteModal(true);
                            }}
                            className="btn-danger text-xs py-1 px-2"
                            title="Delete from catalogue"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* GRID VIEW */
        /* ========================================================================= */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocTypes.map((type) => {
            const isActive = type.status === 'active';
            const parsed = parseDocTypeDescription(type.description);

            return (
              <div
                key={type.doc_type_id}
                className={`card p-5 flex flex-col justify-between transition-all border-2 ${
                  isActive
                    ? 'border-slate-200 hover:border-slate-300'
                    : 'border-slate-200/60 bg-slate-50/50 opacity-80'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{type.name}</h3>
                      <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                        ID: {type.doc_type_id}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider shrink-0 ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {isActive ? (
                        <>
                          <Check className="w-3 h-3" />
                          Active
                        </>
                      ) : (
                        <>
                          <Archive className="w-3 h-3" />
                          Inactive
                        </>
                      )}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed min-h-[2.5rem]">
                    {parsed.description || (
                      <span className="italic text-slate-400">No general description provided.</span>
                    )}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    {parsed.requiredDocs && (
                      <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                        <FileCheck className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-slate-700 block text-[11px]">
                            Required Supporting Documents:
                          </span>
                          <span className="text-slate-600 text-[11px] leading-relaxed">
                            {parsed.requiredDocs}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Estimated TAT:{' '}
                        <strong className="text-slate-700">
                          {parsed.processingTime || '1-2 business days'}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400">
                    Added {new Date(type.created_at).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(type)}
                      className="btn-secondary text-xs py-1.5 px-2.5"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleToggleStatus(type)}
                      className={`text-xs py-1.5 px-2.5 rounded-lg font-medium transition-colors border flex items-center gap-1.5 ${
                        isActive
                          ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      }`}
                    >
                      {isActive ? (
                        <>
                          <Archive className="w-3.5 h-3.5" />
                          <span>Deactivate</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Activate</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setTargetDeleteDoc(type);
                        setShowDeleteModal(true);
                      }}
                      className="btn-danger text-xs py-1.5 px-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD DOCUMENT TYPE MODAL */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-navy-50 text-navy-900 flex items-center justify-center">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Document Type</h3>
                  <p className="text-xs text-slate-500">Persists to the institutional database via REST API</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex flex-col gap-2.5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{formError}</span>
                </div>
                {(formError.includes('403') || formError.includes('Authorization') || formError.includes('Permission')) && (
                  <div className="pt-2 border-t border-red-200/80 flex items-center justify-between">
                    <span className="text-[11px] text-red-600 font-medium">Create or look up Office Staff account:</span>
                    <Link
                      to="/admin/users"
                      className="text-[11px] font-bold bg-navy-900 text-white px-3 py-1 rounded-lg hover:bg-navy-800 transition-colors flex items-center gap-1.5"
                    >
                      <span>Open User Directory</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Document Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={80}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Study Certificate"
                  className="input-field"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  3 to 80 characters. Visible to students during application.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Description & Institutional Purpose
                </label>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Explain eligibility, purpose, or usage..."
                  className="input-field leading-relaxed resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Required Supporting Documents
                </label>
                <input
                  type="text"
                  maxLength={300}
                  value={formData.requiredDocs}
                  onChange={(e) => setFormData({ ...formData, requiredDocs: e.target.value })}
                  placeholder="e.g. Student ID Card, Previous Marksheet, Fee Receipt"
                  className="input-field"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Displayed as a checklist for students when applying.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Estimated Processing Time
                </label>
                <select
                  value={formData.processingTime}
                  onChange={(e) => setFormData({ ...formData, processingTime: e.target.value })}
                  className="input-field text-xs"
                >
                  <option value="1-2 business days">1-2 business days</option>
                  <option value="2-3 business days">2-3 business days</option>
                  <option value="3-5 business days">3-5 business days</option>
                  <option value="5-7 business days">5-7 business days</option>
                  <option value="Immediate / Same Day">Immediate / Same Day</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to Server...</span>
                    </>
                  ) : (
                    <span>Save to Catalogue</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT DOCUMENT TYPE MODAL */}
      {/* ========================================================================= */}
      {showEditModal && editingDocType && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Document Type</h3>
                  <p className="text-xs text-slate-500">Update catalogue properties in the backend</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingDocType(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex flex-col gap-2.5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{formError}</span>
                </div>
                {(formError.includes('403') || formError.includes('Authorization') || formError.includes('Permission')) && (
                  <div className="pt-2 border-t border-red-200/80 flex items-center justify-between">
                    <span className="text-[11px] text-red-600 font-medium">Create or look up Office Staff account:</span>
                    <Link
                      to="/admin/users"
                      className="text-[11px] font-bold bg-navy-900 text-white px-3 py-1 rounded-lg hover:bg-navy-800 transition-colors flex items-center gap-1.5"
                    >
                      <span>Open User Directory</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Document Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={80}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Description & Purpose
                </label>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field leading-relaxed resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Required Supporting Documents
                </label>
                <input
                  type="text"
                  maxLength={300}
                  value={formData.requiredDocs}
                  onChange={(e) => setFormData({ ...formData, requiredDocs: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Estimated Processing Time
                </label>
                <select
                  value={formData.processingTime}
                  onChange={(e) => setFormData({ ...formData, processingTime: e.target.value })}
                  className="input-field text-xs"
                >
                  <option value="1-2 business days">1-2 business days</option>
                  <option value="2-3 business days">2-3 business days</option>
                  <option value="3-5 business days">3-5 business days</option>
                  <option value="5-7 business days">5-7 business days</option>
                  <option value="Immediate / Same Day">Immediate / Same Day</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingDocType(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {showDeleteModal && targetDeleteDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                Delete "{targetDeleteDoc.name}"?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Deleting permanently removes this document type. If students have existing applications linked to this type, the backend may reject deletion.
              </p>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 text-left">
                <strong>Recommended:</strong> Use <strong>Deactivate</strong> instead to hide it from new applications while preserving student records.
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setTargetDeleteDoc(null);
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={submitting}
                className="btn-danger flex-1"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
