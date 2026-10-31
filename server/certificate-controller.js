import crypto from 'crypto';
import { query, withTransaction } from './db.js';

/**
 * Enterprise Certificate & Verification Controller
 * Direct MySQL campusdocs persistence for QR verification, corrections, and audit history.
 */

// Helper to mask student names and USNs for public privacy
export function maskStudentInfo(name = '', usn = '') {
  const maskStr = (str) => {
    if (!str || str.length <= 2) return '***';
    const first = str[0];
    const last = str[str.length - 1];
    return `${first}${'*'.repeat(Math.max(3, str.length - 2))}${last}`;
  };

  return {
    maskedName: name ? name.split(' ').map(maskStr).join(' ') : 'Student',
    maskedUsn: usn ? maskStr(usn) : 'USN Verified',
  };
}

/**
 * List all issued certificates with status and QR tokens
 */
export async function listCertificates() {
  const [rows] = await query(`
    SELECT 
      c.certificate_id,
      c.application_id,
      c.certificate_number,
      c.verification_token,
      c.token_hash,
      c.status,
      c.document_type_name,
      c.student_name,
      c.student_usn,
      c.institution_name,
      c.file_url,
      c.issued_at,
      c.revocation_reason,
      c.revoked_at
    FROM certificates c
    ORDER BY c.issued_at DESC
  `);
  return rows;
}

/**
 * Issue a new certificate with a cryptographically secure QR token
 */
