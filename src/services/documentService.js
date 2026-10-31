import api from './api';

// ─── Initial Document Catalogue Presets ───────────────────────────────────────
export const INITIAL_CATALOGUE_PRESETS = [
  {
    name: 'Study Certificate',
    description: 'Official institutional certificate verifying ongoing study and academic enrollment.',
    requiredDocs: 'Valid Student ID Card, Current Semester Fee Receipt',
    processingTime: '1-2 business days',
  },
  {
    name: 'Bonafide Certificate',
    description: 'Attestation of bonafide student status for passport, visa, bank loan, or scholarship applications.',
    requiredDocs: 'Student ID Card, Application Proof (Passport / Visa / Loan Form)',
    processingTime: '1-2 business days',
  },
  {
    name: 'Transfer Certificate',
    description: 'Official institutional transfer certificate issued upon graduation, migration, or course transfer.',
    requiredDocs: 'No Dues Clearance Certificate, Library Clearance, All Semester Grade Cards',
    processingTime: '3-5 business days',
  },
  {
    name: 'Character Certificate',
    description: 'Endorsement of good conduct, discipline, and moral character during tenure at the college.',
    requiredDocs: 'Student ID Card, Department HOD Recommendation',
    processingTime: '2-3 business days',
  },
  {
    name: 'Course Completion Certificate',
    description: 'Certification of successful completion of academic degree coursework and syllabus requirements.',
    requiredDocs: 'Final Semester Grade Card, Provisional Degree or Department Clearance',
    processingTime: '2-4 business days',
  },
  {
    name: 'Medium of Instruction Certificate',
    description: 'Certifies that the curriculum, lectures, and examinations were conducted in the English language.',
    requiredDocs: 'Degree Certificate or Semester Grade Cards',
    processingTime: '1-2 business days',
  },
  {
    name: 'Conduct Certificate',
    description: 'Official verification of student behavior, disciplinary clearance, and institutional standing.',
    requiredDocs: 'Proctor/Mentor Clearance, Department HOD Endorsement',
    processingTime: '2-3 business days',
  },
];

// Helper: Format metadata into backend description string (max 1000 chars)
export const formatDocTypeDescription = (description = '', requiredDocs = '', processingTime = '') => {
  let main = (description || '').trim();
  const metaParts = [];

  if (requiredDocs?.trim()) {
    metaParts.push(`Required: ${requiredDocs.trim()}`);
  }
  if (processingTime?.trim()) {
    metaParts.push(`Est. TAT: ${processingTime.trim()}`);
  }

  if (metaParts.length > 0) {
    main = main ? `${main} [${metaParts.join(' | ')}]` : `[${metaParts.join(' | ')}]`;
  }

  return main ? main.slice(0, 1000) : null;
};

// Helper: Parse metadata from backend description string
export const parseDocTypeDescription = (rawDescription = '') => {
  if (!rawDescription) {
    return { description: '', requiredDocs: '', processingTime: '' };
  }

  const match = rawDescription.match(/^(.*?)(?:\s*\[(.*?)\])?$/s);
  if (!match) {
    return { description: rawDescription, requiredDocs: '', processingTime: '' };
  }

  const description = (match[1] || '').trim();
  const metaStr = match[2] || '';

  let requiredDocs = '';
  let processingTime = '';

  if (metaStr) {
    const parts = metaStr.split('|').map((p) => p.trim());
    parts.forEach((part) => {
      if (part.startsWith('Required:')) {
        requiredDocs = part.replace(/^Required:\s*/, '').trim();
      } else if (part.startsWith('Est. TAT:') || part.startsWith('Processing Time:')) {
        processingTime = part.replace(/^(Est\. TAT|Processing Time):\s*/, '').trim();
      }
    });
  }

  return { description, requiredDocs, processingTime };
};

// ─── Document Types ───────────────────────────────────────────────────────────

// List doc types: GET /api/v1/docdesk/doc-types
export const getDocTypes = async ({ status = 'active', limit = 100, cursor } = {}) => {
  const params = { limit };
  if (status && status !== 'all') params.status = status;
  if (cursor) params.cursor = cursor;
  const response = await api.get('/api/v1/docdesk/doc-types', { params });
  return response.data; // DocTypeList { count, next_cursor, items }
};

// Get single doc type
export const getDocType = async (doc_type_id) => {
  const response = await api.get(`/api/v1/docdesk/doc-types/${doc_type_id}`);
  return response.data;
};

// Create doc type: POST /api/v1/docdesk/doc-types
export const createDocType = async ({ name, description }) => {
  const payload = {
    name: name.trim(),
    description: description ? description.trim() : null,
  };
  const response = await api.post('/api/v1/docdesk/doc-types', payload);
  return response.data;
};

// Update doc type: PATCH /api/v1/docdesk/doc-types/{id}
export const updateDocType = async (doc_type_id, updates) => {
  const payload = {};
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.description !== undefined) payload.description = updates.description ? updates.description.trim() : null;
  if (updates.status !== undefined) payload.status = updates.status;

  const response = await api.patch(`/api/v1/docdesk/doc-types/${doc_type_id}`, payload);
  return response.data;
};

