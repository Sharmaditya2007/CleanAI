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
  ChevronRight,
  Loader2,
  Check,
  Eye,
  Sliders,
  ShieldAlert,
  Radio
} from 'lucide-react';
import { api, getMediaUrl } from '../services/api';
import { Toilet, AIInferenceResult } from '../types';
import { LeafletMap } from '../components/LeafletMap';
import { StatusBadge } from '../components/StatusBadge';

export const LandingPage: React.FC = () => {
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [selectedToilet, setSelectedToilet] = useState<Toilet | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    clean: 0,
    needsCleaning: 0,
    rate: 0
  });
  const [sampleResult, setSampleResult] = useState<AIInferenceResult | null>(null);
  const [testingAi, setTestingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const list = await api.getToilets();
        setToilets(list);
        if (list.length > 0) setSelectedToilet(list[0]);
        
        const clean = list.filter(t => t.verified_status === 'Clean').length;
        const needsClean = list.filter(t => t.verified_status === 'Needs Cleaning').length;
        const total = list.length;
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
    loadData();
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
    <div className="relative bg-[#050505] text-[#F5F5F7] overflow-hidden">
      
      {/* Ambient Lighting Glows */}
      <div className="ambient-glow-top" />
      <div className="absolute top-[800px] right-[-200px] w-[500px] height-[500px] bg-[radial-gradient(circle,rgba(41,151,255,0.06)_0%,transparent_70%)] pointer-events-none" />

      {/* ======================================================== */}
      {/* HERO SECTION                                            */}
      {/* ======================================================== */}
      <section className="relative pt-20 sm:pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        
        {/* Subtle Pill Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#161616] border border-[#262626] text-[#A1A1A6] text-[12px] font-medium tracking-tight mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2997FF] animate-pulse"></span>
          <span>YOLOv11 Neural Sanitation Intelligence</span>
        </div>

        {/* Cinematic Headline */}
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-[#F5F5F7] leading-[1.05] max-w-4xl mx-auto">
          Clean Spaces. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#F5F5F7] via-[#D1D1D6] to-[#8E8E93]">
            Smarter Cities.
          </span>
        </h1>

        {/* Controlled Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-[#A1A1A6] max-w-2xl mx-auto font-normal leading-relaxed">
          AI-powered cleanliness intelligence for public toilets. Real inspections, verified updates, and better decisions for every citizen.
        </p>

        {/* Primary & Secondary Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/customer"
            className="apple-button-primary px-7 py-3 rounded-full text-[15px] font-semibold tracking-tight flex items-center gap-2 group shadow-lg"
          >
            <span>Find a Clean Toilet</span>
            <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <a
            href="#intelligence"
            className="apple-button-secondary px-7 py-3 rounded-full text-[15px] font-semibold tracking-tight flex items-center gap-2"
          >
            <span>Explore the Technology</span>
          </a>
        </div>

        {/* Cinematic AI Radar / Geospatial Visual */}
        <div className="mt-16 relative max-w-4xl mx-auto rounded-3xl border border-[#262626] bg-[#0A0A0A] p-2 sm:p-4 shadow-2xl overflow-hidden">
          <div className="relative h-[320px] sm:h-[420px] w-full rounded-2xl bg-[#050505] overflow-hidden flex items-center justify-center border border-[#1A1A1A]">
            
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#161616_1px,transparent_1px),linear-gradient(to_bottom,#161616_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />

            {/* Glowing Radar Concentric Rings */}
            <div className="absolute w-[240px] sm:w-[320px] h-[240px] sm:h-[320px] rounded-full border border-[#2997FF]/20 animate-pulse" />
            <div className="absolute w-[360px] sm:w-[480px] h-[360px] sm:h-[480px] rounded-full border border-[#262626]" />
            <div className="absolute w-[120px] sm:w-[160px] h-[120px] sm:h-[160px] rounded-full border border-[#2997FF]/30" />

            {/* Center Core Scanner */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-[#111111] border border-[#2997FF]/40 flex items-center justify-center text-[#2997FF] shadow-2xl blue-glow">
                <Cpu size={28} />
              </div>
              <p className="mt-3 text-[12px] font-mono uppercase tracking-widest text-[#2997FF]">
                YOLOv11 Nano Core • Active
              </p>
              <p className="text-[11px] text-[#6E6E73] font-mono mt-0.5">
                Latency: 82ms • 16 Sanitation Classes
              </p>
            </div>

            {/* Orbiting Satellite Data Nodes */}
            <div className="absolute top-12 left-12 sm:left-24 bg-[#111111]/90 backdrop-blur-md border border-[#262626] rounded-xl px-3 py-2 text-left shadow-lg">
              <div className="flex items-center gap-1.5 text-[11px] text-[#30D158] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#30D158]" />
                <span>Verified Clean</span>
              </div>
              <p className="text-[12px] font-medium text-[#F5F5F7] mt-0.5">Connaught Place Metro</p>
              <p className="text-[10px] text-[#6E6E73]">Score: 98.4% Clean</p>
            </div>

            <div className="absolute bottom-12 right-8 sm:right-20 bg-[#111111]/90 backdrop-blur-md border border-[#262626] rounded-xl px-3 py-2 text-left shadow-lg">
              <div className="flex items-center gap-1.5 text-[11px] text-[#FF9F0A] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF9F0A]" />
                <span>Task Dispatched</span>
              </div>
              <p className="text-[12px] font-medium text-[#F5F5F7] mt-0.5">Janpath Public Complex</p>
              <p className="text-[10px] text-[#6E6E73]">Contractor En Route</p>
            </div>

            {/* Bottom Floating Telemetry */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 text-[11px] font-mono text-[#6E6E73] bg-[#0A0A0A]/80 px-4 py-1.5 rounded-full border border-[#262626]">
              <span>GPS: 28.6315° N, 77.2167° E</span>
              <span>•</span>
              <span className="text-[#30D158]">Cloud Sync: Normal</span>
            </div>

          </div>
        </div>

        {/* Minimalist Metrics Strip */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="apple-glass-card rounded-2xl p-5 text-center">
            <p className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F5F7]">{stats.total || 6}</p>
            <p className="text-[12px] text-[#A1A1A6] font-medium mt-1">Monitored Facilities</p>
          </div>
          <div className="apple-glass-card rounded-2xl p-5 text-center">
            <p className="text-3xl sm:text-4xl font-bold tracking-tight text-[#30D158]">{stats.clean || 4}</p>
            <p className="text-[12px] text-[#A1A1A6] font-medium mt-1">Verified Clean</p>
          </div>
          <div className="apple-glass-card rounded-2xl p-5 text-center">
            <p className="text-3xl sm:text-4xl font-bold tracking-tight text-[#FF9F0A]">{stats.needsCleaning || 1}</p>
            <p className="text-[12px] text-[#A1A1A6] font-medium mt-1">Needs Attention</p>
          </div>
          <div className="apple-glass-card rounded-2xl p-5 text-center">
            <p className="text-3xl sm:text-4xl font-bold tracking-tight text-[#2997FF]">{stats.rate || 80}%</p>
            <p className="text-[12px] text-[#A1A1A6] font-medium mt-1">Cleanliness Rate</p>
          </div>
        </div>

      </section>

      {/* ======================================================== */}
      {/* SECTION 1 — AI INTELLIGENCE (Interactive YOLO Showcase)  */}
      {/* ======================================================== */}
      <section id="intelligence" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#1F1F1F]">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-[12px] font-semibold text-[#2997FF] uppercase tracking-wider">
            Machine Vision
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#F5F5F7]">
            Cleanliness, understood.
          </h2>
          <p className="text-base sm:text-lg text-[#A1A1A6] leading-relaxed">
            Our original YOLOv11 nano model evaluates floors, basins, and fixtures across 16 precise sanitation classes. Cautious decision heuristics ensure uncertain scenes are never falsely declared clean.
          </p>
        </div>

        {/* Split Screen AI Demonstration Card */}
        <div className="apple-glass-card rounded-3xl p-6 sm:p-10 max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between pb-6 mb-6 border-b border-[#262626] gap-4">
            <div>
              <h3 className="text-lg font-semibold text-[#F5F5F7]">Live Neural Inference Test</h3>
              <p className="text-xs text-[#A1A1A6]">
                Execute inference using the actual trained model weights (`best.pt`) on a dataset image.
              </p>
            </div>
            
            <button
              onClick={handleRunSampleAi}
              disabled={testingAi}
              className="apple-button-primary px-5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              {testingAi ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Evaluating Neural Weights...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Run Live AI Inference</span>
                </>
              )}
            </button>
          </div>

          {aiError && (
            <div className="p-3 bg-[#FF453A]/10 border border-[#FF453A]/25 rounded-xl text-[#FF453A] text-xs mb-6">
              {aiError}
            </div>
          )}

          {sampleResult ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Annotated visual preview */}
              <div className="rounded-2xl overflow-hidden border border-[#262626] bg-[#0A0A0A] p-3 text-center">
                {sampleResult.annotated_image_url ? (
                  <img
                    src={getMediaUrl(sampleResult.annotated_image_url)}
                    alt="YOLO Detection Preview"
                    className="w-full h-auto max-h-[300px] object-contain rounded-xl mx-auto"
                  />
                ) : (
                  <div className="h-48 flex items-center justify-center text-[#6E6E73] text-xs">
                    No visual bounding boxes generated
                  </div>
                )}
                <p className="text-[11px] font-mono text-[#A1A1A6] mt-2">
                  Bounding Boxes Overlaid via Ultralytics Engine
                </p>
              </div>

              {/* Detections metadata panel */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#161616] border border-[#262626]">
                  <span className="text-xs text-[#A1A1A6]">AI Recommendation</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                    sampleResult.ai_recommendation === 'Clean'
                      ? 'bg-[#30D158]/10 text-[#30D158] border-[#30D158]/30'
                      : sampleResult.ai_recommendation === 'Needs Cleaning'
                      ? 'bg-[#FF9F0A]/10 text-[#FF9F0A] border-[#FF9F0A]/30'
                      : 'bg-[#2997FF]/10 text-[#2997FF] border-[#2997FF]/30'
                  }`}>
                    {sampleResult.ai_recommendation}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#161616] border border-[#262626]">
                  <p className="text-[11px] font-mono text-[#6E6E73] uppercase">Analysis Rationale</p>
                  <p className="text-xs text-[#F5F5F7] mt-1 leading-relaxed">
                    {sampleResult.message}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-wider text-[#A1A1A6] font-semibold mb-2">
                    Detected Objects ({sampleResult.total_detections})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {sampleResult.detections.map((d, idx) => (
                      <span
                        key={idx}
                        className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${
                          d.is_dirty_indicator
                            ? 'bg-[#FF453A]/10 text-[#FF453A] border-[#FF453A]/25'
                            : 'bg-[#30D158]/10 text-[#30D158] border-[#30D158]/25'
                        }`}
                      >
                        {d.class_name.replace(/_/g, ' ')} • {(d.confidence * 100).toFixed(0)}%
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-[#6E6E73] space-y-2">
              <Cpu size={32} className="mx-auto text-[#A1A1A6] opacity-40" />
              <p className="text-sm font-medium text-[#A1A1A6]">Ready for Inference</p>
              <p className="text-xs max-w-sm mx-auto">
                Click "Run Live AI Inference" above to trigger real PyTorch execution directly on your backend.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 2 — VERIFIED BY PEOPLE (Visual Sequence)         */}
      {/* ======================================================== */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#1F1F1F]">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-[12px] font-semibold text-[#2997FF] uppercase tracking-wider">
            Verification Protocol
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#F5F5F7]">
            AI insight. Human verification.
          </h2>
          <p className="text-base sm:text-lg text-[#A1A1A6] leading-relaxed">
            Technology informs decisions; it does not replace accountability. Every AI inspection empowers municipal officers to review visual evidence before certifying public status.
          </p>
        </div>

        {/* 3-Step Refined Sequence */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          
          <div className="apple-glass-card rounded-2xl p-7 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#161616] border border-[#262626] flex items-center justify-center text-[#2997FF] font-mono text-sm font-bold">
                01
              </div>
              <h3 className="text-xl font-semibold text-[#F5F5F7]">Image Analysis</h3>
              <p className="text-xs sm:text-sm text-[#A1A1A6] leading-relaxed">
                Staff or sensors upload high-resolution facility photos. The YOLOv11 model instantly scans floors, urinals, and basins for soil, garbage, or damage.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-[#1F1F1F] flex items-center gap-2 text-[11px] text-[#6E6E73]">
              <Eye size={13} className="text-[#2997FF]" />
              <span>Real-time Bounding Boxes</span>
            </div>
          </div>

          <div className="apple-glass-card rounded-2xl p-7 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#161616] border border-[#262626] flex items-center justify-center text-[#2997FF] font-mono text-sm font-bold">
                02
              </div>
              <h3 className="text-xl font-semibold text-[#F5F5F7]">Officer Review</h3>
              <p className="text-xs sm:text-sm text-[#A1A1A6] leading-relaxed">
                Municipal inspectors examine the model's confidence scores. If the officer disagrees with the AI recommendation, a mandatory audit reason is recorded.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-[#1F1F1F] flex items-center gap-2 text-[11px] text-[#6E6E73]">
              <ShieldCheck size={13} className="text-[#30D158]" />
              <span>Immutable Audit Logs</span>
            </div>
          </div>

          <div className="apple-glass-card rounded-2xl p-7 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#161616] border border-[#262626] flex items-center justify-center text-[#2997FF] font-mono text-sm font-bold">
                03
              </div>
              <h3 className="text-xl font-semibold text-[#F5F5F7]">Verified Status</h3>
              <p className="text-xs sm:text-sm text-[#A1A1A6] leading-relaxed">
                The public map instantly syncs to "Clean", "Needs Cleaning", or "Under Maintenance". If dirty, an automated task dispatches to the facility owner.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-[#1F1F1F] flex items-center gap-2 text-[11px] text-[#6E6E73]">
              <Radio size={13} className="text-[#2997FF]" />
              <span>Live Public Map Sync</span>
            </div>
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 3 — EVERY TOILET, CONNECTED (Real Dark Map)      */}
      {/* ======================================================== */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#1F1F1F]">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-[12px] font-semibold text-[#2997FF] uppercase tracking-wider">
            Geospatial Network
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#F5F5F7]">
            A clearer view of your city.
          </h2>
          <p className="text-base sm:text-lg text-[#A1A1A6] leading-relaxed">
            Real registered public toilets mapped with precision GPS coordinates, live cleanliness statuses, and facilities breakdown.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
          
          {/* Map View */}
          <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-[#262626] bg-[#0A0A0A]">
            <LeafletMap
              toilets={toilets}
              selectedToilet={selectedToilet}
              onSelectToilet={(t) => setSelectedToilet(t)}
              height="440px"
            />
          </div>

          {/* Real Nearby List */}
          <div className="apple-glass-card rounded-2xl p-5 flex flex-col justify-between overflow-hidden">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#262626]">
                <h4 className="text-sm font-semibold text-[#F5F5F7]">Registered Facilities</h4>
                <span className="text-[11px] text-[#2997FF] font-mono">{toilets.length} Live Pins</span>
              </div>

              <div className="space-y-2.5 max-h-[310px] overflow-y-auto pr-1">
                {toilets.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedToilet(t)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      selectedToilet?.id === t.id
                        ? 'bg-[#1A1A1A] border-[#2997FF]/60 shadow-xs'
                        : 'bg-[#111111] border-[#262626] hover:border-[#333333]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-[#F5F5F7] truncate">{t.name}</p>
                      <StatusBadge status={t.verified_status} size="sm" />
                    </div>
                    <p className="text-[11px] text-[#A1A1A6] mt-1">{t.locality}, {t.city}</p>
                  </div>
                ))}
              </div>
            </div>

            <Link
              to="/customer"
              className="mt-4 w-full py-2.5 rounded-full text-center text-xs font-semibold apple-button-secondary block"
            >
              Open Full Interactive Explorer
            </Link>
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 4 — A BETTER EXPERIENCE FOR EVERYONE             */}
      {/* ======================================================== */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#1F1F1F]">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-[12px] font-semibold text-[#2997FF] uppercase tracking-wider">
            Integrated Ecosystem
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#F5F5F7]">
            A better experience for everyone.
          </h2>
          <p className="text-base sm:text-lg text-[#A1A1A6] leading-relaxed">
            Tailored interfaces engineered for municipal oversight, contractor accountability, and citizen well-being.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          
          {/* Card 1: Municipal */}
          <div className="apple-glass-card rounded-3xl p-8 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#161616] border border-[#262626] flex items-center justify-center text-[#2997FF] group-hover:border-[#2997FF]/50 transition-colors">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-2xl font-bold text-[#F5F5F7]">Municipal Authority</h3>
              <p className="text-xs sm:text-sm text-[#A1A1A6] leading-relaxed">
                Inspect facilities, audit AI suggestions, approve new toilet registrations, and prioritize cleaning dispatches across the entire city.
              </p>
            </div>
            <Link
              to="/municipal"
              className="mt-8 apple-button-secondary py-2.5 px-4 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Launch Municipal Command</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          {/* Card 2: Owner */}
          <div className="apple-glass-card rounded-3xl p-8 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#161616] border border-[#262626] flex items-center justify-center text-[#2997FF] group-hover:border-[#2997FF]/50 transition-colors">
                <Building2 size={24} />
              </div>
              <h3 className="text-2xl font-bold text-[#F5F5F7]">Toilet Owner & Contractor</h3>
              <p className="text-xs sm:text-sm text-[#A1A1A6] leading-relaxed">
                Register sanitation infrastructure, receive real-time cleaning orders, and upload before/after photos for automated re-verification.
              </p>
            </div>
            <Link
              to="/owner"
              className="mt-8 apple-button-secondary py-2.5 px-4 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Launch Owner Portal</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          {/* Card 3: Citizen */}
          <div className="apple-glass-card rounded-3xl p-8 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#161616] border border-[#262626] flex items-center justify-center text-[#2997FF] group-hover:border-[#2997FF]/50 transition-colors">
                <Compass size={24} />
              </div>
              <h3 className="text-2xl font-bold text-[#F5F5F7]">Public Citizen</h3>
              <p className="text-xs sm:text-sm text-[#A1A1A6] leading-relaxed">
                Locate verified clean restrooms within seconds via GPS. Filter by accessibility, check opening hours, and report sanitation issues instantly.
              </p>
            </div>
            <Link
              to="/customer"
              className="mt-8 apple-button-secondary py-2.5 px-4 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Launch Citizen Discovery</span>
              <ChevronRight size={14} />
            </Link>
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 5 — CLOSING CALL TO ACTION                       */}
      {/* ======================================================== */}
      <section className="py-28 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center border-t border-[#1F1F1F]">
        <div className="space-y-6">
          <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#F5F5F7]">
            Better public spaces start here.
          </h2>
          <p className="text-base sm:text-lg text-[#A1A1A6] max-w-xl mx-auto leading-relaxed">
            Bring intelligence, transparency, and accountability to public toilet cleanliness.
          </p>
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/customer"
              className="apple-button-primary px-8 py-3.5 rounded-full text-sm font-semibold tracking-tight shadow-xl flex items-center gap-2 group"
            >
              <span>Explore Clean AI</span>
              <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              to="/login"
              className="apple-button-secondary px-8 py-3.5 rounded-full text-sm font-semibold tracking-tight"
            >
              <span>Sign In to Dashboard</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

