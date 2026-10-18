import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Compass,
  Sparkles,
  Loader2,
  Navigation
} from 'lucide-react';
import { api } from '../services/api';
import { Toilet } from '../types';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadRecentToilets();
  }, []);

  const loadRecentToilets = async () => {
    setLoading(true);
    try {
      const data = await api.getToilets();
      setToilets(data);
    } catch (e) {
      console.error('Failed to load recent toilets for home page:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/toilets?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/toilets');
    }
  };

  // Sort by last_inspected_at descending if available, and take top 4
  const recentlyInspected = [...toilets]
    .sort((a, b) => {
      const dateA = a.last_inspected_at ? new Date(a.last_inspected_at).getTime() : 0;
      const dateB = b.last_inspected_at ? new Date(b.last_inspected_at).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 4);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Clean':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={13} className="text-emerald-400" />
            Clean
          </span>
        );
      case 'Needs Cleaning':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle size={13} className="text-amber-400" />
            Needs Cleaning
          </span>
        );
      case 'Under Maintenance':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Wrench size={13} className="text-rose-400" />
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

  const formatInspectionDate = (dateStr?: string) => {
    if (!dateStr) return 'Pending scheduled inspection';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getDirectionsUrl = (lat: number, lon: number) => {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
  };

  return (
    <div className="bg-[#050505] text-[#F5F5F7]">
      
      {/* ======================================================== */}
      {/* 1. HERO SECTION                                          */}
      {/* ======================================================== */}
      <section className="relative pt-20 pb-16 sm:pt-28 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-8">
        
        {/* Pill Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111111] border border-[#262626] text-xs font-medium text-[#A1A1A6] shadow-sm">
          <ShieldCheck size={14} className="text-[#F5F5F7]" />
          <span>Public Sanitation Intelligence</span>
        </div>

        {/* Clear Heading */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#F5F5F7] leading-[1.08]">
          Find Cleaner <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#FFFFFF] via-[#E5E5EA] to-[#71717A]">
            Public Toilets.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-[#A1A1A6] max-w-2xl mx-auto leading-relaxed">
          Locate certified clean restrooms across the city. Cleanliness is inspected with AI computer vision and verified by municipal health officers.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto flex flex-col sm:flex-row gap-2.5 p-1.5 bg-[#0D0D0D] border border-[#262626] rounded-2xl shadow-xl">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6E6E73]" />
            <input
              type="text"
              placeholder="Search by city, locality, or landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-transparent text-sm text-[#F5F5F7] placeholder-[#6E6E73] focus:outline-hidden"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 rounded-xl text-sm font-semibold text-[#050505] bg-[#F5F5F7] hover:bg-white transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-md"
          >
            <span>Search</span>
            <ArrowRight size={15} />
          </button>
        </form>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            to="/toilets"
            className="px-6 py-3 rounded-xl text-sm font-semibold text-[#050505] bg-[#F5F5F7] hover:bg-white transition-all shadow-md flex items-center gap-2"
          >
            <span>Explore Available Toilets</span>
            <Compass size={15} />
          </Link>

          <Link
            to="/report"
            className="px-6 py-3 rounded-xl text-sm font-semibold text-[#F5F5F7] bg-[#141414] hover:bg-[#1E1E1E] border border-[#262626] transition-all flex items-center gap-2"
          >
            <span>Report an Issue</span>
          </Link>
        </div>

      </section>

      {/* ======================================================== */}
      {/* 2. HOW CLEAN AI WORKS                                    */}
      {/* ======================================================== */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-[#1F1F1F]">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F5F5F7]">
            How Clean AI Works
          </h2>
          <p className="text-xs sm:text-sm text-[#A1A1A6] max-w-xl mx-auto">
            A three-step verification process ensuring public toilet cleanliness data remains transparent, authentic, and up to date.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Step 1 */}
          <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-6 space-y-4 hover:border-[#3D3D3D] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#161616] border border-[#262626] flex items-center justify-center text-[#F5F5F7]">
              <Cpu size={20} />
            </div>
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#6E6E73]">Step 01</span>
              <h3 className="text-base font-semibold text-[#F5F5F7]">
                AI Cleanliness Inspection
              </h3>
              <p className="text-xs text-[#A1A1A6] leading-relaxed">
                Trained YOLOv11 neural vision detects 16 real hygiene indicators and fixtures, identifying stains, soap dispensers, and maintenance requirements.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-6 space-y-4 hover:border-[#3D3D3D] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#161616] border border-[#262626] flex items-center justify-center text-[#F5F5F7]">
              <ShieldCheck size={20} />
            </div>
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#6E6E73]">Step 02</span>
              <h3 className="text-base font-semibold text-[#F5F5F7]">
                Municipal Officer Verification
              </h3>
              <p className="text-xs text-[#A1A1A6] leading-relaxed">
                Authorized municipal officers review AI analysis and certify the official public status. Any override requires an audit-logged justification.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-6 space-y-4 hover:border-[#3D3D3D] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#161616] border border-[#262626] flex items-center justify-center text-[#F5F5F7]">
              <Compass size={20} />
            </div>
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#6E6E73]">Step 03</span>
              <h3 className="text-base font-semibold text-[#F5F5F7]">
                Public Navigation & Reporting
              </h3>
              <p className="text-xs text-[#A1A1A6] leading-relaxed">
                Citizens access live verified statuses without logging in, get turn-by-turn Google Maps directions, and submit issues directly to municipal dispatch.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. RECENTLY INSPECTED TOILETS (REAL DATABASE INFO)       */}
      {/* ======================================================== */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-[#1F1F1F]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#161616] text-[#A1A1A6] text-xs font-medium border border-[#262626]">
              <Clock size={12} />
              <span>Real-Time Municipal Registry</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F5F5F7]">
              Recently Inspected Public Toilets
            </h2>
            <p className="text-xs sm:text-sm text-[#A1A1A6]">
              Real data from municipal database inspections.
            </p>
          </div>

          <Link
            to="/toilets"
            className="text-xs font-semibold text-[#F5F5F7] hover:text-white flex items-center gap-1.5 group shrink-0"
          >
            <span>View All Toilets</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 space-x-3 text-xs text-[#A1A1A6]">
            <Loader2 size={20} className="animate-spin text-[#F5F5F7]" />
            <span>Loading verified toilets from database...</span>
          </div>
        ) : recentlyInspected.length === 0 ? (
          <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-10 text-center space-y-2">
            <p className="text-sm font-semibold text-[#F5F5F7]">No Public Restrooms Registered Yet</p>
            <p className="text-xs text-[#A1A1A6] max-w-md mx-auto">
              The municipal database is clean and ready for production. Registered public facilities will appear here once inspected and verified by municipal officers.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recentlyInspected.map((toilet) => (
              <div
                key={toilet.id}
                className="bg-[#0D0D0D] border border-[#262626] hover:border-[#3D3D3D] rounded-2xl p-6 space-y-4 transition-colors flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-base font-semibold text-[#F5F5F7] leading-snug">
                        {toilet.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-[#A1A1A6] mt-1">
                        <MapPin size={13} className="text-[#6E6E73] shrink-0" />
                        <span>{toilet.locality}, {toilet.city}</span>
                      </div>
                    </div>
                    {getStatusBadge(toilet.verified_status)}
                  </div>

                  <p className="text-xs text-[#8E8E93] line-clamp-2 mt-2">
                    {toilet.address}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {toilet.facilities.slice(0, 3).map((f) => (
                      <span
                        key={f}
                        className="px-2 py-0.5 rounded-md text-[11px] bg-[#161616] text-[#A1A1A6] border border-[#262626]"
                      >
                        {f}
                      </span>
                    ))}
                    {toilet.facilities.length > 3 && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] bg-[#161616] text-[#6E6E73] border border-[#262626]">
                        +{toilet.facilities.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#1C1C1E] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[#6E6E73]">
                    <Clock size={12} />
                    <span>Verified: <strong className="text-[#A1A1A6] font-normal">{formatInspectionDate(toilet.last_inspected_at)}</strong></span>
                  </div>

                  <a
                    href={getDirectionsUrl(toilet.latitude, toilet.longitude)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#050505] bg-[#F5F5F7] hover:bg-white transition-colors flex items-center gap-1.5"
                  >
                    <Navigation size={12} />
                    <span>Directions</span>
                    <ExternalLink size={10} className="opacity-70" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* 4. CALL TO ACTION                                        */}
      {/* ======================================================== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center border-t border-[#1F1F1F] space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#F5F5F7]">
          Ready to find clean facilities?
        </h2>
        <p className="text-xs sm:text-sm text-[#A1A1A6] max-w-lg mx-auto">
          Explore all municipally registered public toilets or report a civic sanitation issue right now.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/toilets"
            className="px-6 py-3 rounded-xl text-sm font-semibold text-[#050505] bg-[#F5F5F7] hover:bg-white transition-all shadow-md"
          >
            Browse All Public Toilets
          </Link>
          <Link
            to="/report"
            className="px-6 py-3 rounded-xl text-sm font-semibold text-[#F5F5F7] bg-[#161616] hover:bg-[#202020] border border-[#262626] transition-all"
          >
            Report an Issue
          </Link>
        </div>
      </section>

    </div>
  );
};
