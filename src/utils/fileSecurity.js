/**
 * File Security & Sanitization Utilities
 * Enforces OWASP File Upload Security Verification Standard
 */

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB Max Upload Limit

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
];

export const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

/**
 * Sanitize filename to prevent directory traversal and null byte injections
 */
export function sanitizeFilename(filename = '') {
  if (!filename) return 'document.pdf';

  // 1. Strip path traversal characters (../, ..\, /)
  let clean = filename.replace(/^.*[\\\/]/, '');

  // 2. Remove null bytes and control characters
  clean = clean.replace(/[\x00-\x1F\x7F]/g, '');

  // 3. Keep only safe characters: alphanumeric, dash, underscore, dot
  clean = clean.replace(/[^a-zA-Z0-9.\-_]/g, '_');

  // 4. Prevent hidden files or extensionless files
  if (clean.startsWith('.')) {
    clean = `file${clean}`;
  }

  // 5. Truncate to reasonable length (max 100 chars)
  if (clean.length > 100) {
    const ext = clean.substring(clean.lastIndexOf('.'));
    clean = clean.substring(0, 95) + ext;
  }

  return clean;
}

/**
 * Validate file before uploading to backend API
 * @param {File} file - HTML5 File object
 * @returns {{ valid: boolean, error?: string, sanitizedFilename?: string }}
 */
export function validateUploadFile(file) {
  if (!file) {
    return { valid: false, error: 'No file selected for upload.' };
  }

  // 1. File Size Verification
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size exceeds the 5 MB institutional limit (selected file is ${sizeMb} MB).`,
    };
  }

  if (file.size === 0) {
    return { valid: false, error: 'Cannot upload empty (0 byte) files.' };
  }

  // 2. Extension Verification
  const name = file.name || '';
  const ext = name.toLowerCase().substring(name.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Disallowed file type (${ext || 'unknown'}). Only PDF documents (.pdf) and images (.png, .jpg) are permitted.`,
    };
  }

  // 3. MIME Type Verification
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `MIME type mismatch (${file.type}). Expected valid document or image format.`,
    };
  }

  return {
    valid: true,
    sanitizedFilename: sanitizeFilename(file.name),
  };
}