// Delete doc type
export const deleteDocType = async (doc_type_id) => {
  const response = await api.delete(`/api/v1/docdesk/doc-types/${doc_type_id}`);
  return response.data;
};

// ─── Document Requests ────────────────────────────────────────────────────────

// List requests: GET /api/v1/docdesk/requests
export const getRequests = async ({ status, doc_type_id, mine, limit = 25, cursor } = {}) => {
  const params = { limit };
  if (status && status !== 'all') params.status = status;
  if (doc_type_id) params.doc_type_id = doc_type_id;
  if (mine !== undefined) params.mine = mine;
  if (cursor) params.cursor = cursor;
  const response = await api.get('/api/v1/docdesk/requests', { params });
  return response.data; // RequestList { count, next_cursor, items }
};

// Get single request
export const getRequest = async (request_id) => {
  const response = await api.get(`/api/v1/docdesk/requests/${request_id}`);
  return response.data; // RequestView
};

// Create request: POST /api/v1/docdesk/requests
export const createRequest = async ({ doc_type_id, reason }) => {
  const response = await api.post('/api/v1/docdesk/requests', { doc_type_id, reason });
  return response.data;
};

// Update (edit) pending request: PATCH
export const updateRequest = async (request_id, updates) => {
  const response = await api.patch(`/api/v1/docdesk/requests/${request_id}`, updates);
  return response.data;
};

// Withdraw (delete) pending request: DELETE
export const withdrawRequest = async (request_id) => {
  const response = await api.delete(`/api/v1/docdesk/requests/${request_id}`);
  return response.data;
};

// ─── Turnaround Time (TAT) ─────────────────────────────────────────────────────

// Set TAT for a single request
export const setTat = async (request_id, { expected_by, note }) => {
  const payload = { expected_by, note };
  const response = await api.put(`/api/v1/docdesk/requests/${request_id}/tat`, payload);
  return response.data;
};

// Bulk TAT: POST /api/v1/docdesk/requests/bulk-tat
export const bulkSetTat = async ({ expected_by, note, request_ids }) => {
  const payload = { expected_by, note, request_ids };
  const response = await api.post('/api/v1/docdesk/requests/bulk-tat', payload);
  return response.data; // BulkTatResult { items, count }
};

// ─── Answer (Staff / Student Affairs) ─────────────────────────────────────────

