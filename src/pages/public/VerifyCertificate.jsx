import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { verifyCertificate } from '../../services/certificateService';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileCheck2,
  Calendar,
  Building,
  UserCheck,
  GraduationCap,
  Loader2,
  ArrowLeft,
  ExternalLink,
  Lock,
} from 'lucide-react';

export const VerifyCertificate = () => {
  const { token } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function runVerification() {
      if (!token) {
        setResult({ valid: false, status: 'INVALID', error: 'Missing token' });
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await verifyCertificate(token);
        setResult(res);
      } catch (err) {
        setResult({
          valid: false,
          status: 'INVALID',
          message: 'Unable to verify token against institutional registry.',
        });
      } finally {
        setLoading(false);
      }
    }

    runVerification();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-navy-950 text-blue-400 mx-auto flex items-center justify-center shadow-lg border border-navy-800">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-navy-950 tracking-tight">
            CampusDocs Verification Portal
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Official Cryptographic Academic Credential & Certificate Verification
          </p>
        </div>

        {/* Verification Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-xs text-slate-500 font-medium">
                Verifying cryptographic token against institutional ledger...
              </span>
            </div>
          ) : result?.status === 'VALID' ? (
            <div>
              {/* Green Valid Banner */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mx-auto shadow-inner">
                  <ShieldCheck className="w-9 h-9 text-emerald-100" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">
                  VALID & AUTHENTIC CERTIFICATE
                </h2>
                <p className="text-xs text-emerald-100 max-w-md mx-auto">
                  This document has been verified against the official registrar's cryptographic ledger.
                </p>
              </div>

              {/* Certificate Details */}
              <div className="p-6 sm:p-8 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 space-y-1">
                    <span className="text-slate-400 font-medium block">Document Type</span>
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4 text-blue-600" />
                      {result.document_type_name || 'Academic Certificate'}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 space-y-1">
                    <span className="text-slate-400 font-medium block">Certificate Serial No.</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {result.certificate_number}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 space-y-1">
                    <span className="text-slate-400 font-medium block">Issuing Authority</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-indigo-600" />
                      {result.institution_name || 'CampusDocs Institutional Academy'}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 space-y-1">
                    <span className="text-slate-400 font-medium block">Issue Date</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      {result.issued_at ? new Date(result.issued_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Verified'}
                    </span>
                  </div>
                </div>

                {/* Masked Student Identity Notice */}
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-3">
                  <UserCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-blue-900 block">
                      Registered Student: {result.masked_student}
                    </span>
                    <p className="text-blue-700 mt-0.5 leading-relaxed">
                      For student privacy and GDPR/FERPA compliance, full identity details are masked on public verification screens.
                    </p>
                  </div>
                </div>

                {/* Cryptographic Proof Footer */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Cryptographically Signed via SHA-256 Token</span>
                  </span>
                  <span className="font-mono truncate max-w-[200px]">
                    Ref: {token.slice(0, 16)}...
                  </span>
                </div>
              </div>
            </div>
          ) : result?.status === 'REVOKED' ? (
            <div>
              {/* Red Revoked Banner */}
              <div className="bg-gradient-to-r from-rose-600 to-red-700 text-white p-6 text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mx-auto shadow-inner">
                  <ShieldAlert className="w-9 h-9 text-rose-100" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">
                  CERTIFICATE REVOKED
                </h2>
                <p className="text-xs text-rose-100 max-w-md mx-auto">
                  This document was previously issued but has been formally revoked by institutional authorities.
                </p>
              </div>

              <div className="p-6 sm:p-8 space-y-5">
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 text-xs text-rose-800">
                  <span className="font-bold block">Official Revocation Reason:</span>
                  <p className="font-medium leading-relaxed">
                    {result.revocation_reason}
                  </p>
                  {result.revoked_at && (
                    <span className="text-[11px] text-rose-600 block mt-2">
                      Revocation recorded on: {new Date(result.revoked_at).toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block mb-0.5">Certificate No.</span>
                    <span className="font-mono font-bold text-slate-800">
                      {result.certificate_number}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block mb-0.5">Document Type</span>
                    <span className="font-semibold text-slate-800">
                      {result.document_type_name}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 text-center">
                  This certificate is no longer legally valid for submission, migration, or employment verification.
                </p>
              </div>
            </div>
          ) : (
            <div>
              {/* Invalid Banner */}
              <div className="bg-slate-800 text-white p-6 text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-9 h-9 text-amber-400" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">
                  INVALID / UNRECOGNIZED TOKEN
                </h2>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  No authentic certificate record was found matching this verification token.
                </p>
              </div>

              <div className="p-6 sm:p-8 text-center space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                  The token <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[11px]">{token}</code> has either expired, been tampered with, or was not generated by CampusDocs.
                </p>
                <Link
                  to="/login"
                  className="btn-primary inline-flex text-xs py-2 px-4"
                >
                  Return to Portal Home
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="text-center">
          <Link
            to="/login"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go to CampusDocs Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
