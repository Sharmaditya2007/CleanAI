import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  Building2,
  Compass,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Activity,
  MapPin,
  Cpu,
  Layers,
  Search,
  Loader2
} from 'lucide-react';
import { api, getMediaUrl } from '../services/api';
import { Toilet, AIInferenceResult } from '../types';

export const LandingPage: React.FC = () => {
  const [stats, setStats] = useState({
    total: 6,
    clean: 3,
    needsCleaning: 1,
    rate: 75.0
  });
  const [sampleResult, setSampleResult] = useState<AIInferenceResult | null>(null);
  const [testingAi, setTestingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const toilets = await api.getToilets();
        const clean = toilets.filter(t => t.verified_status === 'Clean').length;
        const needsClean = toilets.filter(t => t.verified_status === 'Needs Cleaning').length;
        const total = toilets.length;
        setStats({
          total,
          clean,
          needsCleaning: needsClean,
          rate: total > 0 ? Math.round((clean / total) * 100) : 0
        });
      } catch (e) {
        console.warn('Could not load landing stats:', e);
      }
    }
    loadStats();
  }, []);

  const handleRunSampleAi = async () => {
    setTestingAi(true);
    setAiError(null);
    try {
      const res = await api.runSampleTest();
      setSampleResult(res);
    } catch (e: any) {
      setAiError(e.message || 'AI test failed.');
    } finally {
      setTestingAi(false);
    }
  };

  return (
    <div className="space-y-16 pb-20">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-900 via-emerald-800 to-teal-900 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8 rounded-b-[2.5rem] card-shadow">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wide uppercase">
            <Sparkles size={14} />
            <span>AI-Powered Civic Sanitation Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Smarter Toilets. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-sky-300">
              Cleaner Cities.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-emerald-100 font-normal leading-relaxed">
            Clean AI deploys real-time computer vision to inspect public sanitation facilities,
            empower municipal oversight, and provide citizens with verified cleanliness data.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link
              to="/customer"
              className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2 group text-sm sm:text-base"
            >
              <Compass size={18} />
              <span>Find Clean Toilets Nearby</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/municipal"
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl border border-white/20 backdrop-blur-xs transition-all flex items-center gap-2 text-sm sm:text-base"
            >
              <ShieldCheck size={18} />
              <span>Municipal Officer Portal</span>
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto pt-10">
            <div className="glass-panel p-4 rounded-2xl text-center border-white/10 bg-white/10">
              <p className="text-2xl sm:text-3xl font-extrabold text-white">{stats.total}</p>
              <p className="text-xs text-emerald-200 font-medium mt-0.5">Monitored Facilities</p>
            </div>
            <div className="glass-panel p-4 rounded-2xl text-center border-white/10 bg-white/10">
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-300">{stats.clean}</p>
              <p className="text-xs text-emerald-200 font-medium mt-0.5">Verified Clean</p>
            </div>
            <div className="glass-panel p-4 rounded-2xl text-center border-white/10 bg-white/10">
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-300">{stats.needsCleaning}</p>
              <p className="text-xs text-emerald-200 font-medium mt-0.5">Needs Cleaning</p>
            </div>
            <div className="glass-panel p-4 rounded-2xl text-center border-white/10 bg-white/10">
              <p className="text-2xl sm:text-3xl font-extrabold text-sky-300">{stats.rate}%</p>
              <p className="text-xs text-emerald-200 font-medium mt-0.5">Cleanliness Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive AI Demonstration Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200 card-shadow overflow-hidden p-6 sm:p-10">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
              <Cpu size={14} />
              <span>Integrated YOLOv11 Computer Vision</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Test the AI Model on Real Dataset Imagery
            </h2>
            <p className="text-slate-600 text-sm">
              Trigger instant real inference using the workspace's trained weights (16 sanitation classes) on a real toilet photograph.
            </p>
            
            <button
              onClick={handleRunSampleAi}
              disabled={testingAi}
              className="mt-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
            >
              {testingAi ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Running Inference on PyTorch Weights...
                </>
              ) : (
                <>
                  <Sparkles size={16} className="text-emerald-400" />
                  Run Sample AI Inference Test
                </>
              )}
            </button>
          </div>

          {aiError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs mb-6">
              {aiError}
            </div>
          )}

          {sampleResult && (
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-600" size={20} />
                  <span className="font-bold text-sm text-slate-900">
                    Inference Success: {sampleResult.model_identifier}
                  </span>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold">
                  Recommendation: {sampleResult.ai_recommendation}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {sampleResult.annotated_image_url && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-white p-2">
                    <img
                      src={getMediaUrl(sampleResult.annotated_image_url)}
                      alt="Sample annotated result"
                      className="w-full h-auto max-h-[260px] object-contain rounded-lg"
                    />
                    <p className="text-[11px] text-center text-slate-500 mt-1 font-mono">
                      YOLO Visual Detections Overlay
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white p-3 rounded-xl border border-slate-200">
                    {sampleResult.message}
                  </p>

                  <div>
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                      Objects Detected ({sampleResult.total_detections}):
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {sampleResult.detections.map((d, i) => (
                        <span
                          key={i}
                          className={`text-xs px-2.5 py-1 rounded-lg font-semibold border ${
                            d.is_dirty_indicator
                              ? 'bg-red-50 text-red-800 border-red-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {d.class_name.replace(/_/g, ' ')} ({(d.confidence * 100).toFixed(0)}%)
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* The Three Portals Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Dedicated Workflows for Every Stakeholder
          </h2>
          <p className="text-sm text-slate-600">
            Three tailored portals ensuring municipal rigor, contractor accountability, and citizen trust.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          
          {/* Municipal Portal Card */}
          <div className="bg-white rounded-3xl p-7 border border-slate-200 card-shadow card-shadow-hover transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                <ShieldCheck size={26} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Municipal Authority</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Full officer dashboard with live city analytics, AI inspection reviews, override auditing, registration approval, and cleaning task assignment.
              </p>
            </div>
            <Link
              to="/municipal"
              className="mt-6 w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Open Municipal Portal</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Toilet Owner Portal Card */}
          <div className="bg-white rounded-3xl p-7 border border-slate-200 card-shadow card-shadow-hover transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-100">
                <Building2 size={26} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Toilet Owner & Contractor</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Register new public/private sanitation facilities, track assigned maintenance tasks, and report cleaning completion with before/after photo uploads.
              </p>
            </div>
            <Link
              to="/owner"
              className="mt-6 w-full py-2.5 px-4 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Open Owner Portal</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Customer Portal Card */}
          <div className="bg-white rounded-3xl p-7 border border-slate-200 card-shadow card-shadow-hover transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                <Compass size={26} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Citizen & Tourist Discovery</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mobile-optimized discovery with GPS geolocation, interactive map pins, distance calculation, accessibility filters, and citizen issue reporting.
              </p>
            </div>
            <Link
              to="/customer"
              className="mt-6 w-full py-2.5 px-4 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Open Citizen Portal</span>
              <ArrowRight size={14} />
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
};
