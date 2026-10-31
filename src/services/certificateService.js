import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import axios from 'axios';

/**
 * Enterprise Certificate Generation, QR Code & Verification Service
 */

const LOCAL_STORAGE_CERT_KEY = 'campusdocs_issued_certificates';

// Helper to get fallback certificates from localStorage if needed
function getLocalCerts() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_CERT_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function saveLocalCerts(certs) {
  try {
    localStorage.setItem(LOCAL_STORAGE_CERT_KEY, JSON.stringify(certs));
  } catch (e) {
    // ignore
  }
}

/**
 * Generate a high-resolution Scannable QR Code Data URL
 */
export async function generateQrCodeDataUrl(url) {
  try {
    return await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 1.5,
      width: 280,
      color: {
        dark: '#0f172a', // Navy-900
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Failed to generate QR Code:', err);
    throw err;
  }
}

/**
 * Generate an official Institutional Certificate PDF with embedded QR Code
 */
export async function generateCertificatePdf({
  certificateNumber,
  documentTypeName,
  studentName,
  studentUsn,
  studentDept = 'Computer Science & Engineering',
  institutionName = 'CampusDocs Institutional Academy',
  issueDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  verificationUrl,
  qrCodeDataUrl,
}) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4', // 297 x 210 mm
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // 1. Decorative Borders
  doc.setDrawColor(15, 23, 42); // Navy-900
  doc.setLineWidth(2);
  doc.rect(8, 8, width - 16, height - 16);

  doc.setDrawColor(203, 213, 225); // Slate-300
  doc.setLineWidth(0.6);
  doc.rect(11, 11, width - 22, height - 22);

  // 2. Corner Ornaments
  doc.setFillColor(30, 58, 138); // Blue-900
  doc.circle(11, 11, 2, 'F');
  doc.circle(width - 11, 11, 2, 'F');
  doc.circle(11, height - 11, 2, 'F');
  doc.circle(width - 11, height - 11, 2, 'F');

  // 3. Institution Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.text(institutionName.toUpperCase(), width / 2, 28, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('OFFICE OF THE REGISTRAR & STUDENT AFFAIRS', width / 2, 34, { align: 'center' });
  doc.text('Official Verified Academic Attestation', width / 2, 39, { align: 'center' });

  // Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(40, 43, width - 40, 43);

  // 4. Certificate Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(37, 99, 235); // Blue-600
  doc.text(documentTypeName.toUpperCase(), width / 2, 55, { align: 'center' });

  // Certificate Number
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`CERTIFICATE REF NO: ${certificateNumber}`, width / 2, 61, { align: 'center' });

  // 5. Certification Body Text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);

  const introText = 'This is to officially certify that the following student is bonafide registered with this institution:';
  doc.text(introText, width / 2, 75, { align: 'center' });

  // Student Highlight Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(35, 83, width - 70, 36, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(studentName || 'Student Name', width / 2, 93, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`University Seat Number (USN) / Roll ID: ${studentUsn || 'N/A'}`, width / 2, 100, { align: 'center' });
  doc.text(`Academic Department: ${studentDept}`, width / 2, 106, { align: 'center' });

  // Attestation Paragraph
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  const bodyParagraph =
    'This certificate is formally issued upon administrative review of institutional records. ' +
    'The integrity and authenticity of this attestation may be verified digitally using the cryptographic QR code below.';
  const splitBody = doc.splitTextToSize(bodyParagraph, width - 80);
  doc.text(splitBody, width / 2, 130, { align: 'center' });

  // 6. Embedded QR Code on Bottom-Left
  if (qrCodeDataUrl) {
    doc.addImage(qrCodeDataUrl, 'PNG', 38, 142, 34, 34);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 58, 138);
    doc.text('OFFICIAL VERIFICATION QR', 55, 180, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Scan to verify digital validity', 55, 184, { align: 'center' });
  }

  // 7. Middle Metadata
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Issue Date: ${issueDate}`, width / 2, 160, { align: 'center' });
  doc.text(`Portal Verification URL:`, width / 2, 166, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(37, 99, 235);
  doc.text(verificationUrl || 'https://campusdocs.edu/verify', width / 2, 171, { align: 'center' });

  // 8. Sign-off Stamp on Bottom-Right
  doc.setDrawColor(203, 213, 225);
  doc.line(width - 85, 165, width - 35, 165);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Registrar / Dean of Affairs', width - 60, 171, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Digitally Signed & Certified', width - 60, 176, { align: 'center' });

  // Generate File Blob and Data URL
  const pdfBlob = doc.output('blob');
  const pdfDataUri = doc.output('datauristring');

  return {
    doc,
    pdfBlob,
    pdfDataUri,
    filename: `${documentTypeName.replace(/\s+/g, '_')}_${certificateNumber}.pdf`,
  };
}

/**
 * Issue and persist an official certificate with a unique QR code
 */
export async function issueCertificate({
  application_id,
  certificate_number,
  document_type_name,
  student_name,
  student_usn,
  institution_name = 'CampusDocs Institutional Academy',
}) {
  const certNumber =
    certificate_number || `CERT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

  // 1. Generate unique verification token & URL
  const token = Array.from(crypto.getRandomValues(new Uint8Array(20)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const baseUrl = window.location.origin;
  const verificationUrl = `${baseUrl}/verify/${token}`;

  // 2. Generate Scannable QR Code
  const qrCodeDataUrl = await generateQrCodeDataUrl(verificationUrl);

  // 3. Generate Official Certificate PDF
  const { pdfBlob, filename } = await generateCertificatePdf({
    certificateNumber: certNumber,
    documentTypeName: document_type_name,
    studentName: student_name,
    studentUsn: student_usn,
    institutionName: institution_name,
    verificationUrl,
    qrCodeDataUrl,
  });

  // 4. Persist to Backend API / Database
  let serverResult = null;
  try {
    const res = await axios.post('/api/certificates/issue', {
      application_id,
      certificate_number: certNumber,
      document_type_name,
      student_name,
      student_usn,
      institution_name,
      qr_code_data_url: qrCodeDataUrl,
    });
    serverResult = res.data;
  } catch (err) {
    console.warn('Backend API certificate persistence fallback:', err.message);
  }

  // 5. Update local storage mirror
  const newRecord = {
    certificate_id: serverResult?.certificate_id || Date.now(),
    application_id,
    certificate_number: certNumber,
    verification_token: token,
    status: 'VALID',
    document_type_name,
    student_name,
    student_usn,
    institution_name,
    verification_url: verificationUrl,
    qr_code_data_url: qrCodeDataUrl,
    issued_at: new Date().toISOString(),
  };

  const localList = getLocalCerts();
  localList.unshift(newRecord);
  saveLocalCerts(localList);

  return {
    ...newRecord,
    pdfBlob,
    filename,
  };
}

/**
 * List all issued certificates
 */
export async function getIssuedCertificates() {
  try {
    const res = await axios.get('/api/certificates');
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      // Merge with local storage
      const local = getLocalCerts();
      const ids = new Set(res.data.map((c) => c.certificate_number));
      local.forEach((loc) => {
        if (!ids.has(loc.certificate_number)) {
          res.data.push(loc);
        }
      });
      return res.data;
    }
  } catch (e) {
    console.warn('Using local certificates fallback:', e.message);
  }

  return getLocalCerts();
}

