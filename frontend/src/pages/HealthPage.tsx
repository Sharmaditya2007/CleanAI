import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  Database,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  FileCode,
  ShieldCheck,
  Loader2,
  RefreshCw,
  Terminal
} from 'lucide-react';
import { api } from '../services/api';
import { HealthInfo, AIInferenceResult } from '../types';

export const HealthPage: React.FC = () => {
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [sampleResult, setSampleResult] = useState<AIInferenceResult | null>(null);
  const [testingSample, setTestingSample] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  useEffect(() => {
    loadHealth();
  }, []);

  const loadHealth = async () => {
    setLoading(true);
    try {
      const data = await api.getHealth();
      setHealth(data);
    } catch (e) {
      console.error('Failed to load health info:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleTestInference = async () => {
    setTestingSample(true);
    setTestError(null);
    try {
      const result = await api.runSampleTest();
      setSampleResult(result);
    } catch (err: any) {
      setTestError(err.message || 'Sample inference failed.');
    } finally {
      setTestingSample(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F7] py-10 selection:bg-[#2997FF]/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-[#262626]/80 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111111] border border-[#262626] text-[#30D158] text-[11px] font-semibold tracking-wider uppercase mb-3">
              <Activity size={13} />
              <span>Real-time Telemetry</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#F5F5F7]">
              System & Model Diagnostics
            </h1>
            <p className="text-sm text-[#86868B] mt-1.5 max-w-2xl leading-relaxed">
              Verify YOLOv11 neural network weights, PyTorch inference pipeline integrity, and database telemetry.
            </p>
          </div>

          <button
            onClick={loadHealth}
            className="apple-button-secondary flex items-center gap-2 py-2.5 px-4 self-start sm:self-auto text-xs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Diagnostics</span>
          </button>
        </div>

        {loading ? (
          <div className="py-24 text-center text-[#86868B] space-y-3">
            <Loader2 size={32} className="animate-spin mx-auto text-[#2997FF]" />
            <p className="text-sm font-medium">Querying telemetry nodes...</p>
          </div>
        ) : health ? (
          <div className="space-y-8">
            
            {/* Main Diagnostics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* AI Model Runtime Card */}
              <div className="apple-glass-card rounded-3xl p-7 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#2997FF]/10 text-[#2997FF]">
                      <Cpu size={22} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base text-[#F5F5F7]">AI Model Runtime</h3>
                      <p className="text-xs text-[#86868B]">YOLO Computer Vision Engine</p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full border flex items-center gap-2 ${
                      health.model.loaded
                        ? 'bg-[#30D158]/10 text-[#30D158] border-[#30D158]/20'
                        : 'bg-[#FF453A]/10 text-[#FF453A] border-[#FF453A]/20'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${health.model.loaded ? 'bg-[#30D158]' : 'bg-[#FF453A]'}`} />
                    {health.model.loaded ? 'Active & Healthy' : 'Offline'}
                  </span>
                </div>

                <div className="space-y-3 text-xs pt-2">
                  <div className="flex justify-between py-2 border-b border-[#262626]">
                    <span className="text-[#86868B]">Inference Framework</span>
                    <span className="font-semibold text-[#F5F5F7]">{health.model.framework}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#262626]">
                    <span className="text-[#86868B]">Model Weights File</span>
                    <span className="font-mono text-[#2997FF]">{health.model.filename}</span>
                  </div>
                  <div className="py-2 border-b border-[#262626] space-y-1">
                    <span className="text-[#86868B] block">Absolute Weights Path</span>
                    <span className="font-mono text-[11px] text-[#A1A1A6] break-all bg-[#141414] p-2 rounded-lg block border border-[#262626]">
                      {health.model.path}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#86868B]">Configured Classes</span>
                    <span className="font-semibold text-[#30D158]">{health.model.classes_count} Classes Registered</span>
                  </div>
                </div>
              </div>

              {/* Database Telemetry Card */}
              <div className="apple-glass-card rounded-3xl p-7 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#30D158]/10 text-[#30D158]">
                      <Database size={22} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base text-[#F5F5F7]">Database Cluster</h3>
                      <p className="text-xs text-[#86868B]">Persistence & Document Storage</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#30D158]/10 text-[#30D158] border border-[#30D158]/20 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#30D158]" />
                    Operational
                  </span>
                </div>

                <div className="space-y-3 text-xs pt-2">
                  <div className="flex justify-between py-2 border-b border-[#262626]">
                    <span className="text-[#86868B]">Storage Engine</span>
                    <span className="font-semibold text-[#F5F5F7]">{health.database.type}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#262626]">
                    <span className="text-[#86868B]">Database Name</span>
                    <span className="font-mono text-[#F5F5F7]">{health.database.database_name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#262626]">
                    <span className="text-[#86868B]">Cluster Connectivity</span>
                    <span className="font-semibold text-[#30D158]">
                      {health.database.connected ? 'Active (Atlas/Local)' : 'Local File-Backed Mirror (Auto-reconnect)'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#86868B]">Platform Release</span>
                    <span className="font-mono text-[#A1A1A6]">v{health.version}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Model Class Labels Grid */}
            <div className="apple-glass-card rounded-3xl p-7 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-base text-[#F5F5F7] flex items-center gap-2.5">
                    <Layers className="text-[#2997FF]" size={18} />
                    <span>Neural Network Class Mapping</span>
                  </h3>
                  <p className="text-xs text-[#86868B] mt-0.5">
                    Classes loaded directly from discoverable YOLO weights ({Object.keys(health.model.classes).length} categories).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                {Object.entries(health.model.classes).map(([id, name]) => {
                  const isClean = name.startsWith('clean_');
                  return (
                    <div
                      key={id}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                        isClean
                          ? 'bg-[#30D158]/5 border-[#30D158]/20 text-[#30D158]'
                          : 'bg-[#FF9F0A]/5 border-[#FF9F0A]/20 text-[#FF9F0A]'
                      }`}
                    >
                      <span className="font-medium text-[11px] truncate">{name}</span>
                      <span className="font-mono text-[10px] opacity-60 ml-1">#{id}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Inference Pipeline Verification */}
            <div className="apple-glass-card rounded-3xl p-7 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div>
                  <h3 className="font-semibold text-base text-[#F5F5F7] flex items-center gap-2.5">
                    <Sparkles className="text-[#2997FF]" size={18} />
                    <span>Live Sample Inference Verification</span>
                  </h3>
                  <p className="text-xs text-[#86868B] mt-1 max-w-xl leading-relaxed">
                    Loads an image from the real dataset, passes it through the active PyTorch pipeline, and returns live bounding boxes and confidence scores.
                  </p>
                </div>

                <button
                  onClick={handleTestInference}
                  disabled={testingSample}
                  className="apple-button-primary px-5 py-3 text-xs font-semibold flex items-center gap-2 shrink-0 disabled:opacity-50"
                >
                  {testingSample ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Executing Neural Forward Pass...</span>
                    </>
                  ) : (
                    <>
                      <Terminal size={15} />
                      <span>Execute Live Test</span>
                    </>
                  )}
                </button>
              </div>

              {testError && (
                <div className="p-4 bg-[#FF453A]/10 rounded-2xl border border-[#FF453A]/25 text-xs text-[#FF453A]">
                  {testError}
                </div>
              )}

              {sampleResult && (
                <div className="p-5 bg-[#141414] rounded-2xl border border-[#262626] space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-[#F5F5F7]">
                      Model: {sampleResult.model_identifier} ({sampleResult.framework})
                    </span>
                    <span className="font-semibold text-[#30D158] bg-[#30D158]/10 border border-[#30D158]/25 px-3 py-1 rounded-full">
                      Recommendation: {sampleResult.ai_recommendation}
                    </span>
                  </div>

                  <p className="text-xs text-[#A1A1A6] leading-relaxed">
                    {sampleResult.message}
                  </p>

                  <div className="pt-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B] block mb-2">
                      Detected Objects ({sampleResult.detections.length}):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {sampleResult.detections.map((d, i) => (
                        <div
                          key={i}
                          className="px-3 py-1.5 rounded-xl bg-[#1A1A1A] border border-[#262626] text-xs font-medium text-[#F5F5F7] flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2997FF]" />
                          <span>{d.class_name}</span>
                          <span className="font-mono text-[#86868B] text-[11px]">
                            {(d.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        ) : null}

      </div>
    </div>
  );
};
