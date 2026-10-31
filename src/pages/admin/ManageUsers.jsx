import React, { useState, useEffect } from 'react';
import {
  getAdminUsers,
  createAdminUser,
  deleteAdminUser,
  regenerateUserOtp
} from '../../services/adminService';
import {
  Users,
  UserPlus,
  KeyRound,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Search,
  Shield,
  GraduationCap
} from 'lucide-react';

export const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('student');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [usn, setUsn] = useState('');
  const [dept, setDept] = useState('');
  const [role, setRole] = useState('student');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Generated OTP Modal / Callout State
  const [generatedUser, setGeneratedUser] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getAdminUsers({ role: roleFilter, limit: 100 });
      setUsers(data.items || []);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to fetch users from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  // Create User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');

    // Ensure phone starts with + or contains 10-15 digits
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+91${formattedPhone}`;
    }

    const payload = {
      role,
      name: name.trim(),
      email_id: email.trim(),
      phone_number: formattedPhone,
    };

    if (role === 'student') {
      payload.usn = usn.trim().toUpperCase();
      payload.dept = dept.trim();
    } else {
      payload.dept = dept.trim() || undefined;
      payload.designation = 'Staff Member';
    }

    try {
      setSubmitting(true);
      const res = await createAdminUser(payload);
      setGeneratedUser(res); // Shows OTP to admin!
      setName('');
      setEmail('');
      setPhone('');
      setUsn('');
      setDept('');
      await fetchUsers();
    } catch (err) {
      console.error('Failed to create user:', err);
      const detail =
        err.response?.data?.error?.message ||
        err.response?.data?.detail ||
        'Failed to provision account. Check email uniqueness and valid USN format.';
      setError(detail);
    } finally {
      setSubmitting(false);
    }
  };

  // Regenerate OTP
  const handleRegenerateOtp = async (emailId) => {
    try {
      const res = await regenerateUserOtp(emailId);
      setGeneratedUser(res);
      alert(`New OTP for ${emailId}: ${res.otp}`);
    } catch (err) {
      console.error('Failed to regenerate OTP:', err);
      alert('Failed to regenerate OTP.');
    }
  };

  // Delete User
  const handleDeleteUser = async (emailId) => {
    if (!window.confirm(`Are you sure you want to delete user ${emailId}?`)) return;

    try {
      await deleteAdminUser(emailId);
      await fetchUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Failed to delete user account.');
    }
  };

  const handleCopyOtp = (otp) => {
    navigator.clipboard.writeText(otp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const uname = (u.name || '').toLowerCase();
    const uemail = (u.email_id || '').toLowerCase();
    const uusn = (u.usn || '').toLowerCase();
    const udept = (u.dept || '').toLowerCase();
    return uname.includes(q) || uemail.includes(q) || uusn.includes(q) || udept.includes(q);
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          User Account Provisioning
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Create student or staff accounts, manage credentials, and generate authentication OTPs
        </p>
      </div>

      {/* Generated OTP Announcement Card (Very Important!) */}
      {generatedUser && (
        <div className="p-6 bg-emerald-50 border-2 border-emerald-300 rounded-2xl shadow-lg space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-950">
                  Account Successfully Provisioned!
                </h3>
                <p className="text-xs text-emerald-700">
                  Share this generated OTP with the user so they can log in to the portal
                </p>
              </div>
            </div>
            <button
              onClick={() => setGeneratedUser(null)}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-emerald-200">
            <div>
              <span className="text-[11px] text-slate-400 block">User Name</span>
              <span className="text-xs font-bold text-slate-800">{generatedUser.name}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Email ID</span>
              <span className="text-xs font-mono font-semibold text-slate-800">{generatedUser.email_id}</span>
            </div>
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <div>
                <span className="text-[11px] text-slate-400 block">One-Time Password (OTP)</span>
                <span className="text-base font-mono font-extrabold text-emerald-600 tracking-wider">
                  {generatedUser.otp}
                </span>
              </div>
              <button
                onClick={() => handleCopyOtp(generatedUser.otp)}
                className="btn-secondary text-xs py-1 px-2.5 ml-2"
                title="Copy OTP"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Provisioning Form */}
        <div className="card lg:col-span-1 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <UserPlus className="w-4 h-4 text-navy-900" />
            <h2 className="text-sm font-bold text-slate-900">Provision New Account</h2>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Account Role <span className="text-red-500">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="input-field text-xs"
              >
                <option value="student">Student</option>
                <option value="office_staff">Office Staff (Student Affairs)</option>
                <option value="faculty">Faculty Member</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Sharma"
                className="input-field text-xs"
              />
            </div>

            {role === 'student' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  University Seat No. (USN) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  pattern="^[A-Za-z0-9]{5,20}$"
                  title="5-20 alphanumeric characters"
                  value={usn}
                  onChange={(e) => setUsn(e.target.value)}
                  placeholder="e.g. 1RV21CS045"
                  className="input-field text-xs uppercase font-mono"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={60}
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                placeholder="e.g. Computer Science & Eng"
                className="input-field text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Institutional Email ID <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@college.edu"
                className="input-field text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="input-field text-xs"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Will auto-prefix with +91 if country code omitted
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full text-xs mt-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Provisioning Account...</span>
                </>
              ) : (
                <span>Generate Account & OTP</span>
              )}
            </button>
          </form>
        </div>

        {/* Existing Users Directory */}
        <div className="card lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-navy-900" />
              <h2 className="text-sm font-bold text-slate-900">Provisioned Accounts</h2>
            </div>

            <div className="flex items-center gap-1">
              {['student', 'office_staff', 'faculty'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold capitalize transition-all ${
                    roleFilter === r
                      ? 'bg-navy-900 text-white'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {r.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by name, email, USN or department..."
              className="input-field pl-8 text-xs py-2"
            />
          </div>

          {loading ? (
            <div className="py-16 flex justify-center items-center">
              <Loader2 className="w-6 h-6 animate-spin text-navy-900" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No registered {roleFilter.replace('_', ' ')} accounts found.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((u) => (
                <div
                  key={u.email_id}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900">{u.name}</span>
                      {u.usn && (
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {u.usn}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">{u.email_id}</div>
                    <div className="text-[11px] text-slate-400">
                      Dept: {u.dept || 'General'} • Phone: {u.phone_number}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleRegenerateOtp(u.email_id)}
                      className="btn-secondary text-[11px] py-1 px-2.5"
                      title="Regenerate OTP code"
                    >
                      <KeyRound className="w-3 h-3 text-amber-600" />
                      <span>New OTP</span>
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.email_id)}
                      className="btn-danger text-[11px] py-1 px-2.5"
                      title="Delete account"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