// Answer a request: POST multipart/form-data
export const answerRequest = async (request_id, { message, document }) => {
  const formData = new FormData();
  formData.append('message', message);
  if (document) formData.append('document', document);

  const response = await api.post(`/api/v1/docdesk/requests/${request_id}/answer`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// Update answer: PATCH multipart/form-data
export const updateAnswer = async (request_id, { message, document, remove_document }) => {
  const formData = new FormData();
  if (message !== undefined) formData.append('message', message);
  if (document) formData.append('document', document);
  if (remove_document !== undefined) formData.append('remove_document', remove_document);

  const response = await api.patch(`/api/v1/docdesk/requests/${request_id}/answer`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// Delete answer
export const deleteAnswer = async (request_id) => {
  const response = await api.delete(`/api/v1/docdesk/requests/${request_id}/answer`);
  return response.data;
};

// ─── Files ────────────────────────────────────────────────────────────────────

// Download answer document (returns blob)
export const downloadDocument = async (request_id) => {
  const response = await api.get(`/api/v1/docdesk/requests/${request_id}/document`, {
    responseType: 'blob',
  });
  return response;
};

// Download filled form (returns blob)
export const downloadFilledForm = async (request_id) => {
  const response = await api.get(`/api/v1/docdesk/requests/${request_id}/filled-form`, {
    responseType: 'blob',
  });
  return response;
};

// Upload filled form: PUT multipart/form-data
export const uploadFilledForm = async (request_id, file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.put(`/api/v1/docdesk/requests/${request_id}/filled-form`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// Delete filled form
export const deleteFilledForm = async (request_id) => {
  const response = await api.delete(`/api/v1/docdesk/requests/${request_id}/filled-form`);
  return response.data;
};

// ─── Acknowledge ──────────────────────────────────────────────────────────────

// Student acknowledges receipt
export const acknowledgeRequest = async (request_id) => {
  const response = await api.post(`/api/v1/docdesk/requests/${request_id}/acknowledge`);
  return response.data;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Trigger a file download in the browser
export const triggerDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// ─── Bulk Document Requests & Batch Processing Helpers ─────────────────────

// Parse batch metadata from reason string
export const parseBatchMetadata = (rawReason = '') => {
  if (!rawReason) {
    return { isBatch: false, batchId: null, copyIndex: null, totalCopies: null, cleanReason: '' };
  }

  const match = rawReason.match(/^\[Batch:\s*([^\]]+)\](?:\s*\[Copy\s*(\d+)\s*of\s*(\d+)\])?\s*(.*)$/s);
  if (!match) {
    return { isBatch: false, batchId: null, copyIndex: null, totalCopies: null, cleanReason: rawReason };
  }

  return {
    isBatch: true,
    batchId: match[1].trim(),
    copyIndex: match[2] ? parseInt(match[2], 10) : 1,
    totalCopies: match[3] ? parseInt(match[3], 10) : 1,
    cleanReason: (match[4] || '').trim(),
  };
};

// Group an array of requests into batch groups and standalone items
export const groupRequestsByBatch = (requests = []) => {
  const batchMap = new Map();
  const standalone = [];

  requests.forEach((req) => {
    const meta = parseBatchMetadata(req.reason);
    if (meta.isBatch) {
      if (!batchMap.has(meta.batchId)) {
        batchMap.set(meta.batchId, {
          batchId: meta.batchId,
          createdAt: req.created_at,
          requestedBy: req.requested_by,
          requestedByName: req.requested_by_name,
          items: [],
          statusSummary: { pending: 0, answered: 0, acknowledged: 0 },
        });
      }
      const batch = batchMap.get(meta.batchId);
      batch.items.push({ ...req, batchMeta: meta });
      if (batch.statusSummary[req.status] !== undefined) {
        batch.statusSummary[req.status]++;
      }
    } else {
      standalone.push(req);
    }
  });

  const batches = Array.from(batchMap.values()).map((batch) => {
    const total = batch.items.length;
    let aggregateStatus = 'pending';
    if (batch.statusSummary.acknowledged === total) {
      aggregateStatus = 'acknowledged';
    } else if (batch.statusSummary.pending === 0 && (batch.statusSummary.answered > 0 || batch.statusSummary.acknowledged > 0)) {
      aggregateStatus = 'answered';
    } else if (batch.statusSummary.answered > 0 || batch.statusSummary.acknowledged > 0) {
      aggregateStatus = 'partially_answered';
    }

    return {
      ...batch,
      totalCount: total,
      aggregateStatus,
    };
  });

  return { batches, standalone };
};

// Sequentially submit bulk document requests to the backend
export const submitBulkRequests = async ({ items, onProgress }) => {
  // Generate a distinct batch tracking identifier
  const randCode = Math.random().toString(36).substring(2, 6).toUpperCase();
  const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const batchId = `BATCH-${dateCode}-${randCode}`;

  // Flatten items by quantity: each copy becomes an individual request
  const requestsToExecute = [];
  items.forEach((item) => {
    const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
    for (let c = 1; c <= qty; c++) {
      requestsToExecute.push({
        doc_type_id: item.doc_type_id,
        docTypeName: item.name,
        copyNum: c,
        totalCopies: qty,
        purpose: item.purpose.trim(),
      });
    }
  });

  const total = requestsToExecute.length;
  const successes = [];
  const failures = [];

  for (let i = 0; i < total; i++) {
    const current = requestsToExecute[i];
    if (onProgress) {
      onProgress({
        current: i + 1,
        total,
        docTypeName: current.docTypeName,
        copyNum: current.copyNum,
        totalCopies: current.totalCopies,
      });
    }

    // Format reason with batch metadata tag (respecting max 500 chars limit)
    const copyTag = current.totalCopies > 1 ? ` [Copy ${current.copyNum} of ${current.totalCopies}]` : '';
    const headerTag = `[Batch: ${batchId}]${copyTag} `;
    const maxPurposeLength = 500 - headerTag.length;
    const trimmedPurpose = current.purpose.slice(0, maxPurposeLength);
    const formattedReason = `${headerTag}${trimmedPurpose}`;

    try {
      const result = await createRequest({
        doc_type_id: current.doc_type_id,
        reason: formattedReason,
      });
      successes.push({ ...result, meta: current });
    } catch (err) {
      console.error(`Failed to create request for ${current.docTypeName} (copy ${current.copyNum}):`, err);
      failures.push({
        item: current,
        error: err.response?.data?.error?.message || err.message || 'Submission failed',
      });
    }
  }

  return {
    batchId,
    total,
    successCount: successes.length,
    failureCount: failures.length,
    successes,
    failures,
  };
};

// Get requests counts by status
export const getRequestCountsByStatus = async (isStudent = false) => {
  try {
    const params = isStudent ? {} : {};
    const [pending, answered, acknowledged] = await Promise.all([
      getRequests({ status: 'pending', limit: 1, ...params }),
      getRequests({ status: 'answered', limit: 1, ...params }),
      getRequests({ status: 'acknowledged', limit: 1, ...params }),
    ]);
    return {
      pending: pending.count || 0,
      answered: answered.count || 0,
      acknowledged: acknowledged.count || 0,
      total: (pending.count || 0) + (answered.count || 0) + (acknowledged.count || 0),
    };
  } catch (error) {
    console.error('Failed to get status counts:', error);
    return { pending: 0, answered: 0, acknowledged: 0, total: 0 };
  }
};
