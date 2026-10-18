import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ShieldCheck, Building2, User, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

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
      } else {
        await login(email, password);
      }
      navigate('/customer');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userRole: UserRole) => {
    setLoading(true);
    setError(null);
    let demoEmail = 'officer@cleanai.gov';
    let demoPass = 'Officer@123';
    let target = '/municipal';

    if (userRole === 'owner') {
      demoEmail = 'owner@cleanai.com';
      demoPass = 'Owner@123';
      target = '/owner';
    } else if (userRole === 'citizen') {
      demoEmail = 'citizen@cleanai.org';
      demoPass = 'Citizen@123';
      target = '/customer';
    }

    try {
      await login(demoEmail, demoPass);
      navigate(target);
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#050505] flex items-center justify-center px-4 py-16 selection:bg-[#2997FF]/30">
      
      {/* Background subtle radial gradient */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[500px] h-[500px] bg-[#2997FF]/5 rounded-full blur-3xl opacity-60" />
      </div>

      <div className="relative w-full max-w-md bg-[#0D0D0D] rounded-3xl p-8 sm:p-10 border border-[#262626] shadow-2xl space-y-7">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#161616] border border-[#262626] flex items-center justify-center mx-auto shadow-inner text-[#2997FF]">
            <Sparkles size={22} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#F5F5F7]">
            {isRegister ? 'Create Clean AI Account' : 'Sign in to Clean AI'}
          </h2>
          <p className="text-xs text-[#86868B] max-w-xs mx-auto">
            AI-powered sanitation intelligence for modern public spaces.
          </p>
        </div>

        {/* Quick Demo Credentials */}
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] space-y-2.5">
          <div className="flex items-center justify-between text-[10px] font-semibold tracking-wider uppercase text-[#86868B]">
            <span>One-Click Access</span>
            <span className="text-[#2997FF]">Live Roles</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('officer')}
              className="p-3 rounded-xl bg-[#1A1A1A] hover:bg-[#222222] border border-[#2D2D2D] hover:border-[#2997FF]/50 text-[11px] font-semibold text-[#F5F5F7] transition-all flex flex-col items-center gap-1.5 group"
            >
              <ShieldCheck size={16} className="text-[#2997FF] group-hover:scale-110 transition-transform" />
              <span>Officer</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('owner')}
              className="p-3 rounded-xl bg-[#1A1A1A] hover:bg-[#222222] border border-[#2D2D2D] hover:border-[#30D158]/50 text-[11px] font-semibold text-[#F5F5F7] transition-all flex flex-col items-center gap-1.5 group"
            >
              <Building2 size={16} className="text-[#30D158] group-hover:scale-110 transition-transform" />
              <span>Owner</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('citizen')}
              className="p-3 rounded-xl bg-[#1A1A1A] hover:bg-[#222222] border border-[#2D2D2D] hover:border-[#A1A1A6]/50 text-[11px] font-semibold text-[#F5F5F7] transition-all flex flex-col items-center gap-1.5 group"
            >
              <User size={16} className="text-[#A1A1A6] group-hover:scale-110 transition-transform" />
              <span>Citizen</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-[#FF453A]/10 border border-[#FF453A]/25 rounded-2xl text-[#FF453A] text-xs font-semibold">
            {error}
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
                className="w-full p-3 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] placeholder-[#6E6E73] focus:border-[#2997FF] focus:outline-hidden transition-colors"
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
              placeholder="e.g. officer@cleanai.gov"
              className="w-full p-3 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] placeholder-[#6E6E73] focus:border-[#2997FF] focus:outline-hidden transition-colors"
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
              className="w-full p-3 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] placeholder-[#6E6E73] focus:border-[#2997FF] focus:outline-hidden transition-colors"
            />
          </div>

          {isRegister && (
            <div>
              <label className="block font-semibold text-[#A1A1A6] mb-1.5">Account Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full p-3 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] focus:border-[#2997FF] focus:outline-hidden transition-colors"
              >
                <option value="citizen">Public Citizen</option>
                <option value="owner">Toilet Facility Owner / Contractor</option>
                <option value="officer">Municipal Officer</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 apple-button-primary flex items-center justify-center gap-2 font-semibold text-xs tracking-wide disabled:opacity-50 mt-2"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-[#262626]">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs font-semibold text-[#2997FF] hover:underline cursor-pointer"
          >
            {isRegister
              ? 'Already registered? Sign In'
              : "Don't have an account? Create an Account"}
          </button>
        </div>

      </div>
    </div>
  );
};
