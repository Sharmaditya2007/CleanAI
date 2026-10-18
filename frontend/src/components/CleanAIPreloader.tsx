import React, { useState, useEffect, useRef, useMemo } from 'react';

interface CleanAIPreloaderProps {
  onComplete?: () => void;
  forceDurationMs?: number;
}

export const CleanAIPreloader: React.FC<CleanAIPreloaderProps> = ({
  onComplete,
  forceDurationMs = 5000
}) => {
  const [elapsed, setElapsed] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [isMounted, setIsMounted] = useState(true);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // Check prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const duration = prefersReducedMotion ? 1200 : forceDurationMs;

  // Generate deterministic ambient star dust particles
  const particles = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      x: (i * 37) % 96 + 2,
      y: (i * 53) % 92 + 4,
      size: (i % 3 === 0 ? 2 : 1.2),
      opacity: (i % 4 === 0 ? 0.65 : 0.35),
      pulseDelay: (i * 200) % 2000
    }));
  }, []);

  useEffect(() => {
    // Lock background scrolling while preloader is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Animation frame loop for 60 FPS precision
    const updateProgress = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const time = timestamp - startTimeRef.current;
      const currentElapsed = Math.min(time, duration);
      setElapsed(currentElapsed);

      if (time < duration) {
        rafRef.current = requestAnimationFrame(updateProgress);
      } else {
        // Reached exact duration (5.0 seconds) -> initiate smooth cinematic exit
        setIsExiting(true);
        setTimeout(() => {
          setIsMounted(false);
          document.body.style.overflow = originalOverflow;
          if (onComplete) onComplete();
        }, 800);
      }
    };

    rafRef.current = requestAnimationFrame(updateProgress);

    // Hard fail-safe timeout so the preloader can never remain stuck
    const safetyTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsMounted(false);
        document.body.style.overflow = originalOverflow;
        if (onComplete) onComplete();
      }, 800);
    }, duration + 1200);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearTimeout(safetyTimer);
      document.body.style.overflow = originalOverflow;
    };
  }, [duration, onComplete]);

  if (!isMounted) return null;

  // Normalized progress percentage (0 - 100)
  const progressPercent = Math.min(Math.round((elapsed / duration) * 100), 100);

  // Timeline Phase Calculations
  // Phase 1 (0.0 - 0.8s): The Spark — tiny luminous seed point in total darkness
  const isSparkPhase = elapsed < 800;
  const sparkProgress = Math.min(elapsed / 800, 1);

  // Phase 2 (0.8 - 1.8s): Formation — spark expands into 3D glass orb with internal reflections
  const isFormationPhase = elapsed >= 800;
  const formationProgress = isFormationPhase ? Math.min((elapsed - 800) / 1000, 1) : 0;

  // Phase 3 (1.8 - 2.8s): Intelligence — thin orbital rings emerge and move gracefully
  const isIntelligencePhase = elapsed >= 1800;
  const orbitOpacity = isIntelligencePhase ? Math.min((elapsed - 1800) / 800, 1) : 0;

  // Phase 4 (2.8 - 3.8s): Identity — CLEAN AI wordmark appears letter-by-letter
  const letters = [
    { char: 'C', delay: 2800 },
    { char: 'L', delay: 2920 },
    { char: 'E', delay: 3040 },
    { char: 'A', delay: 3160 },
    { char: 'N', delay: 3280 },
    { char: ' ', delay: 3400, isSpace: true },
    { char: 'A', delay: 3480, isAccent: true },
    { char: 'I', delay: 3600, isAccent: true }
  ];

  // Phase 5 (3.8 - 4.5s): Signature — tagline appears, sheen sweep passes across orb, pulse wave expands
  const isSignaturePhase = elapsed >= 3800;
  const signatureProgress = isSignaturePhase ? Math.min((elapsed - 3800) / 700, 1) : 0;

  // Phase 6 (4.5 - 5.0s): Settle & Ready
  const isSettling = elapsed >= 4500;

  // Real-time AI System Status Telemetry
  let statusTelemetry = 'INITIALIZING NEURAL VISION ENGINE [v11.0]';
  if (elapsed >= 1400 && elapsed < 2600) {
    statusTelemetry = 'CALIBRATING 16 SANITATION CLASS TENSORS';
  } else if (elapsed >= 2600 && elapsed < 3800) {
    statusTelemetry = 'SYNCHRONIZING CIVIC SPATIAL GRID // DELHI';
  } else if (elapsed >= 3800) {
    statusTelemetry = 'CLEAN AI 1.0 OPERATIONAL';
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Clean AI — Intelligence Emerges From Darkness"
      className={`fixed inset-0 z-[9999] bg-[#020202] flex flex-col items-center justify-center select-none overflow-hidden transition-all duration-800 ease-out ${
        isExiting
          ? 'opacity-0 scale-[0.98] -translate-y-2 pointer-events-none'
          : 'opacity-100 scale-100 translate-y-0'
      }`}
    >
      {/* 1. Deep Space Floating Cosmic Dust Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute rounded-full bg-white transition-opacity duration-1000"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: isFormationPhase ? p.opacity : 0.1,
              boxShadow: p.size > 1.5 ? '0 0 6px rgba(255,255,255,0.8)' : 'none'
            }}
          />
        ))}
      </div>

      {/* 2. Silver-Blue Ambient Atmospheric Nebula */}
      <div
        className="absolute inset-0 pointer-events-none flex items-center justify-center transition-opacity duration-1000"
        style={{
          opacity: isFormationPhase ? (isSettling ? 0.55 : 0.85) : 0.2
        }}
      >
        <div
          className="w-[500px] h-[500px] sm:w-[650px] sm:h-[650px] rounded-full blur-[140px] transition-all duration-1000"
          style={{
            background: isSignaturePhase
              ? 'radial-gradient(circle, rgba(41, 151, 255, 0.18) 0%, rgba(48, 209, 88, 0.08) 45%, transparent 70%)'
              : 'radial-gradient(circle, rgba(41, 151, 255, 0.12) 0%, rgba(180, 205, 237, 0.04) 40%, transparent 65%)'
          }}
        />
      </div>

      {/* 3. Central Cinematic Orb & Spatial Mechanics */}
      <div className="relative w-72 h-72 sm:w-84 sm:h-84 flex items-center justify-center">
        
        {/* SPARK PHASE (0.0s - 0.8s): Luminous Point of Light */}
        {isSparkPhase && (
          <div
            className="absolute z-30 flex items-center justify-center transition-opacity duration-300"
            style={{ opacity: sparkProgress }}
          >
            {/* Horizontal Anamorphic Ray */}
            <div className="absolute w-44 sm:w-56 h-[1px] bg-gradient-to-r from-transparent via-[#2997FF] to-transparent shadow-[0_0_8px_#2997FF]" />
            <div className="absolute w-24 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent" />
            
            {/* Halo */}
            <div
              className="rounded-full bg-white blur-md"
              style={{
                width: `${14 + sparkProgress * 32}px`,
                height: `${14 + sparkProgress * 32}px`,
                opacity: 0.85
              }}
            />
            {/* White Core */}
            <div
              className="absolute w-2 h-2 rounded-full bg-white shadow-[0_0_16px_#ffffff]"
              style={{
                transform: `scale(${0.5 + sparkProgress * 0.9})`
              }}
            />
          </div>
        )}

        {/* HERO GLASS ORB & 3D ORBITAL PATHS (0.8s - 5.0s) */}
        {isFormationPhase && (
          <div
            className="relative flex items-center justify-center transition-all duration-1000 ease-out"
            style={{
              opacity: formationProgress,
              transform: `scale(${0.35 + formationProgress * 0.65})`
            }}
          >
            {/* Anamorphic Horizontal Flare (breathes subtly across background) */}
            <div className="absolute w-[340px] sm:w-[420px] h-[1.5px] bg-gradient-to-r from-transparent via-[#2997FF]/50 to-transparent pointer-events-none animate-anamorphic" />

            {/* Pulse Wave (triggers at Signature Phase 3.8s) */}
            {isSignaturePhase && (
              <div className="absolute w-40 h-40 rounded-full border border-[rgba(41,151,255,0.45)] pointer-events-none animate-pulse-wave" />
            )}

            {/* Circular LIDAR Scanner Sweep */}
            {isIntelligencePhase && (
              <div
                className="absolute w-48 h-48 sm:w-52 sm:h-52 rounded-full pointer-events-none transition-opacity duration-700 animate-lidar-sweep"
                style={{
                  opacity: orbitOpacity * 0.7,
                  background: 'conic-gradient(from 0deg, rgba(41, 151, 255, 0.3) 0deg, rgba(41, 151, 255, 0) 90deg, transparent 360deg)'
                }}
              />
            )}

            {/* Precision Reticle Aperture Ring */}
            {isIntelligencePhase && (
              <div
                className="absolute w-44 h-44 sm:w-48 sm:h-48 rounded-full border border-[rgba(41,151,255,0.25)] border-dashed pointer-events-none transition-opacity duration-1000"
                style={{ opacity: orbitOpacity * 0.6 }}
              />
            )}

            {/* 3D Orbital Paths */}
            {isIntelligencePhase && (
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-1000"
                style={{ opacity: orbitOpacity }}
              >
                {/* Orbit 1: Silver elliptical path with beacon */}
                <div className="absolute w-56 h-56 sm:w-64 sm:h-64 rounded-full border border-[rgba(255,255,255,0.14)] animate-orbit-1 flex items-center justify-center">
                  <div className="absolute -top-1 w-2 h-2 rounded-full bg-white shadow-[0_0_10px_#ffffff]" />
                </div>

                {/* Orbit 2: Tilted electric blue orbit */}
                <div className="absolute w-52 h-52 sm:w-60 sm:h-60 rounded-full border border-[rgba(41,151,255,0.22)] animate-orbit-2 flex items-center justify-center">
                  <div className="absolute -left-1 w-1.5 h-1.5 rounded-full bg-[#2997FF] shadow-[0_0_8px_#2997FF]" />
                </div>

                {/* Orbit 3: Wide equatorial orbit with emerald beacon */}
                <div className="absolute w-60 h-60 sm:w-68 sm:h-68 rounded-full border border-[rgba(48,209,88,0.12)] animate-orbit-3 flex items-center justify-center">
                  <div className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-[#30D158] shadow-[0_0_10px_#30D158]" />
                </div>
              </div>
            )}

            {/* The Ultra-Refractive Glass Orb */}
            <div
              className={`relative z-10 w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden transition-all duration-1000 ${
                isIntelligencePhase && !prefersReducedMotion ? 'animate-orb-breathe' : ''
              }`}
              style={{
                background:
                  'radial-gradient(circle at 38% 34%, #FFFFFF 0%, #E2F0FF 14%, rgba(41, 151, 255, 0.78) 36%, rgba(10, 26, 52, 0.90) 72%, rgba(2, 2, 2, 0.99) 100%)',
                boxShadow:
                  'inset 0 0 28px rgba(255, 255, 255, 0.45), inset 0 0 50px rgba(41, 151, 255, 0.38), 0 0 40px rgba(41, 151, 255, 0.32)',
                border: '1.2px solid rgba(255, 255, 255, 0.28)'
              }}
            >
              {/* Secondary Bottom-Right Emerald Refraction */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle at 74% 76%, rgba(48, 209, 88, 0.22) 0%, transparent 48%)'
                }}
              />

              {/* Top-Left Specular Glass Highlight */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(ellipse at 32% 22%, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.44) 28%, transparent 60%)'
                }}
              />

              {/* Bottom Caustic Ground Bounce Light */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(ellipse at 50% 92%, rgba(180, 220, 255, 0.4) 0%, transparent 55%)'
                }}
              />

              {/* Fluid Sheen Sweep (triggers at Signature Phase 3.8s) */}
              {isSignaturePhase && (
                <div className="absolute inset-0 pointer-events-none animate-sheen-sweep">
                  <div className="w-16 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent blur-xs transform -skew-x-12" />
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* 4. TYPOGRAPHY & BRAND WORDMARK */}
      <div className="relative z-10 flex flex-col items-center text-center mt-6 space-y-3 px-4">
        
        {/* CLEAN AI Wordmark: Letter-by-Letter Reveal (2.8s - 3.8s) */}
        <div className="flex items-center h-10 tracking-[0.28em] text-2xl sm:text-3xl font-semibold">
          {letters.map((item, index) => {
            const hasStarted = elapsed >= item.delay;
            const letterProgress = hasStarted
              ? Math.min((elapsed - item.delay) / 260, 1)
              : 0;

            if (item.isSpace) {
              return <span key={index} className="w-3" />;
            }

            return (
              <span
                key={index}
                className={`inline-block transition-all duration-300 ease-out ${
                  item.isAccent
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#2997FF] to-[#30D158] font-bold'
                    : 'text-[#F5F5F7]'
                }`}
                style={{
                  opacity: letterProgress,
                  filter: `blur(${(1 - letterProgress) * 6}px)`,
                  transform: `translateY(${(1 - letterProgress) * 4}px)`,
                  textShadow:
                    isSignaturePhase
                      ? item.isAccent
                        ? '0 0 20px rgba(41, 151, 255, 0.45)'
                        : '0 0 16px rgba(255, 255, 255, 0.35)'
                      : 'none'
                }}
              >
                {item.char}
              </span>
            );
          })}
        </div>

        {/* Tagline: Understated Elegance (3.8s - 4.5s) */}
        <div className="h-5 flex items-center justify-center">
          <p
            className="text-xs sm:text-sm font-normal text-[#86868B] tracking-[0.22em] transition-all duration-700 ease-out"
            style={{
              opacity: isSignaturePhase ? signatureProgress : 0,
              filter: `blur(${(1 - signatureProgress) * 4}px)`,
              transform: `translateY(${(1 - signatureProgress) * 3}px)`
            }}
          >
            Smarter Toilets. Cleaner Cities.
          </p>
        </div>

      </div>

      {/* 5. Minimalist Apple-Style Progress & AI Telemetry Footer */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-72 sm:w-80 flex flex-col items-center space-y-2.5 z-10 pointer-events-none">
        
        {/* Real-time Status Text */}
        <div className="flex items-center justify-between w-full text-[10px] font-mono tracking-wider text-[#6E6E73]">
          <span className="truncate pr-2 text-[#86868B]">{statusTelemetry}</span>
          <span className="text-[#2997FF] font-semibold">{progressPercent}%</span>
        </div>

        {/* Laser Hairline Progress Track */}
        <div className="relative w-full h-[1.5px] bg-[#1A1A1A] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#2997FF] via-[#5AC8FA] to-[#30D158] transition-all duration-100 ease-linear shadow-[0_0_8px_#2997FF]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

      </div>

    </div>
  );
};
