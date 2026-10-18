import React, { useState, useEffect } from 'react';
import {
  Building2,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Camera,
  MapPin,
  FileCheck,
  Loader2,
  Sparkles,
  Info,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { Toilet, CleaningTask, AIInferenceResult } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

export const OwnerPortal: React.FC = () => {
  const { user, quickSwitchRole } = useAuth();

  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [tasks, setTasks] = useState<CleaningTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Registration Form State
  const [showRegModal, setShowRegModal] = useState(false);
  const [regForm, setRegForm] = useState({
    name: '',
    address: '',
    city: 'New Delhi',
    locality: '',
    latitude: 28.6315,
    longitude: 77.2167,
    description: '',
    facilities: ['Running Water', 'Washbasin', 'Western WC'],
    opening_hours: '06:00 - 23:00',
    accessibility: true,
    access_type: 'public' as 'public' | 'private' | 'paid',
    contact_number: '+91-9812345678'
  });

  // Report Cleaning State
  const [activeTaskForReport, setActiveTaskForReport] = useState<CleaningTask | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [afterPhoto, setAfterPhoto] = useState<File | null>(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [afterPhotoAiResult, setAfterPhotoAiResult] = useState<AIInferenceResult | null>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);

  useEffect(() => {
    // If user is not owner, ensure owner permissions for this portal view
    if (user && user.role !== 'owner') {
      quickSwitchRole('owner');
    }
    loadOwnerData();
  }, []);

  const loadOwnerData = async () => {
    setLoading(true);
    try {
      const [tList, tkList] = await Promise.all([
        api.getToilets({ owner_only: true }),
        api.getTasks()
      ]);
      setToilets(tList);
      setTasks(tkList);
    } catch (e) {
      console.error('Failed to load owner data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.name || !regForm.address || !regForm.locality) {
      alert('Please fill out all required facility fields.');
      return;
    }

    try {
      await api.registerToilet(regForm);
      setShowRegModal(false);
      setRegForm({
        name: '',
        address: '',
        city: 'New Delhi',
        locality: '',
        latitude: 28.6315,
        longitude: 77.2167,
        description: '',
        facilities: ['Running Water', 'Washbasin', 'Western WC'],
        opening_hours: '06:00 - 23:00',
        accessibility: true,
        access_type: 'public',
        contact_number: '+91-9812345678'
      });
      await loadOwnerData();
      alert('Sanitation facility submitted! Status is now Pending Approval by municipal officers.');
    } catch (err: any) {
      alert(err.message || 'Registration failed');
    }
  };

  const handleMarkInProgress = async (taskId: string) => {
    try {
      await api.markTaskInProgress(taskId);
      await loadOwnerData();
    } catch (e: any) {
      alert(e.message || 'Failed to update task');
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAfterPhoto(file);
      // Run optional AI preview on the after-cleaning photo
      setIsAnalyzingPhoto(true);
      try {
        const result = await api.inspectImage(file);
        setAfterPhotoAiResult(result);
      } catch (err) {
        console.warn('After-photo AI analysis notice:', err);
      } finally {
        setIsAnalyzingPhoto(false);
      }
    }
  };

  const handleReportCompletionSubmit = async () => {
    if (!activeTaskForReport) return;
    if (!completionNotes.trim()) {
      alert('Please enter cleaning notes describing the work completed.');
      return;
    }

    setIsSubmittingReport(true);
    try {
      await api.reportCleaningCompletion(
        activeTaskForReport.id,
        completionNotes,
        afterPhoto || undefined
      );

      setActiveTaskForReport(null);
      setCompletionNotes('');
      setAfterPhoto(null);
      setAfterPhotoAiResult(null);
      await loadOwnerData();
      alert('Cleaning completion reported! Status updated to Verification Pending for municipal officer review.');
    } catch (err: any) {
      alert(err.message || 'Report submission failed');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F7] py-10 selection:bg-[#2997FF]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-[#262626]/80 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111111] border border-[#262626] text-[#2997FF] text-[11px] font-semibold tracking-wider uppercase mb-3">
              <Building2 size={13} />
              <span>Facility Operations Portal</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#F5F5F7]">
              Facility Owner & Contractor Hub
            </h1>
            <p className="text-sm text-[#86868B] mt-1.5 max-w-2xl leading-relaxed">
              Register commercial sanitation points, resolve dispatched municipal cleaning tasks, and submit verified photo evidence.
            </p>
          </div>

          <button
            onClick={() => setShowRegModal(true)}
            className="apple-button-primary self-start sm:self-auto flex items-center gap-2 py-3 px-5 shadow-lg shadow-[#2997FF]/20"
          >
            <PlusCircle size={16} />
            <span>Register Facility</span>
          </button>
        </div>

        {/* Verification Policy Card */}
        <div className="p-5 rounded-2xl bg-[#0D0D0D] border border-[#262626] flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-[#2997FF]/10 text-[#2997FF] shrink-0 mt-0.5">
            <Info size={18} />
          </div>
          <div className="space-y-1 text-xs leading-relaxed">
            <p className="font-semibold text-[#F5F5F7] text-sm flex items-center gap-2">
              Municipal Verification Integrity Protocol
            </p>
            <p className="text-[#86868B]">
              When you submit a completed cleaning report, the public status switches to{' '}
              <span className="font-semibold text-[#FF9F0A] bg-[#FF9F0A]/10 border border-[#FF9F0A]/20 px-2 py-0.5 rounded-md mx-1">
                Verification Pending
              </span>{' '}
              instead of an automatic Clean certification. A municipal officer must review and confirm photo evidence before the facility is certified Clean for citizens.
            </p>
          </div>
        </div>

        {/* Active Cleaning Orders */}
        <div className="apple-glass-card rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-[#FF9F0A] animate-pulse" />
                <h3 className="font-semibold text-lg text-[#F5F5F7]">
                  Assigned Cleaning Orders ({tasks.length})
                </h3>
              </div>
              <p className="text-xs text-[#86868B] mt-1">
                Tasks dispatched by municipal authorities requiring cleaning remediation.
              </p>
            </div>
            <span className="text-[11px] font-mono text-[#86868B] px-3 py-1 rounded-full bg-[#161616] border border-[#262626] self-start sm:self-auto">
              Real-time Work Queue
            </span>
          </div>

          <div className="divide-y divide-[#262626]">
            {loading ? (
              <div className="py-14 text-center text-[#86868B] space-y-3">
                <Loader2 size={24} className="animate-spin mx-auto text-[#2997FF]" />
                <p className="text-xs">Loading operational task queue...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="py-14 text-center text-[#86868B]">
                <CheckCircle2 size={32} className="mx-auto text-[#30D158] opacity-80 mb-2" />
                <p className="text-sm font-medium text-[#F5F5F7]">All Clean — No Pending Tasks</p>
                <p className="text-xs mt-1">There are currently no active cleaning remediation tasks assigned.</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-[#161616]/40 transition-colors"
                >
                  <div className="space-y-2.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${
                          task.priority === 'High'
                            ? 'bg-[#FF453A]/10 text-[#FF453A] border-[#FF453A]/25'
                            : 'bg-[#FF9F0A]/10 text-[#FF9F0A] border-[#FF9F0A]/25'
                        }`}
                      >
                        {task.priority} Priority
                      </span>
                      <span className="text-[11px] text-[#86868B] font-mono">
                        Dispatched {new Date(task.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="font-semibold text-base text-[#F5F5F7]">
                      {task.toilet_name}
                    </h4>
                    <p className="text-xs text-[#A1A1A6] leading-relaxed">
                      {task.notes}
                    </p>

                    {task.completion_notes && (
                      <div className="text-xs text-[#30D158] bg-[#30D158]/10 p-3 rounded-xl border border-[#30D158]/20 mt-2">
                        <span className="font-semibold block text-[11px] uppercase tracking-wider text-[#30D158]/80 mb-0.5">
                          Reported Completion Work:
                        </span>
                        "{task.completion_notes}"
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    {task.status === 'Pending' && (
                      <button
                        onClick={() => handleMarkInProgress(task.id)}
                        className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#262626] text-[#F5F5F7] text-xs font-semibold rounded-xl border border-[#333333] transition-colors"
                      >
                        Acknowledge & Begin Work
                      </button>
                    )}

                    {task.status === 'In Progress' && (
                      <button
                        onClick={() => setActiveTaskForReport(task)}
                        className="apple-button-primary px-4 py-2 text-xs flex items-center gap-2"
                      >
                        <Camera size={14} />
                        <span>Report Completion</span>
                      </button>
                    )}

                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                        task.status === 'Verified'
                          ? 'bg-[#30D158]/10 text-[#30D158] border-[#30D158]/20'
                          : task.status === 'Cleaning Reported'
                          ? 'bg-[#2997FF]/10 text-[#2997FF] border-[#2997FF]/20'
                          : 'bg-[#FF9F0A]/10 text-[#FF9F0A] border-[#FF9F0A]/20'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Owner's Registered Facilities Table */}
        <div className="apple-glass-card rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-[#262626] flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-[#F5F5F7]">
                Your Managed Toilet Facilities ({toilets.length})
              </h3>
              <p className="text-xs text-[#86868B] mt-1">
                Official registration status and live municipal cleanliness certifications.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0A0A0A] border-b border-[#262626] text-[#86868B] font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-4 px-6">Facility Details</th>
                  <th className="py-4 px-6">Registration Status</th>
                  <th className="py-4 px-6">Verified Public Status</th>
                  <th className="py-4 px-6">Operating Hours</th>
                  <th className="py-4 px-6">Last Inspected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {toilets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-[#86868B]">
                      No facilities registered under this account yet. Click "Register Facility" above to start.
                    </td>
                  </tr>
                ) : (
                  toilets.map((toilet) => (
                    <tr key={toilet.id} className="hover:bg-[#161616]/40 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-semibold text-[#F5F5F7] text-sm">{toilet.name}</p>
                        <p className="text-[#86868B] text-[11px] mt-0.5">
                          {toilet.address}, {toilet.locality}
                        </p>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            toilet.registration_status === 'Approved'
                              ? 'bg-[#30D158]/10 text-[#30D158] border-[#30D158]/20'
                              : toilet.registration_status === 'Pending Approval'
                              ? 'bg-[#FF9F0A]/10 text-[#FF9F0A] border-[#FF9F0A]/20'
                              : 'bg-[#FF453A]/10 text-[#FF453A] border-[#FF453A]/20'
                          }`}
                        >
                          {toilet.registration_status}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <StatusBadge status={toilet.verified_status} isStale={toilet.is_stale} size="sm" />
                      </td>

                      <td className="py-4 px-6 text-[#A1A1A6]">
                        {toilet.opening_hours || '24x7'}
                      </td>

                      <td className="py-4 px-6 font-mono text-[#86868B]">
                        {toilet.last_inspected_at
                          ? new Date(toilet.last_inspected_at).toLocaleDateString()
                          : 'No inspections yet'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Registration Modal */}
        {showRegModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl overflow-y-auto">
            <div className="w-full max-w-2xl bg-[#0D0D0D] border border-[#262626] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl my-8">
              <div className="flex items-center justify-between border-b border-[#262626] pb-5">
                <div>
                  <h3 className="text-xl font-semibold text-[#F5F5F7]">Register Public Facility</h3>
                  <p className="text-xs text-[#86868B] mt-1">
                    Submit facility coordinates and amenities for official municipal inspection.
                  </p>
                </div>
                <button
                  onClick={() => setShowRegModal(false)}
                  className="w-8 h-8 rounded-full bg-[#1A1A1A] hover:bg-[#262626] text-[#A1A1A6] hover:text-[#F5F5F7] flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#A1A1A6] mb-1.5">Facility Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Metro Gate 3 Public Convenience"
                      value={regForm.name}
                      onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                      className="w-full text-xs p-3 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] placeholder-[#6E6E73] focus:border-[#2997FF] focus:outline-hidden transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A1A1A6] mb-1.5">Locality / Area *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Connaught Place, Karol Bagh"
                      value={regForm.locality}
                      onChange={(e) => setRegForm({ ...regForm, locality: e.target.value })}
                      className="w-full text-xs p-3 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] placeholder-[#6E6E73] focus:border-[#2997FF] focus:outline-hidden transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#A1A1A6] mb-1.5">Full Street Address *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Near Metro Station Exit 2, Outer Ring Road"
                      value={regForm.address}
                      onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                      className="w-full text-xs p-3 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] placeholder-[#6E6E73] focus:border-[#2997FF] focus:outline-hidden transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A1A1A6] mb-1.5">GPS Latitude *</label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={regForm.latitude}
                      onChange={(e) => setRegForm({ ...regForm, latitude: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs p-3 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] font-mono focus:border-[#2997FF] focus:outline-hidden transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A1A1A6] mb-1.5">GPS Longitude *</label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={regForm.longitude}
                      onChange={(e) => setRegForm({ ...regForm, longitude: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs p-3 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] font-mono focus:border-[#2997FF] focus:outline-hidden transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A1A1A6] mb-1.5">Access Type</label>
                    <select
                      value={regForm.access_type}
                      onChange={(e) => setRegForm({ ...regForm, access_type: e.target.value as any })}
                      className="w-full text-xs p-3 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] focus:border-[#2997FF] focus:outline-hidden transition-colors"
                    >
                      <option value="public">Free Public Facility</option>
                      <option value="paid">Pay & Use Facility</option>
                      <option value="private">Commercial Private Restroom</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A1A1A6] mb-1.5">Opening Hours</label>
                    <input
                      type="text"
                      value={regForm.opening_hours}
                      onChange={(e) => setRegForm({ ...regForm, opening_hours: e.target.value })}
                      className="w-full text-xs p-3 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] focus:border-[#2997FF] focus:outline-hidden transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A1A1A6] mb-1.5">Description & Details</label>
                  <textarea
                    value={regForm.description}
                    onChange={(e) => setRegForm({ ...regForm, description: e.target.value })}
                    placeholder="Describe fixtures, regular cleaning protocols, ventilation details..."
                    rows={2}
                    className="w-full text-xs p-3 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] placeholder-[#6E6E73] focus:border-[#2997FF] focus:outline-hidden transition-colors"
                  />
                </div>

                <div className="flex items-center gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="acc-check"
                    checked={regForm.accessibility}
                    onChange={(e) => setRegForm({ ...regForm, accessibility: e.target.checked })}
                    className="w-4 h-4 rounded-sm bg-[#161616] border-[#262626] text-[#2997FF] focus:ring-0 focus:ring-offset-0"
                  />
                  <label htmlFor="acc-check" className="text-xs font-medium text-[#A1A1A6]">
                    Wheelchair Ramp & Handicap Accessible
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-5 border-t border-[#262626]">
                  <button
                    type="button"
                    onClick={() => setShowRegModal(false)}
                    className="px-5 py-2.5 text-xs font-semibold text-[#86868B] hover:text-[#F5F5F7] hover:bg-[#1A1A1A] rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="apple-button-primary px-6 py-2.5 text-xs font-semibold"
                  >
                    Submit for Approval
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Report Cleaning Modal */}
        {activeTaskForReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl">
            <div className="w-full max-w-lg bg-[#0D0D0D] border border-[#262626] rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl">
              <div>
                <h3 className="font-semibold text-lg text-[#F5F5F7]">Report Cleaning Remediation</h3>
                <p className="text-xs text-[#86868B] mt-0.5">Facility: {activeTaskForReport.toilet_name}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1A1A6] mb-1.5">Cleaning Action Notes *</label>
                <textarea
                  required
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Detail work performed (e.g., floors disinfected, washbasin scrubbed, soap and sanitizers replenished)..."
                  rows={3}
                  className="w-full text-xs p-3 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] placeholder-[#6E6E73] focus:border-[#2997FF] focus:outline-hidden transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1A1A6] mb-1.5">
                  After-Cleaning Photograph (Optional AI Preview Assessment)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoSelect}
                  className="w-full text-xs text-[#86868B] file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border file:border-[#262626] file:text-xs file:font-semibold file:bg-[#161616] file:text-[#2997FF] hover:file:bg-[#202020] cursor-pointer"
                />
              </div>

              {isAnalyzingPhoto && (
                <div className="p-3 rounded-xl bg-[#2997FF]/10 border border-[#2997FF]/20 text-xs text-[#2997FF] flex items-center gap-2">
                  <Loader2 size={15} className="animate-spin" />
                  <span>Analyzing after-cleaning photograph with YOLO model...</span>
                </div>
              )}

              {afterPhotoAiResult && (
                <div className="p-4 bg-[#111111] rounded-2xl border border-[#262626] text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-[#F5F5F7] flex items-center gap-1.5">
                      <Sparkles size={14} className="text-[#2997FF]" />
                      Model Assessment
                    </p>
                    <span className="font-mono text-[10px] text-[#30D158] bg-[#30D158]/10 px-2 py-0.5 rounded-full border border-[#30D158]/20">
                      {afterPhotoAiResult.ai_recommendation}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#86868B]">{afterPhotoAiResult.message}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTaskForReport(null);
                    setAfterPhoto(null);
                    setAfterPhotoAiResult(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-[#86868B] hover:text-[#F5F5F7] hover:bg-[#1A1A1A] rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReportCompletionSubmit}
                  disabled={isSubmittingReport}
                  className="apple-button-primary px-5 py-2.5 text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingReport ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Cleaning Report</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
