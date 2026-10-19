import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Eye,
  EyeOff,
  Mail,
  User,
  LogOut,
  MapPin,
  ExternalLink,
  ChevronRight,
  Filter,
  Building2,
  BarChart3,
  History,
  Send,
  Edit2
} from 'lucide-react';
import { api, getMediaUrl } from '../services/api';
import { Toilet, Complaint, Inspection, MunicipalAnalytics } from '../types';
import { AIInspectModal } from '../components/AIInspectModal';
import { useAuth } from '../context/AuthContext';

export const MunicipalPortal: React.FC = () => {
  const { user, login, register, logout, quickSwitchRole } = useAuth();

  const [searchParams] = useSearchParams();
  const [isRegister, setIsRegister] = useState(() => searchParams.get('mode') === 'register');
  const [officerName, setOfficerName] = useState('');
  const [officerEmail, setOfficerEmail] = useState('');
  const [officerPassword, setOfficerPassword] = useState('');
  const [officerInviteCode, setOfficerInviteCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Portal data states
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [analytics, setAnalytics] = useState<MunicipalAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'toilets' | 'pending' | 'complaints' | 'history' | 'analytics' | 'register'>('toilets');

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [complaintFilter, setComplaintFilter] = useState('all');
  const [inspectionToiletFilter, setInspectionToiletFilter] = useState('all');

  // AI Inspection Modal state
  const [selectedToiletForInspect, setSelectedToiletForInspect] = useState<Toilet | null>(null);

  // Approve / Reject state
  const [rejectingToilet, setRejectingToilet] = useState<Toilet | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  // Edit Toilet state
  const [editingToilet, setEditingToilet] = useState<Toilet | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    address: string;
    locality: string;
    city: string;
    opening_hours: string;
    accessibility: boolean;
  }>({
    name: '',
    address: '',
    locality: '',
    city: '',
    opening_hours: '',
    accessibility: true
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Assign task from complaint state
  const [assigningComplaint, setAssigningComplaint] = useState<Complaint | null>(null);
  const [assignmentPriority, setAssignmentPriority] = useState<string>('High');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);

  // New Toilet Registration Form state
  const [regForm, setRegForm] = useState({
    name: '',
    address: '',
    city: '',
    locality: '',
    latitude: 0,
    longitude: 0,
    description: '',
    facilities: ['Running Water', 'Western WC', 'Washbasin'],
    opening_hours: '06:00 - 23:00',
    accessibility: true,
    contact_number: ''
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
      const [tList, cList, iList, aData] = await Promise.all([
        api.getToilets(),
        api.getComplaints(),
        api.getInspections().catch(() => []),
        api.getAnalytics().catch(() => null)
      ]);
      setToilets(tList);
      setComplaints(cList);
      setInspections(iList);
      setAnalytics(aData);
    } catch (err) {
      console.error('Failed to load municipal portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOfficerAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (isRegister) {
        await register({
          email: officerEmail,
          password: officerPassword,
          full_name: officerName,
          role: 'officer',
          invite_code: officerInviteCode.trim() || undefined
        });
      } else {
        await login(officerEmail, officerPassword);
        const token = localStorage.getItem('clean_ai_token');
        if (token) {
          const profile = await api.getMe();
          if (profile.role !== 'officer') {
            setAuthError(
              `The account "${officerEmail}" is registered as a ${profile.role === 'owner' ? 'Facility Owner' : profile.role}. The Authority Portal requires an authorized Municipal Officer account. Please use officer credentials (e.g. officer@cleanai.gov) or sign up as an officer.`
            );
          }
        }
      }
    } catch (err: any) {
      setAuthError(err.message || (isRegister ? 'Registration failed.' : 'Login failed. Please check officer credentials.'));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleApproveRegistration = async (toiletId: string) => {
    setIsSubmittingDecision(true);
    try {
      const updated = await api.approveToilet(toiletId);
      setToilets((prev) => prev.map((t) => (t.id === toiletId ? updated : t)));
      alert(`Toilet "${updated.name}" has been officially Approved and verified for public listing.`);
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const handleRejectRegistration = async () => {
    if (!rejectingToilet) return;
    if (!rejectionReason.trim()) {
      alert('A valid reason for rejection is mandatory.');
      return;
    }
    setIsSubmittingDecision(true);
    try {
      const updated = await api.rejectToilet(rejectingToilet.id, rejectionReason.trim());
      setToilets((prev) => prev.map((t) => (t.id === rejectingToilet.id ? updated : t)));
      setRejectingToilet(null);
      setRejectionReason('');
      alert(`Facility "${updated.name}" has been marked Rejected.`);
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const handleOpenEditToilet = (toilet: Toilet) => {
    setEditingToilet(toilet);
    setEditForm({
      name: toilet.name,
      address: toilet.address,
      locality: toilet.locality,
      city: toilet.city,
      opening_hours: toilet.opening_hours || '06:00 - 23:00',
      accessibility: toilet.accessibility
    });
  };

  const handleSaveToiletEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingToilet) return;
    setIsSubmittingEdit(true);
    try {
      const updated = await api.updateToilet(editingToilet.id, editForm);
      setToilets((prev) => prev.map((t) => (t.id === editingToilet.id ? updated : t)));
      setEditingToilet(null);
      alert(`Facility "${updated.name}" updated successfully.`);
    } catch (err: any) {
      alert(err.message || 'Update failed');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningComplaint) return;
    setIsSubmittingAssignment(true);
    try {
      await api.createTask({
        toilet_id: assigningComplaint.toilet_id,
        priority: assignmentPriority,
        notes: assignmentNotes.trim() || `Citizen report resolution: ${assigningComplaint.category}`
      });
      // Mark complaint in progress
      await handleUpdateComplaintStatus(assigningComplaint.id, 'In Progress', 'Sanitation cleaning task assigned to facility owner / team.');
      setAssigningComplaint(null);
      setAssignmentNotes('');
      alert('Cleaning order created and assigned to facility contractor in database!');
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch cleaning order');
    } finally {
      setIsSubmittingAssignment(false);
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
        city: '',
        locality: '',
        latitude: 0,
        longitude: 0,
        description: '',
        facilities: ['Running Water', 'Western WC', 'Washbasin'],
        opening_hours: '06:00 - 23:00',
        accessibility: true,
        contact_number: ''
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

  // If not logged in as officer, render simple secure login / signup screen
  if (!isOfficer) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 space-y-6 text-[#F5F5F7]">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#141414] border border-[#262626] flex items-center justify-center mx-auto text-[#F5F5F7]">
            <ShieldCheck size={26} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isRegister ? 'Register Municipal Officer' : 'Authority Portal Login'}
          </h1>
          <p className="text-xs text-[#A1A1A6]">
            {isRegister ? 'Create an authorized officer account to inspect and verify sanitation.' : 'Secure access for authorized municipal health and sanitation officers.'}
          </p>
        </div>

        <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-6 space-y-5 shadow-xl">
          {/* If user is already signed in with a different role (e.g. Owner), show notice */}
          {user && user.role !== 'officer' && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle size={15} className="shrink-0 text-amber-400 mt-0.5" />
                <div>
                  You are currently logged in as a <strong className="text-white capitalize">{user.role === 'owner' ? 'Facility Owner' : user.role}</strong> ({user.email}). The Authority Portal requires a <strong>Municipal Officer</strong> account.
                </div>
              </div>
              <div className="pt-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => logout()}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold cursor-pointer transition-colors"
                >
                  Log out of Facility Owner account
                </button>
              </div>
            </div>
          )}

          {/* Segment switch tabs */}
          <div className="grid grid-cols-2 p-1 bg-[#141414] border border-[#262626] rounded-xl text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setAuthError(null);
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                !isRegister
                  ? 'bg-[#F5F5F7] text-[#050505] font-semibold shadow-xs'
                  : 'text-[#A1A1A6] hover:text-[#F5F5F7]'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setAuthError(null);
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                isRegister
                  ? 'bg-[#F5F5F7] text-[#050505] font-semibold shadow-xs'
                  : 'text-[#A1A1A6] hover:text-[#F5F5F7]'
              }`}
            >
              Sign Up
            </button>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{authError}</span>
              </div>
              {authError.toLowerCase().includes('already') && isRegister && (
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setAuthError(null);
                  }}
                  className="self-start text-[11px] font-medium text-white underline underline-offset-2 hover:text-[#A1A1A6] transition-colors"
                >
                  Already registered? Click here to Log In &rarr;
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleOfficerAuth} className="space-y-4">
            {isRegister && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#A1A1A6]">Officer Full Name</label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" />
                  <input
                    type="text"
                    required
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    placeholder=""
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#161616] border border-[#262626] rounded-xl text-xs text-[#F5F5F7] focus:border-[#F5F5F7]/40 focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#A1A1A6]">Officer Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" />
                <input
                  type="email"
                  required
                  value={officerEmail}
                  onChange={(e) => setOfficerEmail(e.target.value)}
                  placeholder=""
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#161616] border border-[#262626] rounded-xl text-xs text-[#F5F5F7] focus:border-[#F5F5F7]/40 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#A1A1A6]">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={officerPassword}
                  onChange={(e) => setOfficerPassword(e.target.value)}
                  placeholder=""
                  className="w-full pl-10 pr-10 py-2.5 bg-[#161616] border border-[#262626] rounded-xl text-xs text-[#F5F5F7] focus:border-[#F5F5F7]/40 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6E73] hover:text-[#F5F5F7] transition-colors p-0.5 rounded cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {isRegister && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#A1A1A6]">
                    Officer Authorization Key <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[10px] text-[#6E6E73] font-mono">Key: MUNICIPAL-OFFICER-2026</span>
                </div>
                <div className="relative">
                  <ShieldCheck size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" />
                  <input
                    type="text"
                    required
                    value={officerInviteCode}
                    onChange={(e) => setOfficerInviteCode(e.target.value)}
                    placeholder="MUNICIPAL-OFFICER-2026"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#161616] border border-[#262626] rounded-xl text-xs text-[#F5F5F7] font-mono focus:border-[#F5F5F7]/40 focus:outline-hidden"
                  />
                </div>
                <p className="text-[10px] text-[#6E6E73]">
                  Authorized key provided by municipal administration to prevent unauthorized access.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-[#050505] bg-[#F5F5F7] hover:bg-white transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {authLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin text-[#050505]" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>{isRegister ? 'Register as Municipal Officer' : 'Log In as Municipal Officer'}</span>
              )}
            </button>
          </form>

          {/* Toggle between Log In and Sign Up */}
          <div className="text-center pt-2 border-t border-[#1F1F1F]">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setAuthError(null);
              }}
              className="text-xs text-[#A1A1A6] hover:text-[#F5F5F7] transition-colors cursor-pointer"
            >
              {isRegister ? (
                <span>Already have an officer account? <strong className="text-[#F5F5F7] underline">Log In</strong></span>
              ) : (
                <span>Need an officer account? <strong className="text-[#F5F5F7] underline">Sign Up</strong></span>
              )}
            </button>
          </div>
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

      {/* KPI Overview Metrics (Calculated dynamically from real database records) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Facilities */}
        <div
          onClick={() => {
            setActiveTab('toilets');
            setStatusFilter('all');
          }}
          className="bg-[#0D0D0D] border border-[#262626] hover:border-[#3D3D3D] rounded-2xl p-4 transition-all cursor-pointer space-y-1 shadow-sm"
        >
          <div className="flex items-center justify-between text-xs text-[#A1A1A6]">
            <span>Total Facilities</span>
            <Building2 size={14} className="text-[#A1A1A6]" />
          </div>
          <div className="text-xl font-bold text-[#F5F5F7]">{toilets.length}</div>
          <div className="text-[10px] text-[#6E6E73]">Registered in DB</div>
        </div>

        {/* Clean */}
        <div
          onClick={() => {
            setActiveTab('toilets');
            setStatusFilter('Clean');
          }}
          className="bg-[#0D0D0D] border border-[#262626] hover:border-emerald-500/40 rounded-2xl p-4 transition-all cursor-pointer space-y-1 shadow-sm"
        >
          <div className="flex items-center justify-between text-xs text-emerald-400">
            <span>Verified Clean</span>
            <CheckCircle2 size={14} />
          </div>
          <div className="text-xl font-bold text-emerald-400">
            {toilets.filter((t) => t.verified_status === 'Clean').length}
          </div>
          <div className="text-[10px] text-[#6E6E73]">Officer certified</div>
        </div>

        {/* Needs Cleaning */}
        <div
          onClick={() => {
            setActiveTab('toilets');
            setStatusFilter('Needs Cleaning');
          }}
          className="bg-[#0D0D0D] border border-[#262626] hover:border-amber-500/40 rounded-2xl p-4 transition-all cursor-pointer space-y-1 shadow-sm"
        >
          <div className="flex items-center justify-between text-xs text-amber-400">
            <span>Needs Cleaning</span>
            <AlertTriangle size={14} />
          </div>
          <div className="text-xl font-bold text-amber-400">
            {toilets.filter((t) => t.verified_status === 'Needs Cleaning').length}
          </div>
          <div className="text-[10px] text-[#6E6E73]">Action scheduled</div>
        </div>

        {/* Under Maintenance */}
        <div
          onClick={() => {
            setActiveTab('toilets');
            setStatusFilter('Under Maintenance');
          }}
          className="bg-[#0D0D0D] border border-[#262626] hover:border-rose-500/40 rounded-2xl p-4 transition-all cursor-pointer space-y-1 shadow-sm"
        >
          <div className="flex items-center justify-between text-xs text-rose-400">
            <span>Maintenance</span>
            <Wrench size={14} />
          </div>
          <div className="text-xl font-bold text-rose-400">
            {toilets.filter((t) => t.verified_status === 'Under Maintenance').length}
          </div>
          <div className="text-[10px] text-[#6E6E73]">Repairs ongoing</div>
        </div>

        {/* Pending Approvals */}
        <div
          onClick={() => {
            setActiveTab('pending');
          }}
          className="bg-[#0D0D0D] border border-[#262626] hover:border-[#3D3D3D] rounded-2xl p-4 transition-all cursor-pointer space-y-1 shadow-sm"
        >
          <div className="flex items-center justify-between text-xs text-[#A1A1A6]">
            <span>Pending Approvals</span>
            <Clock size={14} />
          </div>
          <div className="text-xl font-bold text-[#F5F5F7]">
            {toilets.filter((t) => t.registration_status === 'Pending Approval').length}
          </div>
          <div className="text-[10px] text-[#6E6E73]">Owner submissions</div>
        </div>

        {/* Unresolved Complaints */}
        <div
          onClick={() => {
            setActiveTab('complaints');
            setComplaintFilter('Open');
          }}
          className="bg-[#0D0D0D] border border-[#262626] hover:border-sky-500/40 rounded-2xl p-4 transition-all cursor-pointer space-y-1 shadow-sm"
        >
          <div className="flex items-center justify-between text-xs text-sky-400">
            <span>Open Reports</span>
            <FileText size={14} />
          </div>
          <div className="text-xl font-bold text-sky-400">
            {complaints.filter((c) => c.status !== 'Resolved').length}
          </div>
          <div className="text-[10px] text-[#6E6E73]">Citizen issues</div>
        </div>
      </div>

      {/* Clean Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#262626] pb-3 text-xs font-medium">
        <button
          id="tab-toilets"
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
          id="tab-pending"
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'pending'
              ? 'bg-[#F5F5F7] text-[#050505] font-semibold'
              : 'text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-[#141414]'
          }`}
        >
          <span>Pending Approvals ({toilets.filter((t) => t.registration_status === 'Pending Approval').length})</span>
          {toilets.filter((t) => t.registration_status === 'Pending Approval').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>

        <button
          id="tab-complaints"
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
          id="tab-history"
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-[#F5F5F7] text-[#050505] font-semibold'
              : 'text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-[#141414]'
          }`}
        >
          <History size={13} />
          <span>Inspection History ({inspections.length})</span>
        </button>

        <button
          id="tab-analytics"
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'analytics'
              ? 'bg-[#F5F5F7] text-[#050505] font-semibold'
              : 'text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-[#141414]'
          }`}
        >
          <BarChart3 size={13} />
          <span>Analytics & Reports</span>
        </button>

        <button
          id="tab-register"
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
                placeholder="Search facility name, locality, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-[#161616] border border-[#262626] rounded-xl text-xs text-[#F5F5F7] placeholder-[#6E6E73] focus:outline-hidden"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
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
            <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-12 text-center space-y-3">
              <ShieldCheck size={32} className="mx-auto text-[#6E6E73]" />
              <h3 className="text-sm font-semibold text-[#F5F5F7]">No Matching Facilities Found</h3>
              <p className="text-xs text-[#A1A1A6] max-w-sm mx-auto">
                No facilities match your search filter in the database. Clear filters or register a new facility.
              </p>
              <button
                onClick={() => setActiveTab('register')}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#F5F5F7] text-[#050505] hover:bg-white cursor-pointer shadow-sm"
              >
                Register First Facility
              </button>
            </div>
          ) : (
            <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#262626] bg-[#121212] text-[#A1A1A6]">
                      <th className="py-3 px-4 font-semibold">Toilet Name & Address</th>
                      <th className="py-3 px-4 font-semibold">Locality / City</th>
                      <th className="py-3 px-4 font-semibold">Registration</th>
                      <th className="py-3 px-4 font-semibold">Verified Status</th>
                      <th className="py-3 px-4 font-semibold">Last Inspection</th>
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
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                            toilet.registration_status === 'Approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : toilet.registration_status === 'Pending Approval'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {toilet.registration_status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {getStatusBadge(toilet.verified_status)}
                        </td>
                        <td className="py-3.5 px-4 text-[#A1A1A6]">
                          {toilet.last_inspected_at
                            ? new Date(toilet.last_inspected_at).toLocaleDateString()
                            : 'Pending inspection'}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEditToilet(toilet)}
                            title="Edit facility details"
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#161616] hover:bg-[#202020] text-[#A1A1A6] hover:text-[#F5F5F7] border border-[#262626] transition-all inline-flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Edit2 size={12} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => setSelectedToiletForInspect(toilet)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F5F5F7] hover:bg-white text-[#050505] transition-all inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <Camera size={13} />
                            <span>AI Inspect</span>
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
      {/* TAB 2: PENDING APPROVALS                                  */}
      {/* ======================================================== */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="border-b border-[#262626] pb-3">
            <h2 className="text-base font-semibold text-[#F5F5F7]">
              Pending Facility Registrations
            </h2>
            <p className="text-xs text-[#A1A1A6]">
              Review and authorize toilet facilities submitted by facility owners and contractors.
            </p>
          </div>

          {toilets.filter((t) => t.registration_status === 'Pending Approval').length === 0 ? (
            <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-12 text-center space-y-2">
              <CheckCircle2 size={32} className="mx-auto text-emerald-400" />
              <h3 className="text-sm font-semibold text-[#F5F5F7]">No Pending Registrations</h3>
              <p className="text-xs text-[#A1A1A6]">
                All submitted facilities have been reviewed and verified by municipal officers.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {toilets
                .filter((t) => t.registration_status === 'Pending Approval')
                .map((t) => (
                  <div
                    key={t.id}
                    className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-5 space-y-3 shadow-lg"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1C1C1E] pb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-[#F5F5F7]">{t.name}</h3>
                        <div className="text-xs text-[#A1A1A6] mt-0.5 flex items-center gap-2">
                          <MapPin size={12} className="text-[#6E6E73]" />
                          <span>{t.address}, {t.locality}, {t.city}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Pending Municipal Review
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-[#6E6E73] block">Submitted By</span>
                        <span className="font-medium text-[#F5F5F7]">{t.owner_name || 'Owner'}</span>
                      </div>
                      <div>
                        <span className="text-[#6E6E73] block">Contact</span>
                        <span className="font-medium text-[#F5F5F7]">{t.contact_number || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[#6E6E73] block">Operating Hours</span>
                        <span className="font-medium text-[#F5F5F7]">{t.opening_hours || '24x7'}</span>
                      </div>
                      <div>
                        <span className="text-[#6E6E73] block">Accessibility</span>
                        <span className="font-medium text-[#F5F5F7]">{t.accessibility ? 'Wheelchair Accessible' : 'Standard'}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {t.facilities.map((f) => (
                        <span
                          key={f}
                          className="px-2 py-0.5 rounded-md text-[11px] bg-[#161616] text-[#A1A1A6] border border-[#262626]"
                        >
                          {f}
                        </span>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-[#1C1C1E] flex items-center justify-end gap-2">
                      <button
                        disabled={isSubmittingDecision}
                        onClick={() => {
                          setRejectingToilet(t);
                          setRejectionReason('');
                        }}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Reject...
                      </button>
                      <button
                        disabled={isSubmittingDecision}
                        onClick={() => handleApproveRegistration(t.id)}
                        className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-[#050505] transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                      >
                        Approve Facility
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: CUSTOMER COMPLAINTS MANAGEMENT                    */}
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
            <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-12 text-center space-y-2">
              <p className="text-sm font-semibold text-[#F5F5F7]">No Customer Complaints</p>
              <p className="text-xs text-[#A1A1A6]">
                There are currently no citizen complaints filed matching this filter.
              </p>
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
                          {c.description}
                        </p>
                        {c.resolution_notes && (
                          <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-emerald-400 text-[11px]">
                            <strong>Resolution Note:</strong> {c.resolution_notes}
                          </div>
                        )}
                      </div>

                      {c.photo_url && (
                        <div className="sm:col-span-4">
                          <span className="text-[#6E6E73] block mb-1">Citizen Photo:</span>
                          <a
                            href={getMediaUrl(c.photo_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block rounded-xl overflow-hidden border border-[#262626] group relative aspect-video bg-black"
                          >
                            <img
                              src={getMediaUrl(c.photo_url)}
                              alt="Citizen report photo"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Officer Status Action Buttons */}
                    <div className="pt-3 border-t border-[#1C1C1E] flex flex-wrap items-center justify-between gap-3 text-xs">
                      <span className="text-[#6E6E73]">Officer Actions:</span>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          disabled={isUpdating}
                          onClick={() => {
                            setAssigningComplaint(c);
                            setAssignmentNotes(`Citizen complaint regarding ${c.category.replace('_', ' ')}: ${c.description}`);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#161616] hover:bg-[#202020] text-sky-400 border border-sky-500/25 transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                        >
                          <Send size={12} />
                          <span>Assign Cleaning Order</span>
                        </button>

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
      {/* TAB 4: INSPECTION HISTORY                                */}
      {/* ======================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#262626] pb-3">
            <div>
              <h2 className="text-base font-semibold text-[#F5F5F7]">
                Inspection Audit History
              </h2>
              <p className="text-xs text-[#A1A1A6]">
                All official AI computer vision inferences and officer-certified decisions saved in the municipal database.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6E6E73]">Filter Facility:</span>
              <select
                value={inspectionToiletFilter}
                onChange={(e) => setInspectionToiletFilter(e.target.value)}
                className="px-3 py-1.5 bg-[#161616] border border-[#262626] rounded-xl text-xs text-[#F5F5F7] focus:outline-hidden"
              >
                <option value="all">All Facilities</option>
                {toilets.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {inspections.filter((ins) => inspectionToiletFilter === 'all' || ins.toilet_id === inspectionToiletFilter).length === 0 ? (
            <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-12 text-center space-y-2">
              <History size={32} className="mx-auto text-[#6E6E73]" />
              <h3 className="text-sm font-semibold text-[#F5F5F7]">No Inspections Recorded</h3>
              <p className="text-xs text-[#A1A1A6]">
                Inspections will appear here once officers analyze facilities using the YOLO AI model.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {inspections
                .filter((ins) => inspectionToiletFilter === 'all' || ins.toilet_id === inspectionToiletFilter)
                .map((ins) => (
                  <div
                    key={ins.id}
                    className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-5 space-y-3 shadow-lg"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1C1C1E] pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-[#F5F5F7]">{ins.toilet_name || ins.toilet_id}</span>
                          <span className="text-[#3D3D3D]">•</span>
                          <span className="text-[11px] font-mono text-[#6E6E73]">{ins.id}</span>
                        </div>
                        <div className="text-[11px] text-[#6E6E73] mt-0.5">
                          Inspected on {new Date(ins.created_at).toLocaleString()} by {ins.inspector_name}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {getStatusBadge(ins.officer_decision)}
                        {ins.is_override && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Officer Override
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 text-xs">
                      <div className="sm:col-span-8 space-y-2">
                        <div>
                          <span className="text-[#6E6E73]">AI Model Recommendation: </span>
                          <strong className="text-[#F5F5F7]">{ins.ai_recommendation}</strong>
                          <span className="text-[11px] text-[#6E6E73] ml-2">({ins.model_identifier})</span>
                        </div>

                        {ins.ai_raw_output?.detections && ins.ai_raw_output.detections.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[11px] text-[#6E6E73]">Model Detected Objects:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {ins.ai_raw_output.detections.map((d: any, idx: number) => (
                                <span
                                  key={idx}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono border ${
                                    d.is_dirty_indicator
                                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  }`}
                                >
                                  {d.class_name} ({Math.round(d.confidence * 100)}%)
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {ins.is_override && ins.override_reason && (
                          <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-400 text-[11px]">
                            <strong>Override Justification:</strong> {ins.override_reason}
                          </div>
                        )}
                      </div>

                      {ins.image_url && (
                        <div className="sm:col-span-4">
                          <a
                            href={getMediaUrl(ins.image_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block rounded-xl overflow-hidden border border-[#262626] group aspect-video bg-black"
                          >
                            <img
                              src={getMediaUrl(ins.image_url)}
                              alt="Inspection preview"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: ANALYTICS & REPORTS                               */}
      {/* ======================================================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="border-b border-[#262626] pb-3">
            <h2 className="text-base font-semibold text-[#F5F5F7]">
              Municipal Cleanliness & Sanitation Intelligence
            </h2>
            <p className="text-xs text-[#A1A1A6]">
              Real-time analytics and historical inspection metrics aggregated across all public facilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Compliance Rate Card */}
            <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-6 space-y-3 shadow-lg">
              <span className="text-xs text-[#A1A1A6] font-medium">Certified Compliance Rate</span>
              <div className="text-4xl font-extrabold text-emerald-400">
                {analytics?.cleanliness_rate ?? 0}%
              </div>
              <p className="text-xs text-[#6E6E73]">
                Percentage of public facilities currently holding verified Clean status.
              </p>
            </div>

            {/* Inspections Completed */}
            <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-6 space-y-3 shadow-lg">
              <span className="text-xs text-[#A1A1A6] font-medium">Completed Inspections</span>
              <div className="text-4xl font-extrabold text-[#F5F5F7]">
                {analytics?.completed_inspections ?? inspections.length}
              </div>
              <p className="text-xs text-[#6E6E73]">
                Total verified audits executed with YOLO computer vision.
              </p>
            </div>

            {/* Resolved Complaints */}
            <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-6 space-y-3 shadow-lg">
              <span className="text-xs text-[#A1A1A6] font-medium">Resolved Citizen Reports</span>
              <div className="text-4xl font-extrabold text-sky-400">
                {analytics?.resolved_complaints ?? complaints.filter((c) => c.status === 'Resolved').length}
              </div>
              <p className="text-xs text-[#6E6E73]">
                Sanitation reports addressed and closed with resolution notes.
              </p>
            </div>
          </div>

          {/* Locality Breakdown */}
          {analytics?.locality_breakdown && analytics.locality_breakdown.length > 0 && (
            <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-6 space-y-4 shadow-lg">
              <h3 className="text-sm font-semibold text-[#F5F5F7]">Locality Distribution</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {analytics.locality_breakdown.map((loc) => (
                  <div key={loc.locality} className="p-3 rounded-xl bg-[#141414] border border-[#262626]">
                    <div className="text-xs text-[#A1A1A6]">{loc.locality}</div>
                    <div className="text-lg font-bold text-[#F5F5F7]">{loc.total} facilities</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Frequent Issues */}
          {analytics?.frequent_issue_categories && analytics.frequent_issue_categories.length > 0 && (
            <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-6 space-y-4 shadow-lg">
              <h3 className="text-sm font-semibold text-[#F5F5F7]">Citizen Reported Issue Frequency</h3>
              <div className="space-y-2">
                {analytics.frequent_issue_categories.map((iss) => (
                  <div key={iss.category} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-[#141414] border border-[#262626]">
                    <span className="text-[#F5F5F7] font-medium">{iss.category}</span>
                    <span className="px-2 py-0.5 rounded-md bg-[#222222] text-[#A1A1A6] font-mono">{iss.count} reports</span>
                  </div>
                ))}
              </div>
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
                placeholder=""
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
                  placeholder=""
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
                  placeholder=""
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
                placeholder=""
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
                  placeholder=""
                  className="w-full px-3.5 py-2.5 bg-[#161616] border border-[#262626] rounded-xl text-xs text-[#F5F5F7] focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#A1A1A6]">Emergency Contact</label>
                <input
                  type="text"
                  value={regForm.contact_number}
                  onChange={(e) => setRegForm({ ...regForm, contact_number: e.target.value })}
                  placeholder=""
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
              placeholder=""
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

      {/* Modal to Reject Facility Registration */}
      {rejectingToilet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212] border border-[#262626] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#F5F5F7]">
                Reject Facility Registration
              </h3>
              <button
                onClick={() => setRejectingToilet(null)}
                className="text-[#6E6E73] hover:text-[#F5F5F7]"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[#A1A1A6]">
              Please state the official reason for rejecting <strong>{rejectingToilet.name}</strong>. This feedback will be recorded in the municipal audit trail.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#A1A1A6]">
                Rejection Reason <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Inadequate ventilation, non-functional water fixtures, or inaccurate location coordinates."
                className="w-full px-3 py-2 bg-[#161616] border border-[#262626] rounded-xl text-xs text-[#F5F5F7] placeholder-[#6E6E73] focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingToilet(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#A1A1A6] hover:text-[#F5F5F7] bg-[#161616] cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isSubmittingDecision}
                onClick={handleRejectRegistration}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-500 hover:bg-rose-400 text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmittingDecision ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal to Edit Facility Information */}
      {editingToilet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#121212] border border-[#262626] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#F5F5F7]">
                Edit Facility: {editingToilet.name}
              </h3>
              <button
                onClick={() => setEditingToilet(null)}
                className="text-[#6E6E73] hover:text-[#F5F5F7]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveToiletEdit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[#A1A1A6] font-semibold">Facility Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#A1A1A6] font-semibold">City</label>
                  <input
                    type="text"
                    required
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full px-3 py-2 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#A1A1A6] font-semibold">Locality / Area</label>
                  <input
                    type="text"
                    required
                    value={editForm.locality}
                    onChange={(e) => setEditForm({ ...editForm, locality: e.target.value })}
                    className="w-full px-3 py-2 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#A1A1A6] font-semibold">Address</label>
                <input
                  type="text"
                  required
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#A1A1A6] font-semibold">Operating Hours</label>
                <input
                  type="text"
                  value={editForm.opening_hours}
                  onChange={(e) => setEditForm({ ...editForm, opening_hours: e.target.value })}
                  className="w-full px-3 py-2 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] focus:outline-hidden"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1 text-[#A1A1A6]">
                <input
                  type="checkbox"
                  checked={editForm.accessibility}
                  onChange={(e) => setEditForm({ ...editForm, accessibility: e.target.checked })}
                  className="rounded bg-[#161616] border-[#333333] text-emerald-500"
                />
                <span>Wheelchair / Divyang Accessible</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1C1C1E]">
                <button
                  type="button"
                  onClick={() => setEditingToilet(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#A1A1A6] hover:text-[#F5F5F7] bg-[#161616] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#F5F5F7] hover:bg-white text-[#050505] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal to Assign Cleaning Order to Contractor / Team */}
      {assigningComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212] border border-[#262626] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#F5F5F7]">
                Dispatch Cleaning Order: {assigningComplaint.reference_number}
              </h3>
              <button
                onClick={() => setAssigningComplaint(null)}
                className="text-[#6E6E73] hover:text-[#F5F5F7]"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[#A1A1A6]">
              Create an official sanitation assignment for <strong>{assigningComplaint.toilet_name}</strong> and notify cleaning staff.
            </p>

            <form onSubmit={handleCreateAssignment} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[#A1A1A6] font-semibold">Priority Level</label>
                <select
                  value={assignmentPriority}
                  onChange={(e) => setAssignmentPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] focus:outline-hidden"
                >
                  <option value="Urgent">Urgent (Immediate Sanitation Hazard)</option>
                  <option value="High">High (Severe Odor / Broken Fixture)</option>
                  <option value="Medium">Medium (Routine Deep Clean)</option>
                  <option value="Low">Low (Restock Supplies)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[#A1A1A6] font-semibold">Assignment Instructions</label>
                <textarea
                  rows={3}
                  required
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  placeholder="Specific instructions for the sanitation contractor..."
                  className="w-full px-3 py-2 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] placeholder-[#6E6E73] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1C1C1E]">
                <button
                  type="button"
                  onClick={() => setAssigningComplaint(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#A1A1A6] hover:text-[#F5F5F7] bg-[#161616] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAssignment}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-[#050505] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingAssignment ? 'Dispatching...' : 'Dispatch Cleaning Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
