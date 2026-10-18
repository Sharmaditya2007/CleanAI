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
  Radio,
  Clock,
  Scan
} from 'lucide-react';
import { api, getMediaUrl } from '../services/api';
import { Toilet, AIInferenceResult } from '../types';
import { LeafletMap } from '../components/LeafletMap';
import { StatusBadge } from '../components/StatusBadge';
import { ThreeDCard } from '../components/ThreeDCard';
import { ThreeDHeroVisual } from '../components/ThreeDHeroVisual';

export const LandingPage: React.FC = () => {
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [selectedToilet, setSelectedToilet] = useState<Toilet | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    clean: 0,
    needsCleaning: 0,
    rate: 0
  });
  const [modelClassesCount, setModelClassesCount] = useState<number | null>(null);
  const [sampleResult, setSampleResult] = useState<AIInferenceResult | null>(null);
  const [testingAi, setTestingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [list, health] = await Promise.allSettled([
          api.getToilets(),
          api.getHealth()
        ]);

        if (list.status === 'fulfilled') {
          const tList = list.value;
          setToilets(tList);
          if (tList.length > 0) setSelectedToilet(tList[0]);
          
          const clean = tList.filter(t => t.verified_status === 'Clean').length;
          const needsClean = tList.filter(t => t.verified_status === 'Needs Cleaning').length;
          const total = tList.length;
          setStats({
            total,
            clean,
            needsCleaning: needsClean,
            rate: total > 0 ? Math.round((clean / total) * 100) : 0
          });
        }

        if (health.status === 'fulfilled' && health.value?.model?.classes_count) {
          setModelClassesCount(health.value.model.classes_count);
        }
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
    <div className="relative bg-[#030303] text-[#F5F5F7] overflow-hidden selection:bg-[#2997FF]/30">
      
      {/* Background Cinematic Atmosphere */}
      <div className="absolute top-[-140px] left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-[radial-gradient(circle,rgba(41,151,255,0.12)_0%,rgba(180,205,237,0.03)_40%,transparent_70%)] pointer-events-none" />
      <div className="absolute top-[1600px] right-[-240px] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(48,209,88,0.06)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute top-[3200px] left-[-200px] w-[650px] h-[650px] bg-[radial-gradient(circle,rgba(41,151,255,0.07)_0%,transparent_70%)] pointer-events-none" />

      {/* ======================================================== */}
      {/* 1. CINEMATIC 3D HERO SECTION                             */}
      {/* ======================================================== */}
      <section className="relative min-h-[90vh] flex items-center pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center w-full">
          
          {/* Hero Left: Typographic Presentation */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left z-10">
            
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0D0D0D] border border-[#262626] text-[#A1A1A6] text-[11px] font-medium tracking-wide shadow-inner">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2997FF] animate-pulse" />
              <span>YOLOv11 Neural Sanitation Intelligence</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-7xl lg:text-[76px] font-semibold tracking-tight text-[#F5F5F7] leading-[1.04]">
              Clean Spaces. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#F5F5F7] via-[#D1D1D6] to-[#71717A]">
                Smarter Cities.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-[#86868B] max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
              AI-powered cleanliness intelligence for public toilets. Real inspections, verified updates, and better decisions for every citizen.
            </p>

            {/* CTA Group */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                to="/customer"
                className="apple-button-primary px-7 py-3.5 rounded-full text-sm font-semibold tracking-tight flex items-center gap-2 group shadow-xl shadow-[#2997FF]/20"
              >
                <span>Find a Clean Toilet</span>
                <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <a
                href="#intelligence"
                className="apple-button-secondary px-7 py-3.5 rounded-full text-sm font-semibold tracking-tight flex items-center gap-2"
              >
                <span>Explore the Technology</span>
              </a>
            </div>

            {/* Key Metrics Strip (Real Backend Values) */}
            <div className="pt-6 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0 border-t border-[#1C1C1E]">
              <div>
                <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#F5F5F7]">{stats.total}</p>
                <p className="text-[11px] text-[#86868B] mt-0.5 uppercase tracking-wider font-mono">Facilities</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#30D158]">{stats.rate}%</p>
                <p className="text-[11px] text-[#86868B] mt-0.5 uppercase tracking-wider font-mono">Clean Index</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#2997FF]">
                  {modelClassesCount !== null ? modelClassesCount : '16'}
                </p>
                <p className="text-[11px] text-[#86868B] mt-0.5 uppercase tracking-wider font-mono">Vision Classes</p>
              </div>
            </div>

          </div>

          {/* Hero Right: Interactive 3D Composition with Real Data */}
          <div className="lg:col-span-5 flex items-center justify-center relative">
            <ThreeDHeroVisual primaryToilet={selectedToilet} classesCount={modelClassesCount} />
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. SECTION 1 — AI INTELLIGENCE: "See what others miss"    */}
      {/* ======================================================== */}
      <section id="intelligence" className="py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#1F1F1F]">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#2997FF]">
            Computer Vision Core
          </span>
          <h2 className="text-4xl sm:text-6xl font-semibold tracking-tight text-[#F5F5F7]">
            See what others miss.
          </h2>
          <p className="text-base sm:text-lg text-[#86868B] leading-relaxed">
            Our original YOLOv11 model detects stains, debris, and hygiene indicators across 16 trained classes, delivering real machine confidence scores to municipal authorities.
          </p>
        </div>

        {/* 3D Floating Inspection Panel */}
        <ThreeDCard maxTilt={6} scaleOnHover={1.01} className="max-w-5xl mx-auto">
          <div className="apple-glass-card rounded-3xl p-6 sm:p-10 border border-[#262626] shadow-2xl">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-8 border-b border-[#262626] gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#2997FF] animate-pulse" />
                  <h3 className="text-xl font-semibold text-[#F5F5F7]">Live Neural Detection Stream</h3>
                </div>
                <p className="text-xs text-[#86868B] mt-1">
                  Passed through PyTorch inference using model weights (`best.pt`).
                </p>
              </div>

              <button
                onClick={handleRunSampleAi}
                disabled={testingAi}
                className="apple-button-primary px-6 py-3 rounded-full text-xs font-semibold flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {testingAi ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Evaluating Tensor Forward Pass...</span>
                  </>
                ) : (
                  <>
                    <Scan size={15} />
                    <span>Execute Real Inference Test</span>
                  </>
                )}
              </button>
            </div>

            {aiError && (
              <div className="p-4 bg-[#FF453A]/10 border border-[#FF453A]/25 rounded-2xl text-[#FF453A] text-xs mb-6">
                {aiError}
              </div>
            )}

            {sampleResult ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Visual Image Inspection Box with Bounding Box Overlay */}
                <div className="relative rounded-2xl overflow-hidden border border-[#262626] bg-[#0A0A0A] p-3 text-center">
                  {sampleResult.annotated_image_url ? (
                    <div className="relative rounded-xl overflow-hidden inline-block max-h-[340px]">
                      <img
                        src={getMediaUrl(sampleResult.annotated_image_url)}
                        alt="YOLO Detection Visual"
                        className="w-full h-auto max-h-[320px] object-contain rounded-xl"
                      />
                      <div className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-[#000000]/80 backdrop-blur-md text-[10px] font-mono text-[#30D158] border border-[#30D158]/30">
                        Bounding Boxes Verified
                      </div>
                    </div>
                  ) : (
                    <div className="h-56 flex items-center justify-center text-[#6E6E73] text-xs">
                      No annotated frame generated
                    </div>
                  )}
                  <p className="text-[11px] font-mono text-[#86868B] mt-2.5">
                    Model: {sampleResult.model_identifier} • Framework: {sampleResult.framework}
                  </p>
                </div>

                {/* Real Model Detections Breakdown */}
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-[#86868B]">AI Recommendation</p>
                      <p className="text-base font-semibold text-[#F5F5F7] mt-0.5">{sampleResult.ai_recommendation}</p>
                    </div>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-semibold border ${
                        sampleResult.ai_recommendation === 'Clean'
                          ? 'bg-[#30D158]/10 text-[#30D158] border-[#30D158]/30'
                          : 'bg-[#FF9F0A]/10 text-[#FF9F0A] border-[#FF9F0A]/30'
                      }`}
                    >
                      {sampleResult.ai_recommendation}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626]">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[#86868B]">Decision Rationale</p>
                    <p className="text-xs text-[#A1A1A6] mt-1.5 leading-relaxed">
                      {sampleResult.message}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] uppercase tracking-wider text-[#86868B] font-semibold">
                        Detected Features ({sampleResult.total_detections})
                      </p>
                      <span className="text-[10px] font-mono text-[#2997FF]">Confidence Output</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sampleResult.detections.map((d, idx) => (
                        <div
                          key={idx}
                          className={`text-xs font-medium px-3 py-1.5 rounded-xl border flex items-center gap-2 ${
                            d.is_dirty_indicator
                              ? 'bg-[#FF453A]/10 text-[#FF453A] border-[#FF453A]/25'
                              : 'bg-[#30D158]/10 text-[#30D158] border-[#30D158]/25'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          <span>{d.class_name.replace(/_/g, ' ')}</span>
                          <span className="font-mono text-[11px] opacity-80">
                            {(d.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-14 text-center text-[#86868B] space-y-3">
                <Cpu size={36} className="mx-auto text-[#2997FF] opacity-70 animate-pulse" />
                <p className="text-base font-semibold text-[#F5F5F7]">Autonomous Vision Core Ready</p>
                <p className="text-xs text-[#86868B] max-w-md mx-auto leading-relaxed">
                  Click "Execute Real Inference Test" above to load an authentic sample image and compute live object bounding boxes with our trained YOLO model.
                </p>
              </div>
            )}

          </div>
        </ThreeDCard>
      </section>

      {/* ======================================================== */}
      {/* 3. SECTION 2 — VERIFICATION: "Intelligence meets accountability" */}
      {/* ======================================================== */}
      <section id="how-it-works" className="py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#1F1F1F]">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#30D158]">
            Verification Protocol
          </span>
          <h2 className="text-4xl sm:text-6xl font-semibold tracking-tight text-[#F5F5F7]">
            Intelligence meets accountability.
          </h2>
          <p className="text-base sm:text-lg text-[#86868B] leading-relaxed">
            AI produces actionable recommendations. Authorized municipal officers confirm the public cleanliness status, creating an unbroken chain of civic trust.
          </p>
        </div>

        {/* 3D Stepped Visual Sequence */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          
          <ThreeDCard maxTilt={8} scaleOnHover={1.03}>
            <div className="apple-glass-card rounded-3xl p-8 h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-11 h-11 rounded-2xl bg-[#141414] border border-[#262626] flex items-center justify-center text-[#2997FF] font-mono text-xs font-semibold">
                  01
                </div>
                <h3 className="text-xl font-semibold text-[#F5F5F7]">Image Analysis</h3>
                <p className="text-xs sm:text-sm text-[#86868B] leading-relaxed">
                  CCTV sensors or field workers capture high-resolution imagery. YOLOv11 analyzes fixtures, floors, and surfaces in under 100ms.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-[#262626] flex items-center gap-2 text-[11px] text-[#A1A1A6]">
                <Eye size={13} className="text-[#2997FF]" />
                <span>Automated Neural Inference</span>
              </div>
            </div>
          </ThreeDCard>

          <ThreeDCard maxTilt={8} scaleOnHover={1.03}>
            <div className="apple-glass-card rounded-3xl p-8 h-full flex flex-col justify-between border-[#2997FF]/30 shadow-lg shadow-[#2997FF]/5">
              <div className="space-y-4">
                <div className="w-11 h-11 rounded-2xl bg-[#141414] border border-[#2997FF]/40 flex items-center justify-center text-[#2997FF] font-mono text-xs font-semibold">
                  02
                </div>
                <h3 className="text-xl font-semibold text-[#F5F5F7]">Officer Review</h3>
                <p className="text-xs sm:text-sm text-[#86868B] leading-relaxed">
                  Municipal officers review detections. If an officer overrides an AI determination, an immutable justification is logged in the audit trail.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-[#262626] flex items-center gap-2 text-[11px] text-[#30D158]">
                <ShieldCheck size={13} className="text-[#30D158]" />
                <span>Audited Human Sign-off</span>
              </div>
            </div>
          </ThreeDCard>

          <ThreeDCard maxTilt={8} scaleOnHover={1.03}>
            <div className="apple-glass-card rounded-3xl p-8 h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-11 h-11 rounded-2xl bg-[#141414] border border-[#262626] flex items-center justify-center text-[#2997FF] font-mono text-xs font-semibold">
                  03
                </div>
                <h3 className="text-xl font-semibold text-[#F5F5F7]">Verified Public Status</h3>
                <p className="text-xs sm:text-sm text-[#86868B] leading-relaxed">
                  Cleanliness status instantly syncs to the citizen discovery map. If remediation is required, an automated work order dispatches to the owner.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-[#262626] flex items-center gap-2 text-[11px] text-[#A1A1A6]">
                <Radio size={13} className="text-[#2997FF]" />
                <span>Real-Time Citizen Sync</span>
              </div>
            </div>
          </ThreeDCard>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. SECTION 3 — CONNECTED CITIES: "Every location. A clearer picture." */}
      {/* ======================================================== */}
      <section className="py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#1F1F1F]">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#2997FF]">
            Spatial Distribution
          </span>
          <h2 className="text-4xl sm:text-6xl font-semibold tracking-tight text-[#F5F5F7]">
            Every location. A clearer picture.
          </h2>
          <p className="text-base sm:text-lg text-[#86868B] leading-relaxed">
            Real registered public restrooms rendered on CartoDB Dark Matter tiles with verified status badges and precision GPS telemetry.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto items-stretch">
          
          {/* Map Surface (2/3 width) */}
          <div className="lg:col-span-8 rounded-3xl overflow-hidden border border-[#262626] bg-[#0A0A0A] shadow-2xl">
            <LeafletMap
              toilets={toilets}
              selectedToilet={selectedToilet}
              onSelectToilet={(t) => setSelectedToilet(t)}
              height="480px"
            />
          </div>

          {/* Interactive Floating Location Cards (1/3 width) */}
          <div className="lg:col-span-4 apple-glass-card rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-[#262626]">
                <div className="flex items-center gap-2">
                  <MapPin size={15} className="text-[#2997FF]" />
                  <h4 className="text-sm font-semibold text-[#F5F5F7]">Live City Points</h4>
                </div>
                <span className="text-[11px] font-mono text-[#30D158] bg-[#30D158]/10 px-2 py-0.5 rounded-full border border-[#30D158]/20">
                  {toilets.length} Registered
                </span>
              </div>

              <div className="space-y-2.5 max-h-[330px] overflow-y-auto pr-1">
                {toilets.length === 0 ? (
                  <div className="py-12 text-center text-[#86868B] space-y-2">
                    <MapPin size={24} className="mx-auto text-[#6E6E73] opacity-40" />
                    <p className="text-xs font-semibold text-[#F5F5F7]">No toilets registered yet</p>
                    <p className="text-[11px] text-[#86868B]">Registered facilities will appear here with live verified status.</p>
                  </div>
                ) : (
                  toilets.slice(0, 5).map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedToilet(t)}
                      className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                        selectedToilet?.id === t.id
                          ? 'bg-[#181818] border-[#2997FF] shadow-lg'
                          : 'bg-[#121212] border-[#262626] hover:border-[#383838]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-[#F5F5F7] truncate">{t.name}</p>
                        <StatusBadge status={t.verified_status} size="sm" />
                      </div>
                      <p className="text-[11px] text-[#86868B] mt-1">{t.locality}, {t.city}</p>
                      <div className="flex items-center gap-3 text-[10px] text-[#6E6E73] font-mono mt-1.5">
                        <span>Hours: {t.opening_hours || '24x7'}</span>
                        {t.accessibility && <span className="text-[#30D158]">Handicap Access</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Link
              to="/customer"
              className="mt-4 w-full py-3 rounded-full text-center text-xs font-semibold apple-button-secondary block"
            >
              Open Full Spatial Discovery Map
            </Link>
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. SECTION 4 — THREE PORTALS: "One platform. Three powerful experiences." */}
      {/* ======================================================== */}
      <section className="py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#1F1F1F]">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#2997FF]">
            Platform Architecture
          </span>
          <h2 className="text-4xl sm:text-6xl font-semibold tracking-tight text-[#F5F5F7]">
            One platform. Three powerful experiences.
          </h2>
          <p className="text-base sm:text-lg text-[#86868B] leading-relaxed">
            Purpose-built workflows engineered for municipal officers, facility owners, and citizens.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          
          {/* Card 1: Municipal */}
          <ThreeDCard maxTilt={8} scaleOnHover={1.03}>
            <div className="apple-glass-card rounded-3xl p-8 h-full flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#141414] border border-[#262626] flex items-center justify-center text-[#2997FF] group-hover:border-[#2997FF]/50 transition-colors">
                  <ShieldCheck size={22} />
                </div>
                <h3 className="text-2xl font-semibold text-[#F5F5F7]">Municipal Authority</h3>
                <p className="text-xs sm:text-sm text-[#86868B] leading-relaxed">
                  Inspect facilities, audit AI suggestions, approve registrations, and prioritize cleaning dispatches across the municipality.
                </p>
              </div>
              <Link
                to="/municipal"
                className="mt-8 apple-button-secondary py-3 px-4 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Launch Municipal Command</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </ThreeDCard>

          {/* Card 2: Owner */}
          <ThreeDCard maxTilt={8} scaleOnHover={1.03}>
            <div className="apple-glass-card rounded-3xl p-8 h-full flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#141414] border border-[#262626] flex items-center justify-center text-[#30D158] group-hover:border-[#30D158]/50 transition-colors">
                  <Building2 size={22} />
                </div>
                <h3 className="text-2xl font-semibold text-[#F5F5F7]">Toilet Owner & Contractor</h3>
                <p className="text-xs sm:text-sm text-[#86868B] leading-relaxed">
                  Register public sanitation points, receive assigned cleaning orders, and upload verified after-cleaning photo evidence.
                </p>
              </div>
              <Link
                to="/owner"
                className="mt-8 apple-button-secondary py-3 px-4 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Launch Owner Portal</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </ThreeDCard>

          {/* Card 3: Citizen */}
          <ThreeDCard maxTilt={8} scaleOnHover={1.03}>
            <div className="apple-glass-card rounded-3xl p-8 h-full flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#141414] border border-[#262626] flex items-center justify-center text-[#2997FF] group-hover:border-[#2997FF]/50 transition-colors">
                  <Compass size={22} />
                </div>
                <h3 className="text-2xl font-semibold text-[#F5F5F7]">Public Citizen</h3>
                <p className="text-xs sm:text-sm text-[#86868B] leading-relaxed">
                  Locate verified clean restrooms within seconds via GPS. Filter by accessibility, check operating hours, and report complaints.
                </p>
              </div>
              <Link
                to="/customer"
                className="mt-8 apple-button-secondary py-3 px-4 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Launch Citizen Discovery</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </ThreeDCard>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. SECTION 5 — CLOSING EXPERIENCE: "A cleaner future starts here" */}
      {/* ======================================================== */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center border-t border-[#1F1F1F]">
        <div className="space-y-8 flex flex-col items-center">
          
          {/* Floating Luminous Mini Orb */}
          <div
            className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center animate-orb-breathe shadow-2xl"
            style={{
              background:
                'radial-gradient(circle at 40% 36%, #FFFFFF 0%, #D8EBFF 14%, rgba(41, 151, 255, 0.72) 36%, rgba(12, 28, 55, 0.85) 72%, rgba(3, 3, 3, 0.98) 100%)',
              boxShadow: '0 0 30px rgba(41, 151, 255, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.25)'
            }}
          >
            <Sparkles size={20} className="text-white" />
          </div>

          <h2 className="text-4xl sm:text-6xl font-semibold tracking-tight text-[#F5F5F7]">
            A cleaner future starts here.
          </h2>

          <p className="text-base sm:text-lg text-[#86868B] max-w-xl mx-auto leading-relaxed">
            Bring intelligence, transparency, and accountability to public toilet cleanliness.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/customer"
              className="apple-button-primary px-8 py-3.5 rounded-full text-sm font-semibold tracking-tight shadow-xl shadow-[#2997FF]/20 flex items-center gap-2 group"
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
