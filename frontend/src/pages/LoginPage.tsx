import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Lock, Mail, ArrowRight, Loader2, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { api } from '../services/api';

export const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('officer');
  const [phone, setPhone] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Email OTP verification states
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);

  // Forgot password flow
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

  useEffect(() => {
    let mounted = true;
    api.getHealth()
      .then(() => {
        if (mounted) setServerStatus('online');
      })
      .catch(() => {
        if (mounted) setServerStatus('offline');
      });
    return () => { mounted = false; };
  }, []);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your account email.');
      return;
    }
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await api.forgotPassword(email);
      setSuccessMsg(res.message);
      if (res.reset_token) {
        setResetToken(res.reset_token);
      }
    } catch (err: any) {
      setError(err.message || 'Password reset request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken.trim() || !newPassword.trim()) {
      setError('Please provide the reset token and your new password.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await api.resetPassword(resetToken, newPassword);
      setSuccessMsg(res.message);
      setTimeout(() => {
        setIsForgotPassword(false);
        setResetToken('');
        setNewPassword('');
        setSuccessMsg(null);
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address first.');
      return;
    }
    setError(null);
    setSuccessMsg(null);
    setOtpLoading(true);
    try {
      const res = await api.sendOTP(email, 'registration');
      setOtpSent(true);
      setOtpCooldown(60);
      setSuccessMsg(res.message);
      if (res.debug_otp) {
        setDebugOtp(res.debug_otp);
        console.log(`[Clean AI Verification Code]: ${res.debug_otp}`);
      } else {
        setDebugOtp(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code to this email.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }
    setError(null);
    setSuccessMsg(null);
    setOtpLoading(true);
    try {
      const res = await api.verifyOTP(email, otpCode, 'registration');
      setOtpVerified(true);
      setSuccessMsg(res.message);
    } catch (err: any) {
      setError(err.message || 'Incorrect verification code. Please check your inbox.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (isRegister && !otpVerified) {
      setError('Please click "Send OTP" and enter the 6-digit verification code sent to your email before completing registration.');
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        await register({
          email,
          password,
          full_name: fullName,
          role,
          phone: phone || undefined,
          invite_code: inviteCode.trim() || undefined,
          otp_code: otpCode.trim() || undefined
        });
        if (role === 'officer') navigate('/authority');
        else if (role === 'owner') navigate('/owner');
        else navigate('/toilets');
      } else {
        await login(email, password);
        const profile = await api.getMe().catch(() => null);
        const userRole = profile?.role;
        if (userRole === 'officer') navigate('/authority');
        else if (userRole === 'owner') navigate('/owner');
        else navigate('/toilets');
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || err.name === 'TypeError') {
        setError('Clean AI backend server is unreachable. Please verify the backend is running.');
      } else {
        setError(msg || 'Authentication failed. Please verify your email and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#050505] flex items-center justify-center px-4 py-16">
      <div className="relative w-full max-w-sm bg-[#0D0D0D] rounded-3xl p-8 border border-[#262626] shadow-2xl space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-11 h-11 rounded-2xl bg-[#161616] border border-[#262626] flex items-center justify-center mx-auto text-[#F5F5F7]">
            <Sparkles size={20} />
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-[#F5F5F7]">
            {isForgotPassword ? 'Reset Password' : isRegister ? 'Create Account' : 'Sign In'}
          </h2>
          <p className="text-[11px] text-[#A1A1A6]">
            {isForgotPassword
              ? 'Enter your account email to receive a secure recovery token.'
              : isRegister
              ? 'Join the Clean AI municipal sanitation network.'
              : 'Sign in to access your municipal or facility dashboard.'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] text-xs font-medium flex items-center gap-2.5 shadow-sm">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            <span className="leading-relaxed">{successMsg}</span>
          </div>
        )}

        {isForgotPassword ? (
          /* Forgot / Reset Password Form */
          <div className="space-y-4 text-xs">
            {!resetToken ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block font-semibold text-[#A1A1A6] mb-1.5">Account Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    className="w-full p-3 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] focus:border-[#F5F5F7]/40 focus:outline-hidden transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#F5F5F7] hover:bg-white text-[#050505] font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 text-xs"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin text-[#050505]" />
                  ) : (
                    <span>Request Password Reset</span>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block font-semibold text-[#A1A1A6] mb-1.5">Reset Token</label>
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="w-full p-3 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] font-mono text-[11px] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#A1A1A6] mb-1.5">New Password (min 6 characters)</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full p-3 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] focus:border-[#F5F5F7]/40 focus:outline-hidden transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#F5F5F7] hover:bg-white text-[#050505] font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 text-xs"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin text-[#050505]" />
                  ) : (
                    <span>Set New Password</span>
                  )}
                </button>
              </form>
            )}

            <div className="text-center pt-2 border-t border-[#1F1F1F]">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-xs text-[#A1A1A6] hover:text-[#F5F5F7] transition-colors cursor-pointer"
              >
                Back to <strong className="text-[#F5F5F7] underline">Sign in</strong>
              </button>
            </div>
          </div>
        ) : (
          /* Normal Sign In / Register Form */
          <>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {isRegister && (
                <div>
                  <label className="block font-semibold text-[#A1A1A6] mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-3 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] focus:border-[#F5F5F7]/40 focus:outline-hidden transition-colors"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-[#A1A1A6]">Email Address</label>
                  {isRegister && otpVerified && (
                    <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      Verified
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    disabled={isRegister && otpVerified}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (otpVerified) {
                        setOtpVerified(false);
                        setOtpSent(false);
                        setOtpCode('');
                      }
                    }}
                    placeholder="name@example.com"
                    className="flex-1 p-3 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] focus:border-[#F5F5F7]/40 focus:outline-hidden transition-colors"
                  />
                  {isRegister && !otpVerified && (
                    <button
                      type="button"
                      disabled={otpLoading || otpCooldown > 0 || !email.includes('@')}
                      onClick={handleSendOTP}
                      className="px-3.5 py-3 rounded-xl bg-[#161616] hover:bg-[#202020] border border-[#262626] text-xs font-semibold text-[#F5F5F7] transition-all cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {otpLoading ? (
                        <Loader2 size={14} className="animate-spin text-[#F5F5F7]" />
                      ) : otpCooldown > 0 ? (
                        <span>Resend ({otpCooldown}s)</span>
                      ) : (
                        <span>{otpSent ? 'Resend' : 'Send OTP'}</span>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* 6-Digit Email OTP Box */}
              {isRegister && otpSent && !otpVerified && (
                <div className="p-3.5 rounded-xl bg-[#161616] border border-[#262626] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-[#F5F5F7] text-xs">Enter 6-Digit Verification Code</label>
                    <span className="text-[10px] text-[#A1A1A6]">Sent to your inbox</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 p-2.5 bg-[#1C1C1E] border border-[#333333] rounded-lg text-[#F5F5F7] font-mono text-center tracking-[4px] text-base font-bold focus:border-[#F5F5F7]/40 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      disabled={otpLoading || otpCode.length < 6}
                      onClick={handleVerifyOTP}
                      className="px-4 py-2.5 rounded-lg bg-[#F5F5F7] hover:bg-white text-[#050505] font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {otpLoading ? <Loader2 size={14} className="animate-spin text-[#050505]" /> : 'Verify'}
                    </button>
                  </div>
                  {debugOtp && (
                    <div className="flex items-center justify-between text-xs bg-[#1C1C1E] border border-[#262626] px-3 py-2 rounded-lg text-[#F5F5F7]">
                      <span>Cloud Fallback Code: <strong className="text-white">{debugOtp}</strong></span>
                      <button
                        type="button"
                        onClick={() => setOtpCode(debugOtp)}
                        className="underline text-[11px] font-semibold cursor-pointer hover:text-white ml-2 text-[#A1A1A6]"
                      >
                        Auto-fill
                      </button>
                    </div>
                  )}
                  <p className="text-[11px] text-[#A1A1A6] flex items-center gap-1.5 font-medium">
                    <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                    <span>Verification code dispatched to <strong className="text-[#F5F5F7] font-semibold">{email}</strong></span>
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-[#A1A1A6]">Password</label>
                  {!isRegister && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[11px] text-[#A1A1A6] hover:text-[#F5F5F7] transition-colors cursor-pointer"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 pr-10 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] focus:border-[#F5F5F7]/40 focus:outline-hidden transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73] hover:text-[#F5F5F7] transition-colors p-0.5 rounded cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {isRegister && (
                <div>
                  <label className="block font-semibold text-[#A1A1A6] mb-1.5">Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'officer', label: 'Officer' },
                      { id: 'owner', label: 'Facility Owner' }
                    ].map((r) => (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => setRole(r.id as UserRole)}
                        className={`py-2 px-2 text-center rounded-xl font-semibold border transition-all text-xs cursor-pointer ${
                          role === r.id
                            ? 'bg-[#F5F5F7] text-[#050505] border-[#F5F5F7]'
                            : 'bg-[#161616] text-[#A1A1A6] border-[#262626] hover:text-[#F5F5F7]'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isRegister && role === 'officer' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-[#A1A1A6]">Officer Key</label>
                    <span className="text-[10px] text-[#6E6E73]">Key: MUNICIPAL-OFFICER-2026</span>
                  </div>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="MUNICIPAL-OFFICER-2026"
                    className="w-full p-3 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] focus:border-[#F5F5F7]/40 focus:outline-hidden transition-colors font-mono text-xs"
                  />
                  <p className="text-[10px] text-[#6E6E73] mt-1">
                    Municipal accounts require verification key to prevent unauthorized officer accounts.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#F5F5F7] hover:bg-white text-[#050505] font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 text-xs mt-2"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin text-[#050505]" />
                ) : (
                  <>
                    <span>{isRegister ? 'Register' : 'Sign In'}</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            {/* Toggle */}
            <div className="text-center pt-2 border-t border-[#1F1F1F]">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-xs text-[#A1A1A6] hover:text-[#F5F5F7] transition-colors cursor-pointer"
              >
                {isRegister ? (
                  <span>Already have an account? <strong className="text-[#F5F5F7] underline">Sign in</strong></span>
                ) : (
                  <span>Need an account? <strong className="text-[#F5F5F7] underline">Register</strong></span>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
