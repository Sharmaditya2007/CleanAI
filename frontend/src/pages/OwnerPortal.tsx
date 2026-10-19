import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Camera,
  MapPin,
  Loader2,
  Sparkles,
  Info,
  ShieldCheck,
  Check,
  X,
  LogOut,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  User
} from 'lucide-react';
import { api, getMediaUrl } from '../services/api';
import { Toilet, CleaningTask } from '../types';
import { useAuth } from '../context/AuthContext';

export const OwnerPortal: React.FC = () => {
  const { user, login, register, logout } = useAuth();

  const [searchParams] = useSearchParams();
  const [isRegister, setIsRegister] = useState(() => searchParams.get('mode') === 'register');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Email OTP verification states for owner
  const [ownerOtpSent, setOwnerOtpSent] = useState(false);
  const [ownerOtpCode, setOwnerOtpCode] = useState('');
  const [ownerOtpVerified, setOwnerOtpVerified] = useState(false);
  const [ownerOtpLoading, setOwnerOtpLoading] = useState(false);
  const [ownerOtpCooldown, setOwnerOtpCooldown] = useState(0);
  const [ownerDebugOtp, setOwnerDebugOtp] = useState<string | null>(null);

  // Portal state
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [tasks, setTasks] = useState<CleaningTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'toilets' | 'tasks'>('toilets');

  // Register toilet modal
  const [showRegModal, setShowRegModal] = useState(false);
  const [regForm, setRegForm] = useState({
    name: '',
    address: '',
    city: '',
    locality: '',
    latitude: 0,
    longitude: 0,
    description: '',
    facilities: ['Running Water', 'Washbasin', 'Western WC'],
    opening_hours: '06:00 - 23:00',
    accessibility: true,
    contact_number: ''
  });
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);

  // Report cleaning modal
  const [activeTaskForReport, setActiveTaskForReport] = useState<CleaningTask | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [afterPhoto, setAfterPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const isOwner = user && user.role === 'owner';

  useEffect(() => {
    if (isOwner) {
      loadOwnerData();
    }
  }, [isOwner]);

  const loadOwnerData = async () => {
    setLoading(true);
    try {
      const [tList, tkList] = await Promise.all([
        api.getToilets({ owner_only: true }),
        api.getTasks()
      ]);
      setToilets(tList);
      setTasks(tkList);
    } catch (e) {
      console.error('Failed to load owner data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ownerOtpCooldown > 0) {
      const timer = setTimeout(() => setOwnerOtpCooldown(ownerOtpCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [ownerOtpCooldown]);

  const handleSendOwnerOTP = async () => {
    // 1. All registration fields are strictly mandatory before requesting OTP
    if (!ownerName.trim()) {
      setAuthError('Please enter your Full Name before requesting a verification code.');
      setAuthSuccess(null);
      return;
    }
    if (!ownerPassword.trim() || ownerPassword.length < 6) {
      setAuthError('Please create a password of at least 6 characters before requesting a verification code.');
      setAuthSuccess(null);
      return;
    }
    if (!ownerEmail.trim() || !ownerEmail.includes('@') || !ownerEmail.includes('.')) {
      setAuthError('Please enter a valid owner/contractor email address before requesting a verification code.');
      setAuthSuccess(null);
      return;
    }
    setAuthError(null);
    setAuthSuccess(null);
    setOwnerOtpLoading(true);
    try {
      const res = await api.sendOTP(ownerEmail, 'registration');
      setOwnerOtpSent(true);
      setOwnerOtpCooldown(60);
      if (res.debug_otp) {
        setOwnerDebugOtp(res.debug_otp);
      } else {
        setOwnerDebugOtp(null);
      }
      setAuthSuccess(res.message);
      if (res.debug_otp) {
        console.log(`[Clean AI Verification Code]: ${res.debug_otp}`);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Failed to send verification code.');
    } finally {
      setOwnerOtpLoading(false);
    }
  };

  const handleVerifyOwnerOTP = async () => {
    if (!ownerOtpCode.trim() || ownerOtpCode.trim().length < 6) {
      setAuthError('Please enter the 6-digit verification code.');
      setAuthSuccess(null);
      return;
    }
    setAuthError(null);
    setAuthSuccess(null);
    setOwnerOtpLoading(true);
    try {
      const res = await api.verifyOTP(ownerEmail, ownerOtpCode, 'registration');
      setOwnerOtpVerified(true);
      setAuthSuccess(res.message);
    } catch (err: any) {
      setAuthError(err.message || 'Incorrect verification code. Please check your inbox and try again.');
    } finally {
      setOwnerOtpLoading(false);
    }
  };

  const handleOwnerAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (isRegister && !ownerOtpVerified) {
      setAuthError('Please click "Send OTP" and enter the 6-digit verification code sent to your email before completing registration.');
      return;
    }

    setAuthLoading(true);
    try {
      if (isRegister) {
        await register({
          email: ownerEmail,
          password: ownerPassword,
          full_name: ownerName,
          role: 'owner',
          otp_code: ownerOtpCode.trim() || undefined
        });
      } else {
        await login(ownerEmail, ownerPassword);
      }
    } catch (err: any) {
      setAuthError(err.message || (isRegister ? 'Registration failed.' : 'Login failed. Please check contractor credentials.'));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.name || !regForm.address || !regForm.locality) {
      alert('Please fill out all required facility fields.');
      return;
    }

    setIsSubmittingReg(true);
    try {
      await api.registerToilet(regForm as any);
      setShowRegModal(false);
      setRegForm({
        name: '',
        address: '',
        city: '',
        locality: '',
        latitude: 0,
        longitude: 0,
        description: '',
        facilities: ['Running Water', 'Washbasin', 'Western WC'],
        opening_hours: '06:00 - 23:00',
        accessibility: true,
        contact_number: ''
      });
      await loadOwnerData();
      alert('Sanitation facility submitted and added to your assigned facilities.');
    } catch (err: any) {
      alert(err.message || 'Registration failed');
    } finally {
      setIsSubmittingReg(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAfterPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleReportCompletionSubmit = async () => {
    if (!activeTaskForReport) return;
    if (!completionNotes.trim()) {
      alert('Please enter cleaning notes describing the maintenance completed.');
      return;
    }

    setIsSubmittingReport(true);
    try {
      await api.reportCleaningCompletion(
        activeTaskForReport.id,
        completionNotes,
        afterPhoto || undefined
      );

      setActiveTaskForReport(null);
      setCompletionNotes('');
      setAfterPhoto(null);
      setPhotoPreview(null);
      await loadOwnerData();
      alert('Cleaning completion reported! Status is now Verification Pending for municipal officer review. Note that official verified status only updates when confirmed by an officer.');
    } catch (err: any) {
      alert(err.message || 'Report submission failed');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Clean':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={12} />
            Clean
          </span>
        );
      case 'Needs Cleaning':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle size={12} />
            Needs Cleaning
          </span>
        );
      case 'Under Maintenance':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Under Maintenance
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
            {status}
          </span>
        );
    }
  };

  // If not logged in as owner, show secure Owner Login / Sign Up screen
  if (!isOwner) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 space-y-6 text-[#F5F5F7]">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#141414] border border-[#262626] flex items-center justify-center mx-auto text-[#F5F5F7]">
            <Building2 size={26} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isRegister ? 'Register Facility Owner' : 'Facility Owner Access'}
          </h1>
          <p className="text-xs text-[#A1A1A6]">
            {isRegister ? 'Create an account to register facilities and manage cleaning tasks.' : 'Secure portal for toilet owners and sanitation maintenance contractors.'}
          </p>
        </div>

        <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-6 space-y-5 shadow-xl">
          {/* Segment switch tabs */}
          <div className="grid grid-cols-2 p-1 bg-[#141414] border border-[#262626] rounded-xl text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setAuthError(null);
                setAuthSuccess(null);
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                !isRegister
                  ? 'bg-[#F5F5F7] text-[#050505] font-semibold shadow-xs'
                  : 'text-[#A1A1A6] hover:text-[#F5F5F7]'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setAuthError(null);
                setAuthSuccess(null);
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                isRegister
                  ? 'bg-[#F5F5F7] text-[#050505] font-semibold shadow-xs'
                  : 'text-[#A1A1A6] hover:text-[#F5F5F7]'
              }`}
            >
              Sign Up
            </button>
          </div>

          {authSuccess && (
            <div className="p-3.5 rounded-xl bg-[#161616] border border-[#262626] text-[#F5F5F7] text-xs flex items-center gap-2.5 shadow-sm">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
              <span className="leading-relaxed font-medium text-[#F5F5F7]">{authSuccess}</span>
            </div>
          )}

          {authError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{authError}</span>
              </div>
              {authError.toLowerCase().includes('already') && isRegister && (
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setAuthError(null);
                    setAuthSuccess(null);
                  }}
                  className="self-start text-[11px] font-medium text-white underline underline-offset-2 hover:text-[#A1A1A6] transition-colors"
                >
                  Already registered? Click here to Log In &rarr;
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleOwnerAuth} className="space-y-4">
            {isRegister && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#A1A1A6]">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" />
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder=""
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#161616] border border-[#262626] rounded-xl text-xs text-[#F5F5F7] focus:border-[#F5F5F7]/40 focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#A1A1A6]">
                  Owner / Contractor Email {isRegister && <span className="text-rose-400">*</span>}
                </label>
                {isRegister && ownerOtpVerified && (
                  <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Verified
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" />
                  <input
                    type="email"
                    required
                    disabled={isRegister && ownerOtpVerified}
                    value={ownerEmail}
                    onChange={(e) => {
                      setOwnerEmail(e.target.value);
                      if (ownerOtpVerified) {
                        setOwnerOtpVerified(false);
                        setOwnerOtpSent(false);
                        setOwnerOtpCode('');
                      }
                    }}
                    placeholder=""
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#161616] border border-[#262626] rounded-xl text-xs text-[#F5F5F7] focus:border-[#F5F5F7]/40 focus:outline-hidden"
                  />
                </div>
                {isRegister && !ownerOtpVerified && (
                  <button
                    type="button"
                    disabled={ownerOtpLoading || ownerOtpCooldown > 0}
                    onClick={handleSendOwnerOTP}
                    className="px-3 py-2.5 rounded-xl bg-[#161616] hover:bg-[#202020] border border-[#262626] text-xs font-semibold text-[#F5F5F7] transition-all cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {ownerOtpLoading ? (
                      <Loader2 size={14} className="animate-spin text-[#F5F5F7]" />
                    ) : ownerOtpCooldown > 0 ? (
                      <span>Resend ({ownerOtpCooldown}s)</span>
                    ) : (
                      <span>{ownerOtpSent ? 'Resend' : 'Send OTP'}</span>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Owner 6-Digit Email OTP Box */}
            {isRegister && ownerOtpSent && !ownerOtpVerified && (
              <div className="p-3.5 rounded-xl bg-[#161616] border border-[#262626] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-[#F5F5F7] text-xs">Enter 6-Digit Verification Code</label>
                  <span className="text-[10px] text-[#A1A1A6]">Sent to owner email</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={ownerOtpCode}
                    onChange={(e) => setOwnerOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 p-2 bg-[#1C1C1E] border border-[#333333] rounded-lg text-[#F5F5F7] font-mono text-center tracking-[4px] text-sm font-bold focus:border-[#F5F5F7]/40 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    disabled={ownerOtpLoading || ownerOtpCode.length < 6}
                    onClick={handleVerifyOwnerOTP}
                    className="px-4 py-2 rounded-lg bg-[#F5F5F7] hover:bg-white text-[#050505] font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {ownerOtpLoading ? <Loader2 size={14} className="animate-spin text-[#050505]" /> : 'Verify'}
                  </button>
                </div>
                {ownerDebugOtp && (
                  <div className="flex items-center justify-between text-xs bg-[#1C1C1E] border border-[#262626] px-3 py-1.5 rounded-lg text-[#F5F5F7]">
                    <span>Cloud Fallback Code: <strong className="text-white">{ownerDebugOtp}</strong></span>
                    <button
                      type="button"
                      onClick={() => setOwnerOtpCode(ownerDebugOtp)}
                      className="underline text-[11px] font-semibold cursor-pointer hover:text-white ml-2 text-[#A1A1A6]"
                    >
                      Auto-fill
                    </button>
                  </div>
                )}
                <p className="text-[11px] text-[#A1A1A6] flex items-center gap-1.5 font-medium">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                  <span>Verification code dispatched to <strong className="text-[#F5F5F7] font-semibold">{ownerEmail}</strong></span>
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#A1A1A6]">
                Password {isRegister && <span className="text-rose-400">* <span className="text-[10px] text-[#6E6E73] font-normal">(min 6 chars)</span></span>}
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  placeholder=""
                  className="w-full pl-10 pr-10 py-2.5 bg-[#161616] border border-[#262626] rounded-xl text-xs text-[#F5F5F7] focus:border-[#F5F5F7]/40 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6E73] hover:text-[#F5F5F7] transition-colors p-0.5 rounded cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-[#050505] bg-[#F5F5F7] hover:bg-white transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {authLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin text-[#050505]" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>{isRegister ? 'Register as Facility Owner' : 'Log In as Facility Owner'}</span>
              )}
            </button>
          </form>

          {/* Toggle between Log In and Sign Up */}
          <div className="text-center pt-2 border-t border-[#1F1F1F]">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setAuthError(null);
                setAuthSuccess(null);
              }}
              className="text-xs text-[#A1A1A6] hover:text-[#F5F5F7] transition-colors cursor-pointer"
            >
              {isRegister ? (
                <span>Already have an owner account? <strong className="text-[#F5F5F7] underline">Log In</strong></span>
              ) : (
                <span>Need a facility owner account? <strong className="text-[#F5F5F7] underline">Sign Up</strong></span>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-[#F5F5F7]">
      
      {/* Top Banner */}
      <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#161616] border border-[#262626] text-xs font-medium text-[#A1A1A6]">
            <Building2 size={14} className="text-[#2997FF]" />
            <span>Facility Owner & Contractor Access</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F5F7]">
            Owner Portal
          </h1>
          <p className="text-xs sm:text-sm text-[#A1A1A6]">
            Logged in as <strong className="text-[#F5F5F7]">{user?.full_name || 'Facility Contractor'}</strong> ({user?.organization || 'Sanitation Services'})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRegModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#050505] bg-[#F5F5F7] hover:bg-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <PlusCircle size={14} />
            <span>Register Facility</span>
          </button>
          <button
            onClick={() => logout()}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut size={13} />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Critical Status Rule Notice */}
      <div className="bg-[#121212] border border-[#262626] rounded-xl p-4 flex items-start gap-3 text-xs text-[#A1A1A6]">
        <Info size={16} className="text-[#2997FF] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-[#F5F5F7]">Important Rule:</strong> Owner-reported cleaning completions update maintenance records for municipal review. However, the public verified status will <span className="text-[#F5F5F7] underline">only</span> change once certified by an authorized municipal health officer.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#262626] pb-3 text-xs font-medium">
        <button
          id="owner-tab-toilets"
          onClick={() => setActiveTab('toilets')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'toilets'
              ? 'bg-[#F5F5F7] text-[#050505] font-semibold'
              : 'text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-[#141414]'
          }`}
        >
          My Facilities ({toilets.length})
        </button>

        <button
          id="owner-tab-tasks"
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'tasks'
              ? 'bg-[#F5F5F7] text-[#050505] font-semibold'
              : 'text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-[#141414]'
          }`}
        >
          Cleaning & Maintenance Tasks ({tasks.length})
        </button>
      </div>

      {/* TAB 1: MY FACILITIES */}
      {activeTab === 'toilets' && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 size={24} className="animate-spin mx-auto text-[#F5F5F7]" />
              <p className="text-xs text-[#A1A1A6]">Loading assigned facilities...</p>
            </div>
          ) : toilets.length === 0 ? (
            <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-12 text-center space-y-3">
              <p className="text-xs text-[#A1A1A6]">You have no facilities currently registered under your account.</p>
              <button
                onClick={() => setShowRegModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#F5F5F7] text-[#050505] hover:bg-white cursor-pointer"
              >
                Register Your First Facility
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {toilets.map((toilet) => (
                <div
                  key={toilet.id}
                  className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-5 space-y-4 shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-[#F5F5F7]">{toilet.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-[#A1A1A6] mt-0.5">
                        <MapPin size={12} className="text-[#6E6E73]" />
                        <span>{toilet.locality}, {toilet.city}</span>
                      </div>
                    </div>
                    {getStatusBadge(toilet.verified_status)}
                  </div>

                  <p className="text-xs text-[#8E8E93] line-clamp-2">{toilet.address}</p>

                  <div className="pt-3 border-t border-[#1C1C1E] flex items-center justify-between text-xs text-[#A1A1A6]">
                    <div>
                      Last Inspection: <strong className="text-[#F5F5F7]">{toilet.last_inspected_at ? new Date(toilet.last_inspected_at).toLocaleDateString() : 'Pending'}</strong>
                    </div>
                    <div>
                      Citizen Complaints: <span className="font-semibold text-amber-400">{toilet.total_complaints || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CLEANING TASKS & REPORTING */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-12 text-center text-xs text-[#A1A1A6]">
              No active cleaning tasks assigned.
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-5 space-y-3 shadow-lg"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1C1C1E] pb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-[#F5F5F7]">{task.toilet_name}</h4>
                      <div className="text-[11px] text-[#6E6E73] mt-0.5">
                        Assigned on {new Date(task.created_at).toLocaleDateString()} • Priority: <span className="font-semibold text-rose-400">{task.priority}</span>
                      </div>
                    </div>

                    <div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        task.status === 'Completed' || task.status === 'Verified'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : task.status === 'Cleaning Reported' || task.status === 'Verification Pending'
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs space-y-2">
                    {task.notes && (
                      <p className="p-3 bg-[#141414] rounded-xl text-[#A1A1A6] border border-[#262626]">
                        {task.notes}
                      </p>
                    )}

                    {task.completion_notes && (
                      <div className="p-2.5 rounded-lg bg-[#161616] text-[#A1A1A6] text-[11px]">
                        <strong>Reported completion notes:</strong> {task.completion_notes}
                      </div>
                    )}
                  </div>

                  {/* Report Button */}
                  <div className="pt-2 flex justify-end">
                    {task.status !== 'Cleaning Reported' && task.status !== 'Completed' && task.status !== 'Verified' && (
                      <button
                        onClick={() => setActiveTaskForReport(task)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-[#050505] bg-[#F5F5F7] hover:bg-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <Check size={14} />
                        <span>Report Cleaning Completed</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Report Cleaning Modal */}
      {activeTaskForReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212] border border-[#262626] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#F5F5F7]">
                Report Cleaning: {activeTaskForReport.toilet_name}
              </h3>
              <button
                onClick={() => {
                  setActiveTaskForReport(null);
                  setPhotoPreview(null);
                  setAfterPhoto(null);
                }}
                className="text-[#6E6E73] hover:text-[#F5F5F7]"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[#A1A1A6]">
              Enter the work completed by the sanitation staff. Note that municipal verified status will only change after municipal officer inspection.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#A1A1A6]">
                Cleaning Notes <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder=""
                className="w-full px-3 py-2 bg-[#161616] border border-[#262626] rounded-xl text-xs text-[#F5F5F7] focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#A1A1A6]">
                After-Cleaning Photo (Optional)
              </label>
              {photoPreview ? (
                <div className="relative inline-block border border-[#333333] rounded-lg overflow-hidden">
                  <img src={photoPreview} alt="Preview" className="w-36 h-24 object-cover" />
                  <button
                    onClick={() => {
                      setAfterPhoto(null);
                      setPhotoPreview(null);
                    }}
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-black/70 text-white"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 p-3 border border-dashed border-[#262626] rounded-xl text-xs text-[#A1A1A6] hover:bg-[#161616] cursor-pointer">
                  <Camera size={16} className="text-[#6E6E73]" />
                  <span>Attach proof photo</span>
                  <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                </label>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setActiveTaskForReport(null);
                  setPhotoPreview(null);
                  setAfterPhoto(null);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#A1A1A6] hover:text-[#F5F5F7] bg-[#161616] cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isSubmittingReport}
                onClick={handleReportCompletionSubmit}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#F5F5F7] hover:bg-white text-[#050505] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmittingReport ? (
                  <>
                    <Loader2 size={13} className="animate-spin text-[#050505]" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Cleaning Report</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Facility Modal */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#121212] border border-[#262626] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <h3 className="text-sm font-semibold text-[#F5F5F7]">Register Public Facility</h3>
              <button onClick={() => setShowRegModal(false)} className="text-[#6E6E73] hover:text-[#F5F5F7]">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#A1A1A6]">Facility Name *</label>
                <input
                  type="text"
                  required
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  placeholder=""
                  className="w-full px-3 py-2 bg-[#161616] border border-[#262626] rounded-xl text-xs text-[#F5F5F7] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#A1A1A6]">City *</label>
                  <input
                    type="text"
                    required
                    value={regForm.city}
                    onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                    className="w-full px-3 py-2 bg-[#161616] border border-[#262626] rounded-xl text-xs text-[#F5F5F7] focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#A1A1A6]">Locality *</label>
                  <input
                    type="text"
                    required
                    value={regForm.locality}
                    onChange={(e) => setRegForm({ ...regForm, locality: e.target.value })}
                    className="w-full px-3 py-2 bg-[#161616] border border-[#262626] rounded-xl text-xs text-[#F5F5F7] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[#A1A1A6]">Address *</label>
                <input
                  type="text"
                  required
                  value={regForm.address}
                  onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-[#161616] border border-[#262626] rounded-xl text-xs text-[#F5F5F7] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#A1A1A6] bg-[#161616] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReg}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#F5F5F7] hover:bg-white text-[#050505] cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingReg ? 'Submitting...' : 'Register Toilet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
