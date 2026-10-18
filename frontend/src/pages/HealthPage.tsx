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
  Loader2
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Activity size={24} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              System & Model Diagnostics
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Real-time status of the discovered YOLO model, PyTorch inference pipeline, and database persistence.
          </p>
        </div>

        <button
          onClick={loadHealth}
          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-300 rounded-xl text-xs card-shadow"
        >
          ↻ Refresh Status
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <Loader2 size={32} className="animate-spin mx-auto mb-2" />
          <p className="text-sm font-semibold">Inspecting system components...</p>
        </div>
      ) : health ? (
        <div className="space-y-6">
          
          {/* Main Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* AI Model Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 card-shadow space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Cpu className="text-emerald-700" size={22} />
                  <h3 className="font-bold text-base text-slate-900">AI Model Runtime</h3>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                    health.model.loaded
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${health.model.loaded ? 'bg-emerald-600' : 'bg-red-600'}`} />
                  {health.model.loaded ? 'Model Loaded & Active' : 'Model Failed to Load'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Framework:</span>
                  <span className="font-bold text-slate-800">{health.model.framework}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Model File:</span>
                  <span className="font-mono font-bold text-slate-800">{health.model.filename}</span>
                </div>
                <div className="py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium block mb-0.5">Absolute Weights Path:</span>
                  <span className="font-mono text-[11px] text-slate-700 break-all bg-slate-50 p-1.5 rounded-md block border border-slate-200">
                    {health.model.path}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500 font-medium">Trained Classes:</span>
                  <span className="font-bold text-emerald-700">{health.model.classes_count} Classes Loaded</span>
                </div>
              </div>
            </div>

            {/* Database Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 card-shadow space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Database className="text-teal-700" size={22} />
                  <h3 className="font-bold text-base text-slate-900">Database Engine</h3>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  Operational
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Storage Engine:</span>
                  <span className="font-bold text-slate-800">{health.database.type}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Database Name:</span>
                  <span className="font-mono font-bold text-slate-800">{health.database.database_name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">MongoDB Connection:</span>
                  <span className="font-bold text-slate-800">
                    {health.database.connected ? 'Active (Atlas/Local)' : 'Local File-Backed Mirror (Auto-reconnect)'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500 font-medium">Platform Version:</span>
                  <span className="font-bold text-slate-800">v{health.version}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Model Class Labels Grid */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 card-shadow space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Layers className="text-emerald-700" size={18} />
              <span>Model Class Mapping (Discovered from Weights)</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {Object.entries(health.model.classes).map(([id, name]) => {
                const isClean = name.startsWith('clean_');
                return (
                  <div
                    key={id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      isClean
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50/50 border-amber-200 text-amber-900'
                    }`}
                  >
                    <span className="font-semibold">{name}</span>
                    <span className="font-mono text-[10px] opacity-60">ID {id}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real Sample Inference Test Trigger */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 card-shadow space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Sparkles className="text-emerald-700" size={18} />
                  <span>Real Sample Image Inference Verification</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Loads a real test image from the dataset, runs inference using the model, and validates bounding boxes and confidences.
                </p>
              </div>

              <button
                onClick={handleTestInference}
                disabled={testingSample}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors shrink-0 disabled:opacity-50"
              >
                {testingSample ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Running Inference...</span>
                  </>
                ) : (
                  <>
                    <Cpu size={16} />
                    <span>Run Real Sample Test</span>
                  </>
                )}
              </button>
            </div>

            {testError && (
              <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">{testError}</p>
            )}

            {sampleResult && (
              <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">
                    Model: {sampleResult.model_identifier} ({sampleResult.framework})
                  </span>
                  <span className="font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    {sampleResult.ai_recommendation}
                  </span>
                </div>
                <p className="text-xs text-slate-700">{sampleResult.message}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {sampleResult.detections.map((d, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-semibold text-slate-800">
                      {d.class_name}: {(d.confidence * 100).toFixed(0)}% (Box: {d.bbox.width}x{d.bbox.height})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      ) : null}

    </div>
  );
};
