import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  Building2,
  Compass,
  Activity,
  LogOut,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const Navbar: React.FC = () => {
  const { user, logout, quickSwitchRole } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Sparkles size={20} />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                Clean <span className="text-emerald-700">AI</span>
              </span>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide -mt-1 hidden sm:block">
                Smarter Toilets. Cleaner Cities.
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/customer"
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                isActive('/customer')
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Compass size={16} />
              <span>Explore Toilets</span>
            </Link>

            <Link
              to="/municipal"
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                isActive('/municipal')
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck size={16} />
              <span>Municipal Portal</span>
            </Link>

            <Link
              to="/owner"
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                isActive('/owner')
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Building2 size={16} />
              <span>Owner Portal</span>
            </Link>

            <Link
              to="/health"
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                isActive('/health')
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Activity size={16} />
              <span>AI Health</span>
            </Link>
          </nav>

          {/* Role Switcher & User Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Role Switcher for instant testing */}
            <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 px-2">Role:</span>
              {(['officer', 'owner', 'citizen'] as UserRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => quickSwitchRole(role)}
                  className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all ${
                    user?.role === role
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-bold text-slate-900 truncate max-w-[140px]">{user.full_name}</p>
                  <span className="text-[10px] capitalize font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <UserCheck size={16} />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav sub-bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-200 bg-slate-50/90 py-2 text-xs font-semibold">
        <Link to="/customer" className={`flex flex-col items-center gap-0.5 ${isActive('/customer') ? 'text-emerald-700' : 'text-slate-600'}`}>
          <Compass size={16} />
          <span>Explore</span>
        </Link>
        <Link to="/municipal" className={`flex flex-col items-center gap-0.5 ${isActive('/municipal') ? 'text-emerald-700' : 'text-slate-600'}`}>
          <ShieldCheck size={16} />
          <span>Municipal</span>
        </Link>
        <Link to="/owner" className={`flex flex-col items-center gap-0.5 ${isActive('/owner') ? 'text-emerald-700' : 'text-slate-600'}`}>
          <Building2 size={16} />
          <span>Owner</span>
        </Link>
        <Link to="/health" className={`flex flex-col items-center gap-0.5 ${isActive('/health') ? 'text-emerald-700' : 'text-slate-600'}`}>
          <Activity size={16} />
          <span>AI Health</span>
        </Link>
      </div>
    </header>
  );
};
