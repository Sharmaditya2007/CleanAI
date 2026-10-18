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
  Sparkles,
  ChevronRight
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
        setOfficerDecision('Clean');
        setIsOverride(true);
        setOverrideReason('AI inconclusive. Manual visual inspection verified by municipal officer.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0D0D0D] rounded-3xl border border-[#262626] shadow-2xl overflow-hidden my-8 text-[#F5F5F7]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#111111] border-b border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1A1A1A] border border-[#333333] rounded-xl text-[#2997FF]">
              <Cpu size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#F5F5F7] tracking-tight">AI Inspection & Verification</h3>
              <p className="text-xs text-[#A1A1A6]">{toilet.name} • {toilet.locality}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-[#1A1A1A] rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[78vh] overflow-y-auto space-y-6">
          {error && (
            <div className="p-4 bg-[#FF453A]/10 border border-[#FF453A]/25 rounded-2xl flex items-start gap-3 text-[#FF453A] text-xs">
              <ShieldAlert className="shrink-0 mt-0.5" size={16} />
              <div>
                <p className="font-semibold">Inspection Alert</p>
                <p className="text-[#F5F5F7] mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Step 1 & 2: Upload and Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1A6]">
                1. Upload Inspection Photograph
              </label>
              
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  previewUrl
                    ? 'border-[#2997FF]/50 bg-[#161616]'
                    : 'border-[#262626] hover:border-[#2997FF]/50 bg-[#111111] hover:bg-[#161616]'
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
                  <div className="p-3 bg-[#1A1A1A] border border-[#262626] rounded-full text-[#2997FF]">
                    <Upload size={20} />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#F5F5F7]">Select toilet photo</span>
                    <p className="text-[11px] text-[#6E6E73] mt-0.5">JPEG, PNG, WEBP (Floors, basins, urinals, WCs)</p>
                  </div>
                  {file && (
                    <span className="text-[11px] font-mono text-[#2997FF] bg-[#2997FF]/10 px-2.5 py-1 rounded-full border border-[#2997FF]/20 mt-1">
                      {file.name} ({(file.size / 1024).toFixed(0)} KB)
                    </span>
                  )}
                </div>
              </div>

              {previewUrl && (
                <button
                  onClick={runModelInference}
                  disabled={isInspecting}
                  className="w-full py-2.5 px-4 apple-button-primary rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isInspecting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Executing YOLOv11 Inference...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      <span>Run AI Model Inference</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Preview or Annotated Output */}
            <div className="flex flex-col space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1A6]">
                2. Real-Time Detection View
              </label>
              <div className="relative flex-1 min-h-[220px] bg-[#111111] rounded-2xl border border-[#262626] overflow-hidden flex items-center justify-center">
                {previewUrl ? (
                  <div className="relative w-full h-full max-h-[280px] flex items-center justify-center bg-black/40 p-2">
                    <img
                      src={aiResult?.annotated_image_url ? getMediaUrl(aiResult.annotated_image_url) : previewUrl}
                      alt="Sanitation preview"
                      className="max-h-[260px] w-auto object-contain rounded-xl"
                    />
                    {aiResult?.annotated_image_url && (
                      <span className="absolute bottom-3 right-3 bg-black/80 border border-[#262626] text-[#2997FF] text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full backdrop-blur-md">
                        YOLO Annotated Overlay
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-center p-6 text-[#6E6E73]">
                    <HelpCircle size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Upload an image to see detection overlay</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 3: AI Model Prediction Report */}
          {aiResult && (
            <div className="p-5 bg-[#111111] rounded-2xl border border-[#262626] space-y-4">
              <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#30D158] animate-pulse" />
                  <h4 className="text-xs font-semibold text-[#F5F5F7] font-mono">
                    Model: {aiResult.model_identifier}
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-[#A1A1A6] bg-[#161616] px-2 py-0.5 rounded-full border border-[#262626]">
                  {aiResult.framework}
                </span>
              </div>

              {/* Recommendation Banner */}
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                  aiResult.ai_recommendation === 'Clean'
                    ? 'bg-[#30D158]/10 border-[#30D158]/25 text-[#30D158]'
                    : aiResult.ai_recommendation === 'Needs Cleaning'
                    ? 'bg-[#FF9F0A]/10 border-[#FF9F0A]/25 text-[#FF9F0A]'
                    : aiResult.ai_recommendation === 'Under Maintenance'
                    ? 'bg-[#FF453A]/10 border-[#FF453A]/25 text-[#FF453A]'
                    : 'bg-[#8E8E93]/10 border-[#8E8E93]/25 text-[#F5F5F7]'
                }`}
              >
                {aiResult.ai_recommendation === 'Clean' && <CheckCircle className="shrink-0 mt-0.5" size={18} />}
                {aiResult.ai_recommendation === 'Needs Cleaning' && <AlertTriangle className="shrink-0 mt-0.5" size={18} />}
                {aiResult.ai_recommendation === 'Under Maintenance' && <Wrench className="shrink-0 mt-0.5" size={18} />}
                {aiResult.ai_recommendation === 'Inconclusive - Officer Inspection Required' && <HelpCircle className="shrink-0 mt-0.5" size={18} />}
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] uppercase font-semibold tracking-wider">AI Recommendation:</span>
                    <span className="font-bold text-xs">{aiResult.ai_recommendation}</span>
                  </div>
                  <p className="text-xs text-[#A1A1A6] mt-0.5 leading-relaxed">{aiResult.message}</p>
                </div>
              </div>

              {/* Detected Objects */}
              <div>
                <p className="text-[11px] font-semibold text-[#A1A1A6] uppercase tracking-wider mb-2">
                  Detected Objects ({aiResult.total_detections} Total)
                </p>
                {aiResult.detections.length === 0 ? (
                  <p className="text-xs text-[#6E6E73] italic bg-[#161616] p-3 rounded-xl border border-[#262626]">
                    No sanitation objects detected above the 25% confidence threshold.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {aiResult.detections.map((d, idx) => (
                      <div
                        key={idx}
                        className={`px-3 py-1.5 rounded-full border text-xs flex items-center gap-2 ${
                          d.is_dirty_indicator
                            ? 'bg-[#FF453A]/10 border-[#FF453A]/25 text-[#FF453A]'
                            : 'bg-[#30D158]/10 border-[#30D158]/25 text-[#30D158]'
                        }`}
                      >
                        <span className="font-medium">{d.class_name.replace(/_/g, ' ')}</span>
                        <span className="font-mono text-[10px] opacity-80">{(d.confidence * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Officer Confirmation & Override */}
          {aiResult && (
            <div className="p-5 bg-[#111111] rounded-2xl border border-[#262626] space-y-4">
              <div className="flex items-center gap-2 text-[#F5F5F7]">
                <FileText size={16} className="text-[#2997FF]" />
                <h4 className="text-xs font-semibold uppercase tracking-wider">
                  3. Municipal Verification Decision
                </h4>
              </div>

              <div>
                <label className="block text-xs text-[#A1A1A6] mb-2 font-medium">
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
                      className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                        officerDecision === status
                          ? status === 'Clean'
                            ? 'bg-[#30D158]/20 text-[#30D158] border-[#30D158]/40 shadow-xs'
                            : status === 'Needs Cleaning'
                            ? 'bg-[#FF9F0A]/20 text-[#FF9F0A] border-[#FF9F0A]/40 shadow-xs'
                            : 'bg-[#8E8E93]/20 text-[#8E8E93] border-[#8E8E93]/40 shadow-xs'
                          : 'bg-[#161616] text-[#A1A1A6] border-[#262626] hover:border-[#333333]'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Override Checkbox & Reason */}
              <div className="pt-3 border-t border-[#1F1F1F] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#A1A1A6]">
                  <input
                    type="checkbox"
                    checked={isOverride}
                    onChange={(e) => setIsOverride(e.target.checked)}
                    className="w-4 h-4 rounded bg-[#161616] border-[#262626] text-[#2997FF] focus:ring-0"
                  />
                  <span>Manual Override of AI Recommendation</span>
                </label>

                {isOverride && (
                  <div>
                    <label className="block text-[11px] font-semibold text-[#A1A1A6] mb-1">
                      Override Reason (Required for audit log):
                    </label>
                    <textarea
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="Explain why the AI recommendation is being overridden..."
                      className="w-full text-xs p-3 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] focus:border-[#2997FF] focus:outline-hidden"
                      rows={2}
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-[#A1A1A6] hover:text-[#F5F5F7] rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmInspection}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 apple-button-primary rounded-full text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving Verification...</span>
                    </>
                  ) : (
                    <span>Confirm & Publish Public Verification</span>
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

