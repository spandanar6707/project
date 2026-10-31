import api from './api';

// ─── Document Types ───────────────────────────────────────────────────────────

// List doc types: GET /api/v1/docdesk/doc-types
export const getDocTypes = async ({ status = 'active', limit = 100, cursor } = {}) => {
  const params = { limit };
  if (status) params.status = status;
  if (cursor) params.cursor = cursor;
  const response = await api.get('/api/v1/docdesk/doc-types', { params });
  return response.data; // DocTypeList { count, next_cursor, items }
};

// Get single doc type
export const getDocType = async (doc_type_id) => {
  const response = await api.get(`/api/v1/docdesk/doc-types/${doc_type_id}`);
  return response.data;
};

// Create doc type: POST /api/v1/docdesk/doc-types (admin/office_staff)
export const createDocType = async ({ name, description }) => {
  const response = await api.post('/api/v1/docdesk/doc-types', { name, description });
  return response.data;
};

// Update doc type: PATCH /api/v1/docdesk/doc-types/{id}
export const updateDocType = async (doc_type_id, updates) => {
  const response = await api.patch(`/api/v1/docdesk/doc-types/${doc_type_id}`, updates);
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
  if (status) params.status = status;
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

// ─── TAT ──────────────────────────────────────────────────────────────────────

// Set TAT for a single request
export const setTat = async (request_id, { expected_by, note }) => {
  const response = await api.put(`/api/v1/docdesk/requests/${request_id}/tat`, { expected_by, note });
  return response.data;
};

// Bulk TAT: POST /api/v1/docdesk/requests/bulk-tat
export const bulkSetTat = async ({ expected_by, note, request_ids }) => {
  const response = await api.post('/api/v1/docdesk/requests/bulk-tat', { expected_by, note, request_ids });
  return response.data; // BulkTatResult { items, count }
};

// ─── Answer (Admin/Staff) ─────────────────────────────────────────────────────

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

// Get all requests across all statuses (for dashboard counts)
export const getRequestCountsByStatus = async () => {
  const [pending, answered, acknowledged] = await Promise.all([
    getRequests({ status: 'pending', limit: 1 }),
    getRequests({ status: 'answered', limit: 1 }),
    getRequests({ status: 'acknowledged', limit: 1 }),
  ]);
  return {
    pending: pending.count,
    answered: answered.count,
    acknowledged: acknowledged.count,
    total: pending.count + answered.count + acknowledged.count,
  };
};