export async function issueCertificate({
  application_id,
  certificate_number,
  document_type_name,
  student_name,
  student_usn,
  institution_name = 'CampusDocs Institutional Academy',
  issued_by = 1,
  qr_code_data_url = null,
}) {
  return withTransaction(async (conn) => {
    // 1. Generate 48-char cryptographically secure token
    const token = crypto.randomBytes(24).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const certNum = certificate_number || `CERT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    // 2. Insert into certificates table
    const [insertResult] = await conn.query(
      `INSERT INTO certificates 
        (application_id, certificate_number, verification_token, token_hash, status, 
         document_type_name, student_name, student_usn, institution_name, qr_code_data_url, issued_by, issued_at)
       VALUES (?, ?, ?, ?, 'VALID', ?, ?, ?, ?, ?, ?, NOW())`,
      [
        application_id || null,
        certNum,
        token,
        tokenHash,
        document_type_name,
        student_name,
        student_usn,
        institution_name,
        qr_code_data_url,
        issued_by,
      ]
    );

    const certificate_id = insertResult.insertId;

    // 3. Update application status if application_id is provided
    if (application_id) {
      await conn.query(
        "UPDATE applications SET status = 'APPROVED', updated_at = NOW() WHERE application_id = ?",
        [application_id]
      );

      // Record in approval_history
      await conn.query(
        `INSERT INTO approval_history 
          (application_id, admin_id, previous_status, new_status, remarks, action_date)
         VALUES (?, ?, 'UNDER_REVIEW', 'APPROVED', ?, NOW())`,
        [application_id, issued_by, `Certificate ${certNum} generated with verification token.`]
      );
    }

    return {
      certificate_id,
      certificate_number: certNum,
      verification_token: token,
      token_hash: tokenHash,
      status: 'VALID',
      issued_at: new Date().toISOString(),
    };
  });
}

/**
 * Public Verification by Token
 */
export async function verifyCertificateToken(token) {
  if (!token) return { valid: false, status: 'INVALID', error: 'No verification token provided.' };

  const [rows] = await query(
    `SELECT 
      certificate_id,
      certificate_number,
      verification_token,
      status,
      document_type_name,
      student_name,
      student_usn,
      institution_name,
      issued_at,
      revocation_reason,
      revoked_at
    FROM certificates
    WHERE verification_token = ?`,
    [token]
  );

  if (rows.length === 0) {
    return {
      valid: false,
      status: 'INVALID',
      message: 'Unrecognized or invalid certificate token. No authentic record found.',
    };
  }

  const cert = rows[0];
  const { maskedName, maskedUsn } = maskStudentInfo(cert.student_name, cert.student_usn);

  if (cert.status === 'REVOKED') {
    return {
      valid: false,
      status: 'REVOKED',
      certificate_number: cert.certificate_number,
      document_type_name: cert.document_type_name,
      institution_name: cert.institution_name,
      issued_at: cert.issued_at,
      revocation_reason: cert.revocation_reason || 'Certificate revoked by administrative authority.',
      revoked_at: cert.revoked_at,
      masked_student: `${maskedName} (${maskedUsn})`,
    };
  }

  return {
    valid: true,
    status: 'VALID',
    certificate_number: cert.certificate_number,
    document_type_name: cert.document_type_name,
    institution_name: cert.institution_name,
    issued_at: cert.issued_at,
    masked_student: `${maskedName} (${maskedUsn})`,
  };
}

/**
 * Revoke an existing certificate with a mandatory reason
 */
export async function revokeCertificate(certificate_id, { reason, revoked_by = 1 }) {
  if (!reason || !reason.trim()) {
    throw new Error('A mandatory revocation reason must be provided.');
  }

  return withTransaction(async (conn) => {
    const [certs] = await conn.query('SELECT * FROM certificates WHERE certificate_id = ?', [certificate_id]);
    if (certs.length === 0) throw new Error('Certificate not found.');

    const cert = certs[0];

    await conn.query(
      `UPDATE certificates 
       SET status = 'REVOKED', revocation_reason = ?, revoked_at = NOW(), revoked_by = ? 
       WHERE certificate_id = ?`,
      [reason.trim(), revoked_by, certificate_id]
    );

    if (cert.application_id) {
      await conn.query(
        `INSERT INTO approval_history 
          (application_id, admin_id, previous_status, new_status, remarks, action_date)
         VALUES (?, ?, 'APPROVED', 'REVOKED', ?, NOW())`,
        [cert.application_id, revoked_by, `Certificate revoked: ${reason.trim()}`]
      );
    }

    return {
      certificate_id,
      status: 'REVOKED',
      revocation_reason: reason.trim(),
      revoked_at: new Date().toISOString(),
    };
  });
}

/**
 * Request Changes / Corrections on an Application
 */
export async function requestChanges(application_id, { reason, admin_id = 1 }) {
  if (!reason || !reason.trim()) {
    throw new Error('A specific correction reason is required.');
  }

  return withTransaction(async (conn) => {
    const [apps] = await conn.query('SELECT * FROM applications WHERE application_id = ?', [application_id]);
    if (apps.length === 0) throw new Error('Application not found.');

    const app = apps[0];
    let editHistory = [];
    try {
      editHistory = typeof app.edit_history === 'string' ? JSON.parse(app.edit_history || '[]') : (app.edit_history || []);
    } catch (e) {
      editHistory = [];
    }

    editHistory.push({
      action: 'CORRECTION_REQUESTED',
      by_admin: admin_id,
      reason: reason.trim(),
      timestamp: new Date().toISOString(),
    });

    await conn.query(
      `UPDATE applications 
       SET status = 'CORRECTION_REQUIRED', correction_reason = ?, edit_history = ?, updated_at = NOW() 
       WHERE application_id = ?`,
      [reason.trim(), JSON.stringify(editHistory), application_id]
    );

    await conn.query(
      `INSERT INTO approval_history 
        (application_id, admin_id, previous_status, new_status, remarks, action_date)
       VALUES (?, ?, ?, 'CORRECTION_REQUIRED', ?, NOW())`,
      [application_id, admin_id, app.status, `Correction requested: ${reason.trim()}`]
    );

    return {
      application_id,
      status: 'CORRECTION_REQUIRED',
      correction_reason: reason.trim(),
      updated_at: new Date().toISOString(),
    };
  });
}

/**
 * Student Resubmit with corrections
 */
export async function resubmitApplication(application_id, { purpose, student_id }) {
  return withTransaction(async (conn) => {
    const [apps] = await conn.query('SELECT * FROM applications WHERE application_id = ?', [application_id]);
    if (apps.length === 0) throw new Error('Application not found.');

    const app = apps[0];
    if (app.status !== 'CORRECTION_REQUIRED' && app.status !== 'PENDING') {
      throw new Error(`Cannot edit an application with status ${app.status}.`);
    }

    let editHistory = [];
    try {
      editHistory = typeof app.edit_history === 'string' ? JSON.parse(app.edit_history || '[]') : (app.edit_history || []);
    } catch (e) {
      editHistory = [];
    }

    editHistory.push({
      action: 'RESUBMITTED_BY_STUDENT',
      previous_purpose: app.purpose,
      new_purpose: purpose || app.purpose,
      timestamp: new Date().toISOString(),
    });

    await conn.query(
      `UPDATE applications 
       SET status = 'PENDING', purpose = ?, correction_reason = NULL, resubmitted_at = NOW(), 
           edit_history = ?, updated_at = NOW() 
       WHERE application_id = ?`,
      [purpose || app.purpose, JSON.stringify(editHistory), application_id]
    );

    return {
      application_id,
      status: 'PENDING',
      purpose: purpose || app.purpose,
      resubmitted_at: new Date().toISOString(),
    };
  });
}

/**
 * Authorized Reopen of an application (Admin only)
 */
export async function reopenApplication(application_id, { admin_id = 1, reason = 'Administrative reopening' }) {
  return withTransaction(async (conn) => {
    const [apps] = await conn.query('SELECT * FROM applications WHERE application_id = ?', [application_id]);
    if (apps.length === 0) throw new Error('Application not found.');

    const app = apps[0];

    await conn.query(
      `UPDATE applications 
       SET status = 'PENDING', updated_at = NOW() 
       WHERE application_id = ?`,
      [application_id]
    );

    await conn.query(
      `INSERT INTO approval_history 
        (application_id, admin_id, previous_status, new_status, remarks, action_date)
       VALUES (?, ?, ?, 'PENDING', ?, NOW())`,
      [application_id, admin_id, app.status, `Application reopened: ${reason}`]
    );

    return {
      application_id,
      status: 'PENDING',
      updated_at: new Date().toISOString(),
    };
  });
}
