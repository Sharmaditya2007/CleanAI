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
  Info
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-sky-100 text-sky-800 rounded-xl">
              <Building2 size={24} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Facility Owner & Contractor Portal
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Register toilet facilities, track municipal sanitation tasks, and report verified cleaning workflows.
          </p>
        </div>

        <button
          onClick={() => setShowRegModal(true)}
          className="self-start sm:self-auto px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs card-shadow flex items-center gap-2 shadow-xs transition-colors"
        >
          <PlusCircle size={16} />
          <span>Register New Toilet Facility</span>
        </button>
      </div>

      {/* Critical Verification Policy Notice */}
      <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl flex items-start gap-3 text-sky-900 text-xs">
        <Info size={18} className="text-sky-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-sky-950">Municipal Verification Integrity Policy</p>
          <p className="text-sky-800 leading-relaxed">
            When you report cleaning completion, the toilet's verified status changes to 
            <span className="font-bold bg-white px-1.5 py-0.5 rounded-sm mx-1 border border-sky-200">Verification Pending</span> 
            instead of immediately being labeled Clean. An authorized municipal officer must review your report and visual evidence before public Clean certification is confirmed.
          </p>
        </div>
      </div>

      {/* Active Cleaning Tasks Section */}
      <div className="bg-white rounded-3xl border border-slate-200 card-shadow overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Clock size={18} className="text-amber-600" />
              <span>Assigned Cleaning Orders ({tasks.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Tasks dispatched by municipal officers that require immediate action.</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {tasks.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-xs">No active cleaning tasks assigned.</p>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                      {task.priority} Priority
                    </span>
                    <span className="text-xs text-slate-400">
                      Dispatched {new Date(task.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{task.toilet_name}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{task.notes}</p>
                  
                  {task.completion_notes && (
                    <div className="text-xs text-emerald-800 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200 mt-2 font-medium">
                      Reported: "{task.completion_notes}"
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {task.status === 'Pending' && (
                    <button
                      onClick={() => handleMarkInProgress(task.id)}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      Mark In Progress
                    </button>
                  )}

                  {task.status === 'In Progress' && (
                    <button
                      onClick={() => setActiveTaskForReport(task)}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Camera size={14} />
                      <span>Report Cleaning Complete</span>
                    </button>
                  )}

                  <span
                    className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                      task.status === 'Verified'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : task.status === 'Cleaning Reported'
                        ? 'bg-sky-50 text-sky-800 border-sky-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
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

      {/* Owner's Registered Toilets Table */}
      <div className="bg-white rounded-3xl border border-slate-200 card-shadow overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h3 className="font-bold text-base text-slate-900">Your Managed Toilet Facilities ({toilets.length})</h3>
          <p className="text-xs text-slate-500 mt-0.5">Registration status and current municipal cleanliness certifications.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3.5 px-4">Facility Name & Address</th>
                <th className="py-3.5 px-4">Registration Status</th>
                <th className="py-3.5 px-4">Verified Public Status</th>
                <th className="py-3.5 px-4">Operating Hours</th>
                <th className="py-3.5 px-4">Last Inspected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {toilets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400 font-medium">
                    No toilet facilities registered under your account yet. Click "Register New Toilet Facility" above.
                  </td>
                </tr>
              ) : (
                toilets.map((toilet) => (
                  <tr key={toilet.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 text-sm">{toilet.name}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">{toilet.address}, {toilet.locality}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          toilet.registration_status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-800'
                            : toilet.registration_status === 'Pending Approval'
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-red-50 text-red-800'
                        }`}
                      >
                        {toilet.registration_status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={toilet.verified_status} isStale={toilet.is_stale} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {toilet.opening_hours || '24x7'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 space-y-6 card-shadow my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Register Public Toilet Facility</h3>
                <p className="text-xs text-slate-500 mt-0.5">Submit facility data to municipal authorities for formal inspection and approval.</p>
              </div>
              <button onClick={() => setShowRegModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Facility Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Metro Gate 3 Public Convenience"
                    value={regForm.name}
                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Locality / Area *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Connaught Place, Karol Bagh"
                    value={regForm.locality}
                    onChange={(e) => setRegForm({ ...regForm, locality: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Street Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Near Metro Station Exit, Outer Ring Road"
                    value={regForm.address}
                    onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GPS Latitude *</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={regForm.latitude}
                    onChange={(e) => setRegForm({ ...regForm, latitude: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GPS Longitude *</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={regForm.longitude}
                    onChange={(e) => setRegForm({ ...regForm, longitude: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Access Type</label>
                  <select
                    value={regForm.access_type}
                    onChange={(e) => setRegForm({ ...regForm, access_type: e.target.value as any })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="public">Free Public Facility</option>
                    <option value="paid">Pay & Use Facility</option>
                    <option value="private">Commercial Private Restroom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Opening Hours</label>
                  <input
                    type="text"
                    value={regForm.opening_hours}
                    onChange={(e) => setRegForm({ ...regForm, opening_hours: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Details</label>
                <textarea
                  value={regForm.description}
                  onChange={(e) => setRegForm({ ...regForm, description: e.target.value })}
                  placeholder="Describe facility fixtures, cleanliness schedule, ventilation..."
                  rows={2}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="acc-check"
                  checked={regForm.accessibility}
                  onChange={(e) => setRegForm({ ...regForm, accessibility: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="acc-check" className="text-xs font-semibold text-slate-700">
                  Wheelchair Ramp & Handicap Accessible
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 space-y-4 card-shadow">
            <h3 className="font-bold text-base text-slate-900">Report Cleaning Completion</h3>
            <p className="text-xs text-slate-500">Facility: {activeTaskForReport.toilet_name}</p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cleaning Action Notes *</label>
              <textarea
                required
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Detail what cleaning was done (e.g. floors mopped with disinfectant, basin scrubbed, soap refilled)..."
                rows={3}
                className="w-full text-xs p-3 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Optional After-Cleaning Photograph (AI Preview Verification)
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoSelect}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              />
            </div>

            {isAnalyzingPhoto && (
              <p className="text-xs text-emerald-700 flex items-center gap-1.5 font-medium">
                <Loader2 size={14} className="animate-spin" />
                Analyzing after-cleaning photograph with model...
              </p>
            )}

            {afterPhotoAiResult && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-600" />
                  AI Preview Assessment: {afterPhotoAiResult.ai_recommendation}
                </p>
                <p className="text-[11px] text-emerald-800">{afterPhotoAiResult.message}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setActiveTaskForReport(null);
                  setAfterPhoto(null);
                  setAfterPhotoAiResult(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReportCompletionSubmit}
                disabled={isSubmittingReport}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs"
              >
                {isSubmittingReport ? <Loader2 size={16} className="animate-spin" /> : 'Submit Cleaning Report'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
