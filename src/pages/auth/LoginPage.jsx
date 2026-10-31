import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, ShieldCheck, Mail, KeyRound, AlertCircle, Info, Loader2, ShieldAlert } from 'lucide-react';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

export const LoginPage = () => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  const { loginAdmin, loginUser } = useAuth();
  const navigate = useNavigate();

  // Handle countdown timer for brute-force lockout
  useEffect(() => {
    let interval = null;
    if (lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev <= 1) {
            setFailedAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [lockoutTimer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lockoutTimer > 0) return;

    setError('');
    setLoading(true);

    try {
      if (isAdminMode) {
        const profile = await loginAdmin(email.trim(), otp.trim());
        setFailedAttempts(0);
        navigate('/admin/dashboard');
      } else {
        const profile = await loginUser(email.trim(), otp.trim());
        setFailedAttempts(0);
        if (profile.role === 'admin' || profile.role === 'office_staff') {
          navigate('/admin/dashboard');
        } else {
          navigate('/student/dashboard');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        setLockoutTimer(LOCKOUT_SECONDS);
        setError(`Too many failed attempts. Temporary security lockout active for ${LOCKOUT_SECONDS} seconds.`);
      } else {
        // Generic, uniform error message to prevent account enumeration
        const remaining = MAX_FAILED_ATTEMPTS - newAttempts;
        setError(`Invalid credentials. Please verify your email and OTP. (${remaining} attempt${remaining === 1 ? '' : 's'} remaining)`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-navy-950 flex items-center justify-center text-blue-400 shadow-xl border border-navy-800">
            <GraduationCap className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-navy-950">
          CampusDocs Portal
        </h2>
        <p className="mt-1 text-center text-sm text-slate-500 font-medium">
          Smart Institutional Document Request & Verification Platform
        </p>

        {/* Mode Selector Tabs */}
        <div className="mt-6 p-1 bg-slate-200 rounded-xl flex items-center shadow-inner">
          <button
            type="button"
            onClick={() => {
              setIsAdminMode(false);
              setError('');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              !isAdminMode
                ? 'bg-white text-navy-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Student / Staff
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdminMode(true);
              setError('');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              isAdminMode
                ? 'bg-navy-950 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Admin / Dean
          </button>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200/80 sm:px-10">
          {/* Form Header */}
          <div className="mb-6 border-b border-slate-100 pb-4">
            <h3 className="text-base font-semibold text-slate-800">
              {isAdminMode ? 'Administrator Sign In' : 'Student & Faculty Sign In'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your registered institutional email and designated OTP code
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Institutional Email Address
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isAdminMode ? 'admin@college.edu' : 'student@college.edu'}
                  className="input-field pl-9"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Authentication OTP Code
                </label>
                <span className="text-[11px] text-slate-400">4-8 digits</span>
              </div>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  pattern="^[0-9]{4,8}$"
                  title="OTP must be between 4 and 8 digits"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="e.g. 482913"
                  className="input-field pl-9 tracking-widest font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || lockoutTimer > 0}
              className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 ${
                lockoutTimer > 0
                  ? 'bg-amber-600 text-white cursor-not-allowed opacity-80'
                  : isAdminMode
                  ? 'bg-navy-950 hover:bg-navy-900 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } disabled:opacity-50`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : lockoutTimer > 0 ? (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  <span>Locked Out ({lockoutTimer}s)</span>
                </>
              ) : (
                <span>Access Portal</span>
              )}
            </button>
          </form>

          {/* Institutional Provisioning Notice */}
          <div className="mt-6 pt-5 border-t border-slate-100 bg-slate-50 -mx-6 -mb-8 px-6 py-4 rounded-b-2xl">
            <div className="flex items-start gap-2 text-xs text-slate-600">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-700">Account Provisioning Notice:</span>
                <p className="mt-0.5 text-[11px] text-slate-500 leading-relaxed">
                  Student and faculty accounts are registered directly by college administration. If you have not received your OTP or require an OTP regeneration, contact your administrative desk.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
