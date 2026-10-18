import React, { useState, useEffect, useRef } from 'react';

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
        }, 800); // 800ms ultra-smooth exit transition
      }
    };

    rafRef.current = requestAnimationFrame(updateProgress);

    // Hard fail-safe timeout so the preloader can NEVER remain stuck
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
    { char: 'A', delay: 3480 },
    { char: 'I', delay: 3600 }
  ];

  // Phase 5 (3.8 - 4.5s): Signature — tagline appears, sheen sweep passes across orb, pulse wave expands
  const isSignaturePhase = elapsed >= 3800;
  const signatureProgress = isSignaturePhase ? Math.min((elapsed - 3800) / 700, 1) : 0;

  // Phase 6 (4.5 - 5.0s): Settle & Reveal Preparation
  const isSettling = elapsed >= 4500;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Clean AI — Intelligence Emerges From Darkness"
      className={`fixed inset-0 z-[9999] bg-[#030303] flex flex-col items-center justify-center select-none overflow-hidden transition-all duration-800 ease-out ${
        isExiting
          ? 'opacity-0 scale-[0.98] -translate-y-2 pointer-events-none'
          : 'opacity-100 scale-100 translate-y-0'
      }`}
    >
      {/* Extremely subtle silver-blue atmospheric ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none flex items-center justify-center transition-opacity duration-1000"
        style={{
          opacity: isFormationPhase ? (isSettling ? 0.45 : 0.75) : 0.15
        }}
      >
        <div
          className="w-[450px] h-[450px] sm:w-[600px] sm:h-[600px] rounded-full blur-[120px] transition-all duration-1000"
          style={{
            background: isSignaturePhase
              ? 'radial-gradient(circle, rgba(41, 151, 255, 0.14) 0%, rgba(48, 209, 88, 0.05) 45%, transparent 70%)'
              : 'radial-gradient(circle, rgba(41, 151, 255, 0.09) 0%, rgba(180, 205, 237, 0.03) 40%, transparent 65%)'
          }}
        />
      </div>

      {/* Central Visual Composition */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
        
        {/* SPARK PHASE (0.0s - 0.8s): Luminous Point of Light */}
        {isSparkPhase && (
          <div
            className="absolute z-20 flex items-center justify-center transition-opacity duration-300"
            style={{ opacity: sparkProgress }}
          >
            {/* Soft Ambient Halo */}
            <div
              className="rounded-full bg-white blur-md"
              style={{
                width: `${12 + sparkProgress * 28}px`,
                height: `${12 + sparkProgress * 28}px`,
                opacity: 0.8
              }}
            />
            {/* Intense White Core */}
            <div
              className="absolute w-2 h-2 rounded-full bg-white shadow-[0_0_14px_#ffffff]"
              style={{
                transform: `scale(${0.4 + sparkProgress * 0.8})`
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
            {/* Luminous Pulse Wave (triggers at Signature Phase 3.8s) */}
            {isSignaturePhase && (
              <div className="absolute w-36 h-36 rounded-full border border-[rgba(41,151,255,0.45)] pointer-events-none animate-pulse-wave" />
            )}

            {/* 3D Orbital Paths */}
            {isIntelligencePhase && (
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-1000"
                style={{ opacity: orbitOpacity }}
              >
                {/* Orbit 1: Elliptical path with luminous beacon */}
                <div className="absolute w-56 h-56 sm:w-64 sm:h-64 rounded-full border border-[rgba(255,255,255,0.12)] animate-orbit-1 flex items-center justify-center">
                  <div className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
                </div>

                {/* Orbit 2: Counter-rotating tilted orbit */}
                <div className="absolute w-52 h-52 sm:w-60 sm:h-60 rounded-full border border-[rgba(41,151,255,0.18)] animate-orbit-2" />

                {/* Orbit 3: Wide equatorial orbit with teal/blue beacon */}
                <div className="absolute w-60 h-60 sm:w-68 sm:h-68 rounded-full border border-[rgba(255,255,255,0.06)] animate-orbit-3 flex items-center justify-center">
                  <div className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-[#2997FF] shadow-[0_0_10px_#2997FF]" />
                </div>
              </div>
            )}

            {/* The Glass Orb */}
            <div
              className={`relative w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden transition-all duration-1000 ${
                isIntelligencePhase && !prefersReducedMotion ? 'animate-orb-breathe' : ''
              }`}
              style={{
                background:
                  'radial-gradient(circle at 40% 36%, #FFFFFF 0%, #D8EBFF 14%, rgba(41, 151, 255, 0.72) 36%, rgba(12, 28, 55, 0.85) 72%, rgba(3, 3, 3, 0.98) 100%)',
                boxShadow:
                  'inset 0 0 24px rgba(255, 255, 255, 0.4), inset 0 0 45px rgba(41, 151, 255, 0.35), 0 0 35px rgba(41, 151, 255, 0.28)',
                border: '1px solid rgba(255, 255, 255, 0.22)'
              }}
            >
              {/* Secondary Bottom-Right Teal Refraction */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle at 74% 76%, rgba(48, 209, 88, 0.18) 0%, transparent 48%)'
                }}
              />

              {/* Top-Left Specular Glass Highlight */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(ellipse at 32% 24%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.42) 28%, transparent 60%)'
                }}
              />

              {/* Bottom Caustic Ground Bounce Light */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(ellipse at 50% 92%, rgba(180, 220, 255, 0.35) 0%, transparent 55%)'
                }}
              />

              {/* Fluid Sheen Sweep (triggers at Signature Phase 3.8s) */}
              {isSignaturePhase && (
                <div className="absolute inset-0 pointer-events-none animate-sheen-sweep">
                  <div className="w-16 h-full bg-gradient-to-r from-transparent via-white/45 to-transparent blur-xs transform -skew-x-12" />
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* TYPOGRAPHY & BRAND WORDMARK */}
      <div className="relative z-10 flex flex-col items-center text-center mt-6 space-y-3 px-4">
        
        {/* CLEAN AI Wordmark: Letter-by-Letter Reveal (2.8s - 3.8s) */}
        <div className="flex items-center h-9 tracking-[0.26em] text-2xl sm:text-3xl font-semibold text-[#F5F5F7]">
          {letters.map((item, index) => {
            const hasStarted = elapsed >= item.delay;
            const letterProgress = hasStarted
              ? Math.min((elapsed - item.delay) / 280, 1)
              : 0;

            if (item.isSpace) {
              return <span key={index} className="w-3" />;
            }

            return (
              <span
                key={index}
                className="inline-block transition-all duration-300 ease-out"
                style={{
                  opacity: letterProgress,
                  filter: `blur(${(1 - letterProgress) * 7}px)`,
                  transform: `translateY(${(1 - letterProgress) * 4}px)`,
                  textShadow:
                    isSignaturePhase
                      ? '0 0 16px rgba(255, 255, 255, 0.35), 0 0 24px rgba(41, 151, 255, 0.25)'
                      : 'none'
                }}
              >
                {item.char}
              </span>
            );
          })}
        </div>

        {/* Tagline: Understated Elegance (3.8s - 4.5s) */}
        <div className="h-6 flex items-center justify-center">
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

    </div>
  );
};
