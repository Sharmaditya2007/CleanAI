import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Upload,
  Loader2,
  FileText,
  Search,
  Clock,
  MapPin,
  X,
  Camera,
  Copy,
  Check,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { api, getMediaUrl } from '../services/api';
import { Toilet, Complaint } from '../types';

export const ReportIssuePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedToiletId = searchParams.get('toiletId') || '';

  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [loadingToilets, setLoadingToilets] = useState(true);

  // Form state
  const [selectedToiletId, setSelectedToiletId] = useState(preselectedToiletId);
  const [issueType, setIssueType] = useState('dirty_toilet');
  const [description, setDescription] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedComplaint, setSubmittedComplaint] = useState<Complaint | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // Status tracking state
  const [trackRef, setTrackRef] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [trackedComplaint, setTrackedComplaint] = useState<Complaint | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  useEffect(() => {
    loadToilets();
  }, []);

  const loadToilets = async () => {
    setLoadingToilets(true);
    try {
      const data = await api.getToilets();
      setToilets(data);
      if (!selectedToiletId && data.length > 0) {
        setSelectedToiletId(data[0].id);
      }
    } catch (e) {
      console.error('Failed to load toilets for report form:', e);
    } finally {
      setLoadingToilets(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedToiletId) {
      setFormError('Please select a public toilet facility.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const response = await api.submitComplaint({
        toilet_id: selectedToiletId,
        category: issueType,
        description: description.trim() || 'Civic hygiene issue reported by public citizen.',
        reporter_email: reporterEmail.trim() || undefined,
        photo: photo || undefined
      });

      setSubmittedComplaint(response);
      setTrackRef(response.reference_number);
      // Reset form
      setDescription('');
      handleRemovePhoto();
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit issue report. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = trackRef.trim();
    if (!query) {
      setTrackError('Please enter a complaint reference number.');
      return;
    }

    setIsTracking(true);
    setTrackError(null);
    setTrackedComplaint(null);

    try {
      const res = await api.trackComplaint(query);
      setTrackedComplaint(res);
    } catch (err: any) {
      setTrackError(err.message || 'No complaint found matching this reference number.');
    } finally {
      setIsTracking(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={13} />
            Resolved
          </span>
        );
      case 'In Progress':
      case 'Under Investigation':
      case 'Action Taken':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock size={13} />
            In Progress
          </span>
        );
      case 'Open':
      case 'Received':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <AlertCircle size={13} />
            Open
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-[#F5F5F7]">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#161616] border border-[#262626] text-xs font-medium text-[#A1A1A6]">
          <AlertCircle size={14} className="text-amber-400" />
          <span>Public Citizen Reporting</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F5F7]">
          Report a Sanitation Issue
        </h1>
        <p className="text-sm text-[#A1A1A6] max-w-xl mx-auto">
          Help maintain public hygiene standards. Submit complaints directly to municipal authorities without logging in.
        </p>
      </div>

      {/* Confirmation Success Banner (if just submitted) */}
      {submittedComplaint && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400">
              <CheckCircle2 size={24} />
            </div>
            <div className="space-y-1 flex-1">
              <h3 className="text-base font-semibold text-[#F5F5F7]">
                Complaint Submitted Successfully!
              </h3>
              <p className="text-xs text-[#A1A1A6] leading-relaxed">
                Your sanitation report for <strong className="text-[#F5F5F7]">{submittedComplaint.toilet_name}</strong> has been logged in the official municipal database and dispatched to on-duty health inspectors.
              </p>
            </div>
          </div>

          {/* Reference Number Card */}
          <div className="bg-[#050505] border border-emerald-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#A1A1A6]">
                Complaint Reference Number
              </span>
              <div className="text-xl font-mono font-bold text-emerald-400 tracking-wide mt-0.5">
                {submittedComplaint.reference_number}
              </div>
            </div>

            <button
              onClick={() => copyToClipboard(submittedComplaint.reference_number)}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#1C1C1E] hover:bg-[#2C2C2E] text-[#F5F5F7] border border-[#333333] transition-colors flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              {copiedRef ? (
                <>
                  <Check size={14} className="text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy Reference</span>
                </>
              )}
            </button>
          </div>
          
          <p className="text-[11px] text-[#A1A1A6]">
            Keep this reference number to check live inspection progress in the tracking tool below.
          </p>
        </div>
      )}

      {/* Main Complaint Submission Form Card */}
      <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="border-b border-[#1F1F1F] pb-4">
          <h2 className="text-lg font-semibold text-[#F5F5F7]">
            Submit Issue Report
          </h2>
          <p className="text-xs text-[#6E6E73] mt-0.5">
            No registration or account required.
          </p>
        </div>

        {formError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Toilet Selection Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#A1A1A6]">
              Select Public Toilet <span className="text-rose-400">*</span>
            </label>
            {loadingToilets ? (
              <div className="h-10 bg-[#161616] rounded-xl animate-pulse" />
            ) : toilets.length === 0 ? (
              <div className="p-3 bg-[#161616] border border-[#262626] rounded-xl text-xs text-[#A1A1A6]">
                No public restrooms are currently registered in the database. Municipal authorities can register verified facilities in the Authority Dashboard.
              </div>
            ) : (
              <select
                value={selectedToiletId}
                onChange={(e) => setSelectedToiletId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-[#161616] border border-[#262626] rounded-xl text-sm text-[#F5F5F7] focus:border-[#F5F5F7]/40 focus:outline-hidden"
              >
                {toilets.map((t) => (
                  <option key={t.id} value={t.id} className="bg-[#121212] text-[#F5F5F7]">
                    {t.name} — {t.locality}, {t.city}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Issue Category */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#A1A1A6]">
              Issue Type <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'dirty_toilet', label: 'Dirty Toilet / Bowl' },
                { id: 'water_unavailable', label: 'Water Unavailable' },
                { id: 'damaged_facilities', label: 'Damaged Facilities' },
                { id: 'dirty_floor', label: 'Dirty Floor / Stains' },
                { id: 'odor', label: 'Foul Odor' },
                { id: 'other', label: 'Other Issue' }
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setIssueType(item.id)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-medium border text-left transition-all cursor-pointer ${
                    issueType === item.id
                      ? 'bg-[#F5F5F7] text-[#050505] border-[#F5F5F7] font-semibold shadow-sm'
                      : 'bg-[#161616] text-[#A1A1A6] border-[#262626] hover:bg-[#1E1E1E] hover:text-[#F5F5F7]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#A1A1A6]">
              Description <span className="text-[#6E6E73] font-normal">(Optional)</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue (e.g. running tap leaking, cubicle door latch broken, uncleaned floor)..."
              className="w-full px-3.5 py-2.5 bg-[#161616] border border-[#262626] rounded-xl text-sm text-[#F5F5F7] placeholder-[#6E6E73] focus:border-[#F5F5F7]/40 focus:outline-hidden"
            />
          </div>

          {/* Optional Image Upload */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#A1A1A6]">
              Attach Image <span className="text-[#6E6E73] font-normal">(Optional)</span>
            </label>
            
            {photoPreview ? (
              <div className="relative inline-block border border-[#333333] rounded-xl overflow-hidden bg-[#161616]">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-48 h-36 object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/70 hover:bg-black text-[#F5F5F7] transition-colors cursor-pointer"
                  title="Remove photo"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#262626] hover:border-[#3D3D3D] rounded-xl bg-[#141414] hover:bg-[#181818] cursor-pointer transition-colors">
                <Camera size={24} className="text-[#6E6E73] mb-2" />
                <span className="text-xs text-[#A1A1A6] font-medium">Click to upload photo of issue</span>
                <span className="text-[11px] text-[#6E6E73] mt-1">PNG, JPG, WEBP up to 10MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Optional Email for Notifications */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#A1A1A6]">
              Your Email Address <span className="text-[#6E6E73] font-normal">(Optional, for resolution updates)</span>
            </label>
            <input
              type="email"
              value={reporterEmail}
              onChange={(e) => setReporterEmail(e.target.value)}
              placeholder="e.g. name@example.com"
              className="w-full px-3.5 py-2.5 bg-[#161616] border border-[#262626] rounded-xl text-sm text-[#F5F5F7] placeholder-[#6E6E73] focus:border-[#F5F5F7]/40 focus:outline-hidden"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || toilets.length === 0}
            className="w-full py-3 rounded-xl text-sm font-semibold text-[#050505] bg-[#F5F5F7] hover:bg-white transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin text-[#050505]" />
                <span>Submitting Report to Municipality...</span>
              </>
            ) : (
              <span>Submit Issue Report</span>
            )}
          </button>

        </form>
      </div>

      {/* ======================================================== */}
      {/* 2. LIVE COMPLAINT TRACKING TOOL                          */}
      {/* ======================================================== */}
      <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="border-b border-[#1F1F1F] pb-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#A1A1A6] mb-1">
            <Clock size={14} className="text-[#2997FF]" />
            <span>Check Resolution Status</span>
          </div>
          <h2 className="text-lg font-semibold text-[#F5F5F7]">
            Track a Reported Issue
          </h2>
          <p className="text-xs text-[#6E6E73] mt-0.5">
            Enter your reference number to view real-time municipal inspection and resolution progress.
          </p>
        </div>

        {/* Search Bar for Reference Number */}
        <form onSubmit={handleTrackSubmit} className="flex gap-2.5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" />
            <input
              type="text"
              placeholder="e.g. CMP-2026-1049"
              value={trackRef}
              onChange={(e) => setTrackRef(e.target.value.toUpperCase())}
              className="w-full pl-10 pr-4 py-2.5 bg-[#161616] border border-[#262626] rounded-xl text-sm font-mono text-[#F5F5F7] placeholder-[#6E6E73] focus:border-[#F5F5F7]/40 focus:outline-hidden"
            />
          </div>
          <button
            type="submit"
            disabled={isTracking}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#262626] hover:bg-[#333333] text-[#F5F5F7] border border-[#3D3D3D] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {isTracking ? (
              <Loader2 size={14} className="animate-spin text-[#F5F5F7]" />
            ) : (
              <span>Track Status</span>
            )}
          </button>
        </form>

        {trackError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={14} />
            <span>{trackError}</span>
          </div>
        )}

        {/* Tracked Result Card */}
        {trackedComplaint && (
          <div className="bg-[#121212] border border-[#262626] rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1F1F1F] pb-3">
              <div>
                <span className="text-[11px] text-[#6E6E73] font-mono">Reference</span>
                <div className="text-base font-mono font-bold text-[#F5F5F7]">
                  {trackedComplaint.reference_number}
                </div>
              </div>
              <div>
                {getStatusBadge(trackedComplaint.status)}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#6E6E73]">Facility:</span>
                <p className="font-semibold text-[#F5F5F7] mt-0.5">
                  {trackedComplaint.toilet_name}
                </p>
              </div>

              <div>
                <span className="text-[#6E6E73]">Reported Category:</span>
                <p className="font-semibold text-[#F5F5F7] mt-0.5 capitalize">
                  {trackedComplaint.category.replace('_', ' ')}
                </p>
              </div>

              <div>
                <span className="text-[#6E6E73]">Submitted On:</span>
                <p className="text-[#A1A1A6] mt-0.5">
                  {new Date(trackedComplaint.created_at).toLocaleString()}
                </p>
              </div>

              <div>
                <span className="text-[#6E6E73]">Last Updated:</span>
                <p className="text-[#A1A1A6] mt-0.5">
                  {new Date(trackedComplaint.updated_at).toLocaleString()}
                </p>
              </div>
            </div>

            {trackedComplaint.description && (
              <div className="pt-2 text-xs">
                <span className="text-[#6E6E73]">Report Details:</span>
                <p className="text-[#D1D1D6] mt-1 p-3 bg-[#161616] rounded-lg border border-[#262626]">
                  {trackedComplaint.description}
                </p>
              </div>
            )}

            {trackedComplaint.resolution_notes && (
              <div className="pt-2 text-xs">
                <span className="text-emerald-400 font-semibold">Municipal Resolution Notes:</span>
                <p className="text-[#F5F5F7] mt-1 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  {trackedComplaint.resolution_notes}
                </p>
              </div>
            )}

            {trackedComplaint.photo_url && (
              <div className="pt-2 text-xs">
                <span className="text-[#6E6E73]">Attached Photo:</span>
                <div className="mt-1.5 w-32 h-24 rounded-lg overflow-hidden border border-[#262626]">
                  <img
                    src={getMediaUrl(trackedComplaint.photo_url)}
                    alt="Complaint photo"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
};
