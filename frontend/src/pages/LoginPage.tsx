import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Lock, Mail, ArrowRight, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
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
      <div className="relative w-full max-w-sm bg-[#0D0D0D] rounded-3xl p-8 border border-[#262626] shadow-2xl space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-11 h-11 rounded-2xl bg-[#161616] border border-[#262626] flex items-center justify-center mx-auto text-[#F5F5F7]">
            <Sparkles size={20} />
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-[#F5F5F7]">
            {isRegister ? 'Create Account' : 'Sign In'}
          </h2>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Form - Only Important Inputs */}
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
            <label className="block font-semibold text-[#A1A1A6] mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] focus:border-[#F5F5F7]/40 focus:outline-hidden transition-colors"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#A1A1A6] mb-1.5">Password</label>
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
      </div>
    </div>
  );
};
