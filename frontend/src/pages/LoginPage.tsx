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
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200 card-shadow space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-gradient-to-tr from-emerald-700 to-teal-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-emerald-600/20">
            <Sparkles size={24} />
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            {isRegister ? 'Create Clean AI Account' : 'Sign in to Clean AI'}
          </h2>
          <p className="text-xs text-slate-500">
            Smarter Toilets. Cleaner Cities. — Municipal AI Sanitation Platform
          </p>
        </div>

        {/* Quick Demo Logins Banner */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
          <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide text-center">
            One-Click Demo Credentials:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('officer')}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-[11px] font-bold text-slate-800 transition-all flex flex-col items-center gap-1 shadow-2xs"
            >
              <ShieldCheck size={16} className="text-emerald-700" />
              <span>Officer</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('owner')}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:border-sky-500 hover:bg-sky-50 text-[11px] font-bold text-slate-800 transition-all flex flex-col items-center gap-1 shadow-2xs"
            >
              <Building2 size={16} className="text-sky-700" />
              <span>Owner</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('citizen')}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-[11px] font-bold text-slate-800 transition-all flex flex-col items-center gap-1 shadow-2xs"
            >
              <User size={16} className="text-teal-700" />
              <span>Citizen</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRegister && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ramesh Chandra"
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. officer@cleanai.gov"
              className="w-full p-2.5 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-2.5 border border-slate-300 rounded-xl"
            />
          </div>

          {isRegister && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Account Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
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
            className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            {isRegister
              ? 'Already have an account? Sign In'
              : "Don't have an account? Create an Account"}
          </button>
        </div>

      </div>
    </div>
  );
};
