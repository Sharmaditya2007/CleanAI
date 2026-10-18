import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Clock,
  Search,
  Camera,
  Check,
  X,
  FileText,
  AlertCircle,
  PlusCircle,
  Loader2,
  Lock,
  Mail,
  User,
  LogOut,
  MapPin,
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';
import { api, getMediaUrl } from '../services/api';
import { Toilet, Complaint } from '../types';
import { AIInspectModal } from '../components/AIInspectModal';
import { useAuth } from '../context/AuthContext';

export const MunicipalPortal: React.FC = () => {
  const { user, login, logout, quickSwitchRole } = useAuth();

  // Authentication form state for officers who aren't logged in
  const [officerEmail, setOfficerEmail] = useState('');
  const [officerPassword, setOfficerPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Portal data states
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'toilets' | 'complaints' | 'register'>('toilets');

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [complaintFilter, setComplaintFilter] = useState('all');

  // AI Inspection Modal state
  const [selectedToiletForInspect, setSelectedToiletForInspect] = useState<Toilet | null>(null);

  // New Toilet Registration Form state
  const [regForm, setRegForm] = useState({
    name: '',
    address: '',
    city: 'New Delhi',
    locality: '',
    latitude: 28.6315,
    longitude: 77.2167,
    description: '',
    facilities: ['Running Water', 'Western WC', 'Washbasin'],
    opening_hours: '06:00 - 23:00',
    accessibility: true,
    contact_number: '+91-11-2334455'
  });
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [regError, setRegError] = useState<string | null>(null);

  // Complaint Resolution Note Modal
  const [resolvingComplaint, setResolvingComplaint] = useState<Complaint | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [updatingComplaintId, setUpdatingComplaintId] = useState<string | null>(null);

  const isOfficer = user && user.role === 'officer';

  useEffect(() => {
    if (isOfficer) {
      loadData();
    }
  }, [isOfficer]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tList, cList] = await Promise.all([
        api.getToilets(),
        api.getComplaints()
      ]);
      setToilets(tList);
      setComplaints(cList);
    } catch (err) {
      console.error('Failed to load municipal portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOfficerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      await login(officerEmail, officerPassword);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed. Please check officer credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleUpdateComplaintStatus = async (complaintId: string, newStatus: string, notes?: string) => {
    setUpdatingComplaintId(complaintId);
    try {
      await api.updateComplaintStatus(complaintId, newStatus, notes);
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === complaintId
            ? { ...c, status: newStatus as any, resolution_notes: notes || c.resolution_notes }
            : c
        )
      );
      if (resolvingComplaint?.id === complaintId) {
        setResolvingComplaint(null);
        setResolutionNote('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update complaint status');
    } finally {
      setUpdatingComplaintId(null);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.name || !regForm.address || !regForm.locality) {
      setRegError('Facility name, address, and locality are required.');
      return;
    }

    setIsSubmittingReg(true);
    setRegError(null);
    setRegSuccess(null);

    try {
      const newToilet = await api.registerToilet(regForm as any);
      setToilets((prev) => [newToilet, ...prev]);
      setRegSuccess(`Toilet "${newToilet.name}" registered successfully.`);
      setRegForm({
        name: '',
        address: '',
        city: 'New Delhi',
        locality: '',
        latitude: 28.6315,
        longitude: 77.2167,
        description: '',
        facilities: ['Running Water', 'Western WC', 'Washbasin'],
        opening_hours: '06:00 - 23:00',
        accessibility: true,
        contact_number: '+91-11-2334455'
      });
      setTimeout(() => {
        setRegSuccess(null);
        setActiveTab('toilets');
      }, 2000);
    } catch (err: any) {
      setRegError(err.message || 'Registration failed.');
    } finally {
      setIsSubmittingReg(false);
    }
  };

  const toggleFacility = (facility: string) => {
    setRegForm((prev) => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter((f) => f !== facility)
        : [...prev.facilities, facility]
    }));
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
            <Wrench size={12} />
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

  // If not logged in as officer, render simple secure login screen
  if (!isOfficer) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 space-y-6 text-[#F5F5F7]">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#141414] border border-[#262626] flex items-center justify-center mx-auto text-[#F5F5F7]">
            <ShieldCheck size={26} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Authority Portal Login</h1>
          <p className="text-xs text-[#A1A1A6]">
            Secure access for authorized municipal health and sanitation officers.
          </p>
        </div>

        <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-6 space-y-5 shadow-xl">
          {authError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle size={14} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleOfficerLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#A1A1A6]">Officer Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" />
                <input
                  type="email"
                  required
                  value={officerEmail}
                  onChange={(e) => setOfficerEmail(e.target.value)}
                  placeholder="officer@cleanai.gov"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#161616] border border-[#262626] rounded-xl text-xs text-[#F5F5F7] placeholder-[#6E6E73] focus:border-[#F5F5F7]/40 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#A1A1A6]">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" />
                <input
                  type="password"
                  required
                  value={officerPassword}
                  onChange={(e) => setOfficerPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#161616] border border-[#262626] rounded-xl text-xs text-[#F5F5F7] placeholder-[#6E6E73] focus:border-[#F5F5F7]/40 focus:outline-hidden"
                />
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
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Log In as Municipal Officer</span>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Filtered Toilets
  const filteredToilets = toilets.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.locality.toLowerCase().includes(q) ||
      t.city.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || t.verified_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered Complaints
  const filteredComplaints = complaints.filter((c) => {
    if (complaintFilter === 'all') return true;
    if (complaintFilter === 'Open') return c.status === 'Open' || c.status === 'Received';
    if (complaintFilter === 'In Progress') return c.status === 'In Progress' || c.status === 'Under Investigation' || c.status === 'Action Taken';
    if (complaintFilter === 'Resolved') return c.status === 'Resolved';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-[#F5F5F7]">
      
      {/* Top Header Card */}
      <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#161616] border border-[#262626] text-xs font-medium text-[#A1A1A6]">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Authorized Municipal Health Command</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F5F7]">
            Authority Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[#A1A1A6]">
            Logged in as <strong className="text-[#F5F5F7]">{user?.full_name || 'Municipal Officer'}</strong> ({user?.organization || 'Municipal Corporation'})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#161616] hover:bg-[#202020] text-[#F5F5F7] border border-[#262626] transition-colors cursor-pointer"
          >
            Refresh Data
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

      {/* Clean Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#262626] pb-3 text-xs font-medium">
        <button
          onClick={() => setActiveTab('toilets')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'toilets'
              ? 'bg-[#F5F5F7] text-[#050505] font-semibold'
              : 'text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-[#141414]'
          }`}
        >
          Registered Toilets ({toilets.length})
        </button>

        <button
          onClick={() => setActiveTab('complaints')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'complaints'
              ? 'bg-[#F5F5F7] text-[#050505] font-semibold'
              : 'text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-[#141414]'
          }`}
        >
          <span>Customer Complaints ({complaints.length})</span>
          {complaints.filter((c) => c.status !== 'Resolved').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('register')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'register'
              ? 'bg-[#F5F5F7] text-[#050505] font-semibold'
              : 'text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-[#141414]'
          }`}
        >
          <PlusCircle size={13} />
          <span>Register New Toilet</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: REGISTERED TOILETS & AI INSPECTION                */}
      {/* ======================================================== */}
      {activeTab === 'toilets' && (
        <div className="space-y-4">
          
          {/* Filter Bar */}
          <div className="bg-[#0D0D0D] border border-[#262626] p-4 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" />
              <input
                type="text"
                placeholder="Search facility name, locality..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-[#161616] border border-[#262626] rounded-xl text-xs text-[#F5F5F7] placeholder-[#6E6E73] focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {['all', 'Clean', 'Needs Cleaning', 'Under Maintenance'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[#262626] text-[#F5F5F7]'
                      : 'text-[#6E6E73] hover:text-[#A1A1A6]'
                  }`}
                >
                  {st === 'all' ? 'All Statuses' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Toilet Records Table/Cards */}
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 size={24} className="animate-spin mx-auto text-[#F5F5F7]" />
              <p className="text-xs text-[#A1A1A6]">Loading facilities...</p>
            </div>
          ) : filteredToilets.length === 0 ? (
            <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-12 text-center text-xs text-[#A1A1A6]">
              No toilet records found.
            </div>
          ) : (
            <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#262626] bg-[#121212] text-[#A1A1A6]">
                      <th className="py-3 px-4 font-semibold">Toilet Name & Address</th>
                      <th className="py-3 px-4 font-semibold">Locality / City</th>
                      <th className="py-3 px-4 font-semibold">Current Verified Status</th>
                      <th className="py-3 px-4 font-semibold">Last Verified Inspection</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1C1C1E]">
                    {filteredToilets.map((toilet) => (
                      <tr key={toilet.id} className="hover:bg-[#121212]/60 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-[#F5F5F7]">
                          <div className="font-semibold">{toilet.name}</div>
                          <div className="text-[11px] text-[#6E6E73] truncate max-w-xs">{toilet.address}</div>
                        </td>
                        <td className="py-3.5 px-4 text-[#A1A1A6]">
                          {toilet.locality}, {toilet.city}
                        </td>
                        <td className="py-3.5 px-4">
                          {getStatusBadge(toilet.verified_status)}
                        </td>
                        <td className="py-3.5 px-4 text-[#A1A1A6]">
                          {toilet.last_inspected_at
                            ? new Date(toilet.last_inspected_at).toLocaleDateString()
                            : 'Pending inspection'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedToiletForInspect(toilet)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F5F5F7] hover:bg-white text-[#050505] transition-all inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <Camera size={13} />
                            <span>AI Inspect & Verify</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: CUSTOMER COMPLAINTS MANAGEMENT                    */}
      {/* ======================================================== */}
      {activeTab === 'complaints' && (
        <div className="space-y-4">
          
          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            {['all', 'Open', 'In Progress', 'Resolved'].map((st) => (
              <button
                key={st}
                onClick={() => setComplaintFilter(st)}
                className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  complaintFilter === st
                    ? 'bg-[#F5F5F7] text-[#050505] font-semibold'
                    : 'bg-[#121212] text-[#A1A1A6] hover:bg-[#1A1A1A] border border-[#262626]'
                }`}
              >
                {st === 'all' ? 'All Complaints' : st}
              </button>
            ))}
          </div>

          {filteredComplaints.length === 0 ? (
            <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-12 text-center text-xs text-[#A1A1A6]">
              No complaints in this category.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredComplaints.map((c) => {
                const isUpdating = updatingComplaintId === c.id;
                return (
                  <div
                    key={c.id}
                    className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-5 space-y-3 shadow-lg"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1C1C1E] pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#2997FF]">{c.reference_number}</span>
                          <span className="text-[#3D3D3D]">•</span>
                          <span className="text-xs font-semibold text-[#F5F5F7]">{c.toilet_name}</span>
                        </div>
                        <div className="text-[11px] text-[#6E6E73] mt-0.5">
                          Submitted on {new Date(c.created_at).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#6E6E73]">Status:</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          c.status === 'Resolved'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : c.status === 'In Progress' || c.status === 'Under Investigation' || c.status === 'Action Taken'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                        }`}>
                          {c.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 text-xs">
                      <div className="sm:col-span-8 space-y-2">
                        <div>
                          <span className="text-[#6E6E73]">Issue Type: </span>
                          <span className="font-medium text-[#F5F5F7] capitalize">
                            {c.category.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-[#D1D1D6] p-3 rounded-xl bg-[#141414] border border-[#262626]">
                          {c.description || 'No description provided.'}
                        </p>
                        {c.resolution_notes && (
                          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px]">
                            <strong>Resolution note:</strong> {c.resolution_notes}
                          </div>
                        )}
                      </div>

                      {c.photo_url && (
                        <div className="sm:col-span-4 flex flex-col items-start sm:items-end">
                          <span className="text-[11px] text-[#6E6E73] mb-1">Attached Photo:</span>
                          <a
                            href={getMediaUrl(c.photo_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-28 h-20 rounded-lg overflow-hidden border border-[#262626]"
                          >
                            <img
                              src={getMediaUrl(c.photo_url)}
                              alt="Complaint"
                              className="w-full h-full object-cover"
                            />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Officer Status Action Buttons */}
                    <div className="pt-3 border-t border-[#1C1C1E] flex flex-wrap items-center justify-between gap-3 text-xs">
                      <span className="text-[#6E6E73]">Update Complaint Status:</span>
                      <div className="flex items-center gap-2">
                        {c.status !== 'Open' && c.status !== 'Received' && (
                          <button
                            disabled={isUpdating}
                            onClick={() => handleUpdateComplaintStatus(c.id, 'Open')}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#161616] hover:bg-[#202020] text-[#F5F5F7] border border-[#262626] transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Mark Open
                          </button>
                        )}

                        {c.status !== 'In Progress' && (
                          <button
                            disabled={isUpdating}
                            onClick={() => handleUpdateComplaintStatus(c.id, 'In Progress')}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Mark In Progress
                          </button>
                        )}

                        {c.status !== 'Resolved' && (
                          <button
                            disabled={isUpdating}
                            onClick={() => {
                              setResolvingComplaint(c);
                              setResolutionNote('Sanitation crew dispatched. Cleaned and sanitized by municipal contractor.');
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-[#050505] transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                          >
                            Mark Resolved...
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: REGISTER NEW TOILET FORM                          */}
      {/* ======================================================== */}
      {activeTab === 'register' && (
        <div className="max-w-2xl mx-auto bg-[#0D0D0D] border border-[#262626] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="border-b border-[#1F1F1F] pb-4">
            <h2 className="text-lg font-semibold text-[#F5F5F7]">
              Register Public Toilet Facility
            </h2>
            <p className="text-xs text-[#6E6E73] mt-0.5">
              Add a new municipally managed or inspected restroom to the Clean AI directory.
            </p>
          </div>

          {regSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 size={15} />
              <span>{regSuccess}</span>
            </div>
          )}

          {regError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{regError}</span>
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#A1A1A6]">
                Facility Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={regForm.name}
                onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                placeholder="e.g. Connaught Place Block C Public Toilet"
                className="w-full px-3.5 py-2.5 bg-[#161616] border border-[#262626] rounded-xl text-xs text-[#F5F5F7] focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#A1A1A6]">
                  City <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={regForm.city}
                  onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                  placeholder="e.g. New Delhi"
                  className="w-full px-3.5 py-2.5 bg-[#161616] border border-[#262626] rounded-xl text-xs text-[#F5F5F7] focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#A1A1A6]">
                  Locality / Area <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={regForm.locality}
                  onChange={(e) => setRegForm({ ...regForm, locality: e.target.value })}
                  placeholder="e.g. Connaught Place"
                  className="w-full px-3.5 py-2.5 bg-[#161616] border border-[#262626] rounded-xl text-xs text-[#F5F5F7] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#A1A1A6]">
                Address <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={regForm.address}
                onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                placeholder="e.g. Opposite Metro Gate 4, Inner Circle"
                className="w-full px-3.5 py-2.5 bg-[#161616] border border-[#262626] rounded-xl text-xs text-[#F5F5F7] focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#A1A1A6]">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={regForm.latitude}
                  onChange={(e) => setRegForm({ ...regForm, latitude: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 bg-[#161616] border border-[#262626] rounded-xl text-xs text-[#F5F5F7] focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#A1A1A6]">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={regForm.longitude}
                  onChange={(e) => setRegForm({ ...regForm, longitude: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 bg-[#161616] border border-[#262626] rounded-xl text-xs text-[#F5F5F7] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Facilities Checkboxes */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#A1A1A6]">Available Facilities</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  'Running Water',
                  'Western WC',
                  'Washbasin',
                  'Soap Dispenser',
                  'Hand Dryer',
                  'Sanitary Napkins'
                ].map((facility) => {
                  const isChecked = regForm.facilities.includes(facility);
                  return (
                    <button
                      type="button"
                      key={facility}
                      onClick={() => toggleFacility(facility)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-[#F5F5F7] text-[#050505] border-[#F5F5F7] font-semibold'
                          : 'bg-[#161616] text-[#A1A1A6] border-[#262626]'
                      }`}
                    >
                      {facility}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#A1A1A6]">Operating Hours</label>
                <input
                  type="text"
                  value={regForm.opening_hours}
                  onChange={(e) => setRegForm({ ...regForm, opening_hours: e.target.value })}
                  placeholder="e.g. 24x7 or 06:00 - 23:00"
                  className="w-full px-3.5 py-2.5 bg-[#161616] border border-[#262626] rounded-xl text-xs text-[#F5F5F7] focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#A1A1A6]">Emergency Contact</label>
                <input
                  type="text"
                  value={regForm.contact_number}
                  onChange={(e) => setRegForm({ ...regForm, contact_number: e.target.value })}
                  placeholder="+91-11-2334455"
                  className="w-full px-3.5 py-2.5 bg-[#161616] border border-[#262626] rounded-xl text-xs text-[#F5F5F7] focus:outline-hidden"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs text-[#A1A1A6]">
              <input
                type="checkbox"
                checked={regForm.accessibility}
                onChange={(e) => setRegForm({ ...regForm, accessibility: e.target.checked })}
                className="rounded-sm bg-[#161616] border-[#333333] text-emerald-500"
              />
              <span>Wheelchair / Divyang Accessible Facility</span>
            </label>

            <button
              type="submit"
              disabled={isSubmittingReg}
              className="w-full py-3 rounded-xl text-xs font-semibold text-[#050505] bg-[#F5F5F7] hover:bg-white transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
            >
              {isSubmittingReg ? (
                <>
                  <Loader2 size={14} className="animate-spin text-[#050505]" />
                  <span>Registering Facility in Municipal Database...</span>
                </>
              ) : (
                <span>Register Toilet in Municipal Registry</span>
              )}
            </button>
          </form>
        </div>
      )}

      {/* AI Inspect Modal (Opens when officer clicks "AI Inspect & Verify") */}
      {selectedToiletForInspect && (
        <AIInspectModal
          toilet={selectedToiletForInspect}
          onClose={() => setSelectedToiletForInspect(null)}
          onInspectionConfirmed={(updatedToilet) => {
            setToilets((prev) =>
              prev.map((t) => (t.id === updatedToilet.id ? updatedToilet : t))
            );
            setSelectedToiletForInspect(null);
          }}
        />
      )}

      {/* Modal to Mark Complaint Resolved with Notes */}
      {resolvingComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212] border border-[#262626] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#F5F5F7]">
                Resolve Complaint: {resolvingComplaint.reference_number}
              </h3>
              <button
                onClick={() => setResolvingComplaint(null)}
                className="text-[#6E6E73] hover:text-[#F5F5F7]"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[#A1A1A6]">
              Add a municipal resolution note that will be visible to the citizen when tracking this reference number.
            </p>

            <textarea
              rows={3}
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="e.g. Sanitation team deployed. Fixtures repaired and toilet floor bleached."
              className="w-full px-3 py-2 bg-[#161616] border border-[#262626] rounded-xl text-xs text-[#F5F5F7] focus:outline-hidden"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setResolvingComplaint(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#A1A1A6] hover:text-[#F5F5F7] bg-[#161616] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleUpdateComplaintStatus(
                    resolvingComplaint.id,
                    'Resolved',
                    resolutionNote
                  )
                }
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-[#050505] transition-colors cursor-pointer"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
