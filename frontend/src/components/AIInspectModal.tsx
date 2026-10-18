import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Cpu,
  CheckCircle,
  AlertTriangle,
  Wrench,
  HelpCircle,
  FileText,
  ShieldAlert,
  Loader2,
  Sparkles
} from 'lucide-react';
import { Toilet, AIInferenceResult } from '../types';
import { api, getMediaUrl } from '../services/api';

interface AIInspectModalProps {
  toilet: Toilet;
  onClose: () => void;
  onInspectionConfirmed: (updatedToilet: Toilet) => void;
}

export const AIInspectModal: React.FC<AIInspectModalProps> = ({
  toilet,
  onClose,
  onInspectionConfirmed
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [aiResult, setAiResult] = useState<AIInferenceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Confirmation state
  const [officerDecision, setOfficerDecision] = useState<'Clean' | 'Needs Cleaning' | 'Under Maintenance'>('Clean');
  const [isOverride, setIsOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setAiResult(null);
      setError(null);
    }
  };

  const runModelInference = async () => {
    if (!file) return;
    setIsInspecting(true);
    setError(null);
    try {
      const result = await api.inspectImage(file, toilet.id);
      setAiResult(result);
      // Pre-select decision based on AI recommendation if valid
      if (result.ai_recommendation === 'Clean') {
        setOfficerDecision('Clean');
        setIsOverride(false);
      } else if (result.ai_recommendation === 'Needs Cleaning') {
        setOfficerDecision('Needs Cleaning');
        setIsOverride(false);
      } else if (result.ai_recommendation === 'Under Maintenance') {
        setOfficerDecision('Under Maintenance');
        setIsOverride(false);
      } else {
        // Inconclusive - default to current or officer judgment
        setOfficerDecision('Clean');
        setIsOverride(true);
        setOverrideReason('AI inconclusive. Manual visual verification conducted by officer.');
      }
    } catch (err: any) {
      setError(err.message || 'AI inference failed.');
    } finally {
      setIsInspecting(false);
    }
  };

  const handleConfirmInspection = async () => {
    if (!aiResult) return;
    if (isOverride && !overrideReason.trim()) {
      setError('An override reason is mandatory when altering the AI recommendation.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await api.confirmInspection({
        toilet_id: toilet.id,
        image_filename: (aiResult as any).saved_filename,
        ai_raw_output: aiResult,
        ai_recommendation: aiResult.ai_recommendation,
        officer_decision: officerDecision,
        is_override: isOverride,
        override_reason: isOverride ? overrideReason : undefined
      });

      // Fetch updated toilet
      const updated = await api.getToilet(toilet.id);
      onInspectionConfirmed(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to confirm inspection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl card-shadow overflow-hidden border border-slate-200 my-8">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 rounded-xl border border-emerald-400/30">
              <Cpu className="text-emerald-300" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Municipal AI Inspection Workflow</h3>
              <p className="text-xs text-emerald-200">{toilet.name} ({toilet.locality})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800 text-sm">
              <ShieldAlert className="text-red-600 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-semibold">Inspection Alert</p>
                <p className="text-xs text-red-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Step 1: Upload Photograph */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-800">
                1. Upload Sanitation Photograph
              </label>
              
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  previewUrl
                    ? 'border-emerald-400 bg-emerald-50/20'
                    : 'border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/10'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-white rounded-full shadow-xs border border-slate-200 text-emerald-600">
                    <Upload size={22} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-emerald-700">Click to upload photo</span>
                    <p className="text-xs text-slate-500 mt-1">Accepts real floor, basin, or WC photos (JPEG, PNG, WEBP)</p>
                  </div>
                  {file && (
                    <span className="text-xs font-medium text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200 mt-1">
                      {file.name} ({(file.size / 1024).toFixed(0)} KB)
                    </span>
                  )}
                </div>
              </div>

              {previewUrl && (
                <button
                  onClick={runModelInference}
                  disabled={isInspecting}
                  className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                >
                  {isInspecting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Running Real YOLO Model Inference...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Run AI Sanitation Analysis
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Preview or Annotated Output */}
            <div className="flex flex-col space-y-3">
              <label className="block text-sm font-semibold text-slate-800">
                2. Real-Time Detection Preview
              </label>
              <div className="relative flex-1 min-h-[220px] bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center">
                {previewUrl ? (
                  <div className="relative w-full h-full max-h-[300px] flex items-center justify-center bg-black/5">
                    <img
                      src={aiResult?.annotated_image_url ? getMediaUrl(aiResult.annotated_image_url) : previewUrl}
                      alt="Sanitation inspection preview"
                      className="max-h-[300px] w-auto object-contain rounded-lg shadow-xs"
                    />
                    {aiResult?.annotated_image_url && (
                      <span className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-xs">
                        Annotated YOLO View
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-center p-6 text-slate-400">
                    <HelpCircle size={36} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Upload a toilet photo to see the live model detection preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 3: AI Model Prediction Report */}
          {aiResult && (
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h4 className="text-sm font-bold text-slate-900">
                    Model Output: {aiResult.model_identifier}
                  </h4>
                </div>
                <span className="text-xs bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full font-medium">
                  {aiResult.framework}
                </span>
              </div>

              {/* Recommendation Banner */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  aiResult.ai_recommendation === 'Clean'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : aiResult.ai_recommendation === 'Needs Cleaning'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : aiResult.ai_recommendation === 'Under Maintenance'
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : 'bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                {aiResult.ai_recommendation === 'Clean' && <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={20} />}
                {aiResult.ai_recommendation === 'Needs Cleaning' && <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />}
                {aiResult.ai_recommendation === 'Under Maintenance' && <Wrench className="text-red-600 shrink-0 mt-0.5" size={20} />}
                {aiResult.ai_recommendation === 'Inconclusive - Officer Inspection Required' && <HelpCircle className="text-slate-600 shrink-0 mt-0.5" size={20} />}
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-extrabold tracking-wider">AI Recommendation:</span>
                    <span className="font-bold text-sm">{aiResult.ai_recommendation}</span>
                  </div>
                  <p className="text-xs mt-1 leading-relaxed">{aiResult.message}</p>
                </div>
              </div>

              {/* Detected Objects Grid */}
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Detected Objects ({aiResult.total_detections} Total)
                </p>
                {aiResult.detections.length === 0 ? (
                  <p className="text-xs text-slate-500 italic bg-white p-3 rounded-lg border border-slate-200">
                    No sanitation objects detected above the 25% confidence threshold.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {aiResult.detections.map((d, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                          d.is_dirty_indicator
                            ? 'bg-red-50/50 border-red-200 text-red-800'
                            : 'bg-emerald-50/50 border-emerald-200 text-emerald-800'
                        }`}
                      >
                        <span className="font-semibold">{d.class_name.replace(/_/g, ' ')}</span>
                        <span className="font-mono text-[11px] font-bold">{(d.confidence * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Officer Confirmation & Override */}
          {aiResult && (
            <div className="p-5 bg-white rounded-2xl border-2 border-emerald-500/30 card-shadow space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="text-emerald-700" size={18} />
                <h4 className="text-sm font-bold text-slate-900">
                  3. Municipal Verification & Decision
                </h4>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm Official Public Cleanliness Status:
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['Clean', 'Needs Cleaning', 'Under Maintenance'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        setOfficerDecision(status);
                        if (status !== aiResult.ai_recommendation) {
                          setIsOverride(true);
                        } else {
                          setIsOverride(false);
                        }
                      }}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                        officerDecision === status
                          ? status === 'Clean'
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                            : status === 'Needs Cleaning'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-slate-800 text-white border-slate-800 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Override Checkbox & Reason */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={isOverride}
                    onChange={(e) => setIsOverride(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span>Manual Override of AI Recommendation</span>
                </label>

                {isOverride && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Override Reason (Mandatory for audit trail):
                    </label>
                    <textarea
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="Explain why the AI recommendation is being overridden (e.g. wet floor not captured by angle, mechanical flush broken, etc.)..."
                      className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      rows={2}
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmInspection}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving Verified Status...
                    </>
                  ) : (
                    'Confirm & Publish Public Verification'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
