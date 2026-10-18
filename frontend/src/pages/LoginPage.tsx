import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Lock, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { api } from '../services/api';

export const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('citizen');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await register({
          email,
          password,
          full_name: fullName,
          role,
          phone: phone || undefined
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
      <div className="relative w-full max-w-md bg-[#0D0D0D] rounded-3xl p-8 sm:p-10 border border-[#262626] shadow-2xl space-y-7">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#161616] border border-[#262626] flex items-center justify-center mx-auto shadow-inner text-[#F5F5F7]">
            <Sparkles size={22} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#F5F5F7]">
            {isRegister ? 'Create Clean AI Account' : 'Sign in to Clean AI'}
          </h2>
          <p className="text-xs text-[#86868B] max-w-xs mx-auto">
            AI-powered sanitation intelligence for modern public spaces.
          </p>

          {/* Real-time Server Connectivity Badge */}
          <div className="flex items-center justify-center pt-1">
            {serverStatus === 'online' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Backend API Connected
              </span>
            )}
            {serverStatus === 'offline' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-semibold border border-rose-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Backend Offline / Unreachable
              </span>
            )}
            {serverStatus === 'checking' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1A1A1A] text-[#86868B] text-[10px] font-semibold border border-[#262626]">
                <Loader2 size={10} className="animate-spin text-[#A1A1A6]" />
                Checking API connection...
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-400 text-xs font-semibold flex flex-col gap-1.5">
            <span>{error}</span>
            {error.includes('already registered') && (
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setError(null);
                }}
                className="text-left text-[#F5F5F7] hover:underline cursor-pointer text-[11px]"
              >
                Switch to Sign In &rarr;
              </button>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRegister && (
            <div>
              <label className="block font-semibold text-[#A1A1A6] mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ramesh Chandra"
                className="w-full p-3 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] placeholder-[#6E6E73] focus:border-[#F5F5F7]/40 focus:outline-hidden transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-[#A1A1A6] mb-1.5">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. yourname@domain.gov"
              className="w-full p-3 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] placeholder-[#6E6E73] focus:border-[#F5F5F7]/40 focus:outline-hidden transition-colors"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#A1A1A6] mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] placeholder-[#6E6E73] focus:border-[#F5F5F7]/40 focus:outline-hidden transition-colors"
            />
          </div>

          {isRegister && (
            <div>
              <label className="block font-semibold text-[#A1A1A6] mb-1.5">Account Role</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'citizen', label: 'Citizen' },
                  { id: 'officer', label: 'Officer' },
                  { id: 'owner', label: 'Facility Owner' }
                ].map((r) => (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => setRole(r.id as UserRole)}
                    className={`py-2 px-1 text-center rounded-xl font-semibold border transition-all ${
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#F5F5F7] hover:bg-white text-[#050505] font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 text-xs mt-2"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin text-[#050505]" />
            ) : (
              <>
                <span>{isRegister ? 'Register Account' : 'Sign In'}</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Toggle between Login and Register */}
        <div className="text-center pt-2 border-t border-[#1F1F1F]">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs text-[#A1A1A6] hover:text-[#F5F5F7] transition-colors cursor-pointer"
          >
            {isRegister ? (
              <span>Already have an account? <strong className="text-[#F5F5F7] underline">Sign in</strong></span>
            ) : (
              <span>New to Clean AI? <strong className="text-[#F5F5F7] underline">Create an account</strong></span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
