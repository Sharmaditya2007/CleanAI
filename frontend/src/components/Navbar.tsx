import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  Building2,
  Compass,
  FileText,
  LogOut,
  Menu,
  X,
  Cloud
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CloudConnectModal } from './CloudConnectModal';
import { getApiBase } from '../services/api';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cloudModalOpen, setCloudModalOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const activeApi = getApiBase();
  const isCloudLinked = activeApi.startsWith('http');

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Find Toilets', path: '/toilets' },
    { label: 'Report Issue', path: '/report' },
    { label: 'Authority', path: '/authority' },
    { label: 'Owner Portal', path: '/owner' }
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-xl border-b border-[#262626]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-[#141414] border border-[#262626] flex items-center justify-center text-[#F5F5F7] group-hover:border-[#3D3D3D] transition-colors shadow-sm">
                <Sparkles size={16} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold tracking-tight text-[#F5F5F7]">
                  Clean
                </span>
                <span className="text-lg font-bold tracking-tight text-[#A1A1A6]">
                  AI
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isActive(link.path)
                      ? 'bg-[#1C1C1E] text-[#F5F5F7] font-semibold border border-[#333333]'
                      : 'text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-[#141414]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Actions: Cloud Connection & User Session */}
            <div className="hidden md:flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCloudModalOpen(true)}
                title="Configure Cloud Backend API"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  isCloudLinked
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                    : 'bg-[#141414] text-[#A1A1A6] border-[#262626] hover:text-[#F5F5F7] hover:border-[#383838]'
                }`}
              >
                <Cloud size={13} className={isCloudLinked ? 'text-emerald-400' : 'text-[#86868B]'} />
                <span>{isCloudLinked ? 'Cloud API' : 'Link API'}</span>
              </button>

              {user ? (
                <div className="flex items-center gap-2.5">
                  <div className="text-right">
                    <div className="text-xs font-semibold text-[#F5F5F7] truncate max-w-[140px]">
                      {user.full_name}
                    </div>
                    <div className="text-[10px] text-[#A1A1A6] uppercase tracking-wider font-mono">
                      {user.role === 'officer'
                        ? 'Municipal Officer'
                        : user.role === 'owner'
                        ? 'Facility Owner'
                        : 'Citizen'}
                    </div>
                  </div>

                  <button
                    onClick={() => logout()}
                    title="Sign Out"
                    className="p-2 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] border border-[#262626] text-[#A1A1A6] hover:text-[#F5F5F7] transition-colors cursor-pointer"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              ) : null}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              <button
                type="button"
                onClick={() => setCloudModalOpen(true)}
                className="p-2 rounded-xl bg-[#141414] border border-[#262626] text-[#A1A1A6]"
                title="Cloud Backend API"
              >
                <Cloud size={16} className={isCloudLinked ? 'text-emerald-400' : 'text-[#86868B]'} />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl bg-[#141414] border border-[#262626] text-[#A1A1A6] hover:text-[#F5F5F7]"
              >
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#262626] bg-[#0A0A0A] px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3.5 py-2.5 rounded-xl text-xs font-medium ${
                  isActive(link.path)
                    ? 'bg-[#1C1C1E] text-[#F5F5F7] font-semibold border border-[#333333]'
                    : 'text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-[#141414]'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {user && (
              <div className="pt-3 border-t border-[#1C1C1E] flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[#F5F5F7]">{user.full_name}</div>
                  <div className="text-[10px] text-[#A1A1A6] uppercase">{user.role}</div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Cloud Backend Connect Modal */}
      <CloudConnectModal
        isOpen={cloudModalOpen}
        onClose={() => setCloudModalOpen(false)}
      />
    </>
  );
};