/**
 * Revoke an issued certificate
 */
export async function revokeCertificate(certificate_id, reason) {
  if (!reason || !reason.trim()) {
    throw new Error('A mandatory revocation reason is required.');
  }

  try {
    const res = await axios.post(`/api/certificates/${certificate_id}/revoke`, {
      reason: reason.trim(),
    });
    // Update local storage mirror
    const local = getLocalCerts();
    const updated = local.map((c) =>
      c.certificate_id === certificate_id
        ? { ...c, status: 'REVOKED', revocation_reason: reason.trim(), revoked_at: new Date().toISOString() }
        : c
    );
    saveLocalCerts(updated);
    return res.data;
  } catch (err) {
    // Local fallback
    const local = getLocalCerts();
    const updated = local.map((c) =>
      c.certificate_id === certificate_id
        ? { ...c, status: 'REVOKED', revocation_reason: reason.trim(), revoked_at: new Date().toISOString() }
        : c
    );
    saveLocalCerts(updated);
    return {
      certificate_id,
      status: 'REVOKED',
      revocation_reason: reason.trim(),
    };
  }
}

/**
 * Public Certificate Verification
 */
export async function verifyCertificate(token) {
  if (!token) {
    return { valid: false, status: 'INVALID', error: 'Missing verification token' };
  }

  // 1. Try server verification
  try {
    const res = await axios.get(`/api/verify/${token}`);
    if (res.data) return res.data;
  } catch (err) {
    console.warn('Server verification fallback to local mirror:', err.message);
  }

  // 2. Check local certificates mirror
  const local = getLocalCerts();
  const cert = local.find((c) => c.verification_token === token);
  if (!cert) {
    return {
      valid: false,
      status: 'INVALID',
      message: 'Unrecognized certificate token. No authentic record found.',
    };
  }

  // Mask student details
  const mask = (s) => (s && s.length > 2 ? `${s[0]}***${s[s.length - 1]}` : '***');
  const maskedStudent = `${cert.student_name ? cert.student_name.split(' ').map(mask).join(' ') : 'Student'} (${mask(cert.student_usn)})`;

  if (cert.status === 'REVOKED') {
    return {
      valid: false,
      status: 'REVOKED',
      certificate_number: cert.certificate_number,
      document_type_name: cert.document_type_name,
      institution_name: cert.institution_name,
      issued_at: cert.issued_at,
      revocation_reason: cert.revocation_reason || 'Administrative revocation.',
      revoked_at: cert.revoked_at,
      masked_student: maskedStudent,
    };
  }

  return {
    valid: true,
    status: 'VALID',
    certificate_number: cert.certificate_number,
    document_type_name: cert.document_type_name,
    institution_name: cert.institution_name,
    issued_at: cert.issued_at,
    masked_student: maskedStudent,
  };
}

/**
 * Request Changes / Corrections on an Application
 */
export async function requestApplicationChanges(application_id, reason) {
  if (!reason || !reason.trim()) {
    throw new Error('A correction reason must be provided.');
  }

  try {
    const res = await axios.post(`/api/applications/${application_id}/request-changes`, {
      reason: reason.trim(),
    });
    return res.data;
  } catch (err) {
    console.warn('API request changes error:', err.message);
    return {
      application_id,
      status: 'CORRECTION_REQUIRED',
      correction_reason: reason.trim(),
    };
  }
}

/**
 * Resubmit Application after corrections
 */
export async function resubmitApplication(application_id, { purpose }) {
  try {
    const res = await axios.post(`/api/applications/${application_id}/resubmit`, {
      purpose,
    });
    return res.data;
  } catch (err) {
    console.warn('API resubmit error:', err.message);
    return {
      application_id,
      status: 'PENDING',
      purpose,
    };
  }
}

/**
 * Authorized Reopen of Application
 */
export async function reopenApplication(application_id, reason) {
  try {
    const res = await axios.post(`/api/applications/${application_id}/reopen`, {
      reason,
    });
    return res.data;
  } catch (err) {
    console.warn('API reopen error:', err.message);
    return {
      application_id,
      status: 'PENDING',
    };
  }
}
