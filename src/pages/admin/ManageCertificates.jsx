import React, { useState, useEffect } from 'react';
import {
  getIssuedCertificates,
  revokeCertificate,
  generateCertificatePdf,
} from '../../services/certificateService';
import {
  Award,
  Search,
  Filter,
  Download,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  QrCode,
  Loader2,
  Calendar,
  User,
  X,
  FileCheck2,
} from 'lucide-react';

export const ManageCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, VALID, REVOKED

  // Revoke Modal State
  const [selectedCertForRevoke, setSelectedCertForRevoke] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Active QR Preview Modal
  const [previewQrCert, setPreviewQrCert] = useState(null);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const data = await getIssuedCertificates();
      setCertificates(data || []);
    } catch (err) {
      console.error('Failed to fetch certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleDownloadPdf = async (cert) => {
    try {
      const { pdfBlob, filename } = await generateCertificatePdf({
        certificateNumber: cert.certificate_number,
        documentTypeName: cert.document_type_name || 'Academic Certificate',
        studentName: cert.student_name,
        studentUsn: cert.student_usn,
        institutionName: cert.institution_name || 'CampusDocs Institutional Academy',
        issueDate: cert.issued_at
          ? new Date(cert.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          : undefined,
        verificationUrl: `${window.location.origin}/verify/${cert.verification_token}`,
        qrCodeDataUrl: cert.qr_code_data_url,
      });

      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Failed to generate certificate PDF.');
    }
  };

  const handleConfirmRevoke = async (e) => {
    e.preventDefault();
    if (!revokeReason.trim() || !selectedCertForRevoke) return;

    setRevokeLoading(true);
    setActionError('');

    try {
      await revokeCertificate(selectedCertForRevoke.certificate_id, revokeReason.trim());
      setSelectedCertForRevoke(null);
      setRevokeReason('');
      await fetchCertificates();
    } catch (err) {
      console.error('Revocation failed:', err);
      setActionError(err.message || 'Failed to revoke certificate.');
    } finally {
      setRevokeLoading(false);
    }
  };

  const filteredCerts = certificates.filter((cert) => {
    if (statusFilter !== 'all' && cert.status !== statusFilter) return false;
    const q = searchQuery.toLowerCase();
    const certNum = (cert.certificate_number || '').toLowerCase();
    const docType = (cert.document_type_name || '').toLowerCase();
    const name = (cert.student_name || '').toLowerCase();
    const usn = (cert.student_usn || '').toLowerCase();
    return certNum.includes(q) || docType.includes(q) || name.includes(q) || usn.includes(q);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Award className="w-7 h-7 text-navy-950" />
            <span>Official Certificates & QR Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage cryptographically signed credentials, download generated PDFs, and manage revocation history.
          </p>
        </div>

        <button
          onClick={fetchCertificates}
          className="btn-secondary text-xs self-start sm:self-auto"
        >
          Refresh Ledger
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {['all', 'VALID', 'REVOKED'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === status
                    ? 'bg-navy-950 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status === 'all' ? 'All Certificates' : status === 'VALID' ? 'Valid Active' : 'Revoked'}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student, USN, certificate ID..."
              className="input-field pl-9"
            />
          </div>
        </div>
      </div>

      {/* Certificates Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-navy-950" />
            <span className="text-xs text-slate-500 font-medium">Loading certificate registry...</span>
          </div>
        ) : filteredCerts.length === 0 ? (
          <div className="py-16 text-center px-4 space-y-2">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No certificates found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Certificates are automatically generated and ledger-signed when administrators approve student applications.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Certificate Details</th>
                  <th className="py-3.5 px-4">Student Recipient</th>
                  <th className="py-3.5 px-4">Issue Date</th>
                  <th className="py-3.5 px-4">QR Verification Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredCerts.map((cert) => {
                  const isValid = cert.status === 'VALID';
                  return (
                    <tr key={cert.certificate_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <FileCheck2 className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>{cert.document_type_name || 'Academic Certificate'}</span>
                        </div>
                        <div className="font-mono text-xs text-slate-400 mt-0.5">
                          {cert.certificate_number}
                        </div>
                        {cert.institution_name && (
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">
                            {cert.institution_name}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {cert.student_name || 'Student'}
                        </div>
                        <div className="font-mono text-xs text-slate-400">
                          {cert.student_usn || 'USN Recorded'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {cert.issued_at
                          ? new Date(cert.issued_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'Recent'}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            isValid
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isValid ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          <span>{cert.status}</span>
                        </span>
                        {!isValid && cert.revocation_reason && (
                          <p className="text-[10px] text-rose-600 mt-0.5 truncate max-w-xs" title={cert.revocation_reason}>
                            Reason: {cert.revocation_reason}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* QR Preview Button */}
                          {cert.qr_code_data_url && (
                            <button
                              type="button"
                              onClick={() => setPreviewQrCert(cert)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                              title="View QR Code"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                          )}

                          {/* Verify Link */}
                          <a
                            href={`/verify/${cert.verification_token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Open Public Verification Screen"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>

                          {/* Download PDF */}
                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(cert)}
                            className="p-1.5 text-slate-600 hover:text-navy-950 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Download Certificate PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* Revoke Button (Only if valid) */}
                          {isValid && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCertForRevoke(cert);
                                setRevokeReason('');
                                setActionError('');
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revocation Confirmation Modal */}
      {selectedCertForRevoke && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 text-rose-600">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="text-sm font-bold text-slate-900">Revoke Official Certificate</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCertForRevoke(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Revoking will immediately mark this certificate as <strong>REVOKED</strong> on the public verification portal. Anyone scanning the QR code will see this revocation notice.
              </span>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <div><strong>Certificate:</strong> {selectedCertForRevoke.certificate_number} ({selectedCertForRevoke.document_type_name})</div>
              <div><strong>Recipient:</strong> {selectedCertForRevoke.student_name} ({selectedCertForRevoke.student_usn})</div>
            </div>

            {actionError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {actionError}
              </div>
            )}

            <form onSubmit={handleConfirmRevoke} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mandatory Revocation Reason:
                </label>
                <textarea
                  required
                  rows={3}
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="e.g. Issued with erroneous course credits; superseded by CERT-2026-8910"
                  className="input-field"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCertForRevoke(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={revokeLoading || !revokeReason.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 flex items-center gap-2"
                >
                  {revokeLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Recording Revocation...</span>
                    </>
                  ) : (
                    <span>Confirm Revocation</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal Preview */}
      {previewQrCert && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-center space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Official Verification QR</h3>
              <button
                type="button"
                onClick={() => setPreviewQrCert(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block">
              <img
                src={previewQrCert.qr_code_data_url}
                alt="Verification QR Code"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <div className="text-xs text-slate-600">
              <p className="font-semibold text-slate-800">{previewQrCert.certificate_number}</p>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs mx-auto">
                {`${window.location.origin}/verify/${previewQrCert.verification_token}`}
              </p>
            </div>

            <a
              href={`/verify/${previewQrCert.verification_token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full text-xs py-2 inline-flex items-center justify-center gap-1.5"
            >
              <span>Test Public Verification Screen</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
