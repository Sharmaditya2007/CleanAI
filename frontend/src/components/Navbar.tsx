import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  Building2,
  Compass,
  Activity,
  LogOut,
  UserCheck,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const Navbar: React.FC = () => {
  const { user, logout, quickSwitchRole } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-2xl border-b border-[#262626]/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          {/* Brand Identity */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#1A1A1A] to-[#262626] border border-[#333333] flex items-center justify-center text-[#2997FF] shadow-xs group-hover:border-[#2997FF]/50 transition-colors">
              <Sparkles size={16} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-[17px] font-semibold tracking-tight text-[#F5F5F7] group-hover:text-white transition-colors">
                Clean
              </span>
              <span className="text-[17px] font-semibold text-[#2997FF] tracking-tight">
                AI
              </span>
            </div>
          </Link>

          {/* Apple-style Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                isActive('/') && !location.hash
                  ? 'text-[#F5F5F7] bg-[#161616]'
                  : 'text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-[#111111]'
              }`}
            >
              Product
            </Link>

            <Link
              to="/customer"
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                isActive('/customer')
                  ? 'text-[#F5F5F7] bg-[#161616]'
                  : 'text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-[#111111]'
              }`}
            >
              Find Toilets
            </Link>

            <a
              href="/#how-it-works"
              className="px-3 py-1.5 rounded-full text-[13px] font-medium text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-[#111111] transition-colors"
            >
              How It Works
            </a>

            <Link
              to="/municipal"
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                isActive('/municipal')
                  ? 'text-[#F5F5F7] bg-[#161616]'
                  : 'text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-[#111111]'
              }`}
            >
              For Municipalities
            </Link>

            <Link
              to="/owner"
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                isActive('/owner')
                  ? 'text-[#F5F5F7] bg-[#161616]'
                  : 'text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-[#111111]'
              }`}
            >
              For Owners
            </Link>

            <Link
              to="/health"
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/health')
                  ? 'text-[#2997FF] bg-[#161616]'
                  : 'text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-[#111111]'
              }`}
            >
              <Activity size={13} className="text-[#2997FF]" />
              <span>AI Health</span>
            </Link>
          </nav>

          {/* Right Controls: Quick Role Switcher + Auth / CTA */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Minimalist Role Switcher */}
            <div className="hidden md:flex items-center bg-[#111111] p-0.5 rounded-full border border-[#262626] text-[11px]">
              <span className="text-[10px] uppercase font-semibold text-[#6E6E73] px-2.5">Role</span>
              {(['officer', 'owner', 'citizen'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => quickSwitchRole(r)}
                  className={`px-2.5 py-1 rounded-full font-medium capitalize transition-all ${
                    user?.role === r
                      ? 'bg-[#262626] text-[#F5F5F7] shadow-xs'
                      : 'text-[#A1A1A6] hover:text-[#F5F5F7]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:block text-right">
                  <p className="text-[12px] font-semibold text-[#F5F5F7] truncate max-w-[130px]">{user.full_name}</p>
                  <span className="text-[10px] capitalize font-medium text-[#2997FF] bg-[#2997FF]/10 px-1.5 py-0.2 rounded-full border border-[#2997FF]/20">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-1.5 text-[#A1A1A6] hover:text-[#FF453A] hover:bg-[#161616] rounded-full transition-colors"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-[#F5F5F7] hover:text-white text-[13px] font-medium transition-colors"
              >
                Sign In
              </Link>
            )}

            {/* Apple-style Primary Action Pill Button */}
            <Link
              to="/customer"
              className="apple-button-primary px-3.5 sm:px-4 py-1.5 rounded-full text-[12px] sm:text-[13px] font-semibold tracking-tight shadow-xs flex items-center gap-1.5"
            >
              <span>Explore Clean AI</span>
              <ChevronRight size={13} />
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-[#A1A1A6] hover:text-[#F5F5F7] rounded-lg transition-colors ml-1"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0A0A0A] border-b border-[#262626] px-4 py-4 space-y-3">
          <div className="flex flex-col space-y-2 text-sm font-medium">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-[#F5F5F7] hover:bg-[#161616]"
            >
              Product
            </Link>
            <Link
              to="/customer"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-[#F5F5F7] hover:bg-[#161616]"
            >
              Find Toilets
            </Link>
            <Link
              to="/municipal"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-[#F5F5F7] hover:bg-[#161616]"
            >
              For Municipalities
            </Link>
            <Link
              to="/owner"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-[#F5F5F7] hover:bg-[#161616]"
            >
              For Owners
            </Link>
            <Link
              to="/health"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-[#2997FF] hover:bg-[#161616] flex items-center gap-2"
            >
              <Activity size={16} />
              <span>AI Health & Diagnostics</span>
            </Link>
          </div>

          {/* Mobile Role Switcher */}
          <div className="pt-3 border-t border-[#262626] flex items-center justify-between text-xs">
            <span className="text-[#6E6E73] font-medium">Switch Role:</span>
            <div className="flex gap-1">
              {(['officer', 'owner', 'citizen'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    quickSwitchRole(r);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize ${
                    user?.role === r
                      ? 'bg-[#2997FF] text-white'
                      : 'bg-[#161616] text-[#A1A1A6]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Minimal Sub-bar for Mobile Navigation */}
      <div className="lg:hidden flex items-center justify-around border-t border-[#1F1F1F] bg-[#050505]/95 py-2 text-[11px] font-medium text-[#A1A1A6]">
        <Link to="/customer" className={`flex flex-col items-center gap-1 ${isActive('/customer') ? 'text-[#2997FF]' : 'hover:text-[#F5F5F7]'}`}>
          <Compass size={15} />
          <span>Find</span>
        </Link>
        <Link to="/municipal" className={`flex flex-col items-center gap-1 ${isActive('/municipal') ? 'text-[#2997FF]' : 'hover:text-[#F5F5F7]'}`}>
          <ShieldCheck size={15} />
          <span>Municipal</span>
        </Link>
        <Link to="/owner" className={`flex flex-col items-center gap-1 ${isActive('/owner') ? 'text-[#2997FF]' : 'hover:text-[#F5F5F7]'}`}>
          <Building2 size={15} />
          <span>Owner</span>
        </Link>
        <Link to="/health" className={`flex flex-col items-center gap-1 ${isActive('/health') ? 'text-[#2997FF]' : 'hover:text-[#F5F5F7]'}`}>
          <Activity size={15} />
          <span>Health</span>
        </Link>
      </div>
    </header>
  );
};
