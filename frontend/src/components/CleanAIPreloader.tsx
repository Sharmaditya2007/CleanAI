import React, { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';

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
  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const duration = prefersReducedMotion ? 1200 : forceDurationMs;

  useEffect(() => {
    // Lock background scrolling while preloader is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Animation frame loop for 60fps high precision
    const updateProgress = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const time = timestamp - startTimeRef.current;
      const currentElapsed = Math.min(time, duration);
      setElapsed(currentElapsed);

      if (time < duration) {
        rafRef.current = requestAnimationFrame(updateProgress);
      } else {
        // Timeline reached exact duration (5.0 seconds)
        setIsExiting(true);
        setTimeout(() => {
          setIsMounted(false);
          document.body.style.overflow = originalOverflow;
          if (onComplete) onComplete();
        }, 700); // 700ms smooth fadeout transition
      }
    };

    rafRef.current = requestAnimationFrame(updateProgress);

    // Hard fail-safe timeout so the preloader can never become stuck
    const safetyTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsMounted(false);
        document.body.style.overflow = originalOverflow;
        if (onComplete) onComplete();
      }, 700);
    }, duration + 1000);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearTimeout(safetyTimer);
      document.body.style.overflow = originalOverflow;
    };
  }, [duration, onComplete]);

  if (!isMounted) return null;

  // Exact 5-second timeline progress (0 to 1)
  const progressRatio = Math.min(elapsed / duration, 1);
  const progressPercent = Math.floor(progressRatio * 100);

  // Timeline phase milestones
  // 0 - 1s (0 - 20%): Fade in from black, center light ignition, wordmark faint reveal
  const phase1Active = elapsed >= 0;
  // 1 - 2s (20% - 40%): Concentric rings rotate, scanning beam sweep begins
  const phase2Active = elapsed >= 1000;
  // 2 - 3s (40% - 60%): Electric blue light travels, particles illuminate
  const phase3Active = elapsed >= 2000;
  // 3 - 4s (60% - 80%): Rings converge into emblem, wordmark full glow
  const phase4Active = elapsed >= 3000;
  // 4 - 5s (80% - 100%): Tagline reveals, progress line completes, composition settles
  const phase5Active = elapsed >= 4000;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading Clean AI platform"
      className={`fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center select-none overflow-hidden transition-all duration-700 ease-out ${
        isExiting
          ? 'opacity-0 scale-[1.01] -translate-y-1.5 pointer-events-none'
          : 'opacity-100 scale-100 translate-y-0'
      }`}
    >
      {/* Background cinematic radial lighting */}
      <div
        className={`absolute inset-0 pointer-events-none flex items-center justify-center transition-opacity duration-1000 ${
          phase1Active ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div
          className="w-[420px] h-[420px] sm:w-[560px] sm:h-[560px] rounded-full blur-[100px] transition-all duration-1000"
          style={{
            background: phase4Active
              ? 'radial-gradient(circle, rgba(41, 151, 255, 0.16) 0%, rgba(48, 209, 88, 0.08) 45%, transparent 70%)'
              : phase2Active
              ? 'radial-gradient(circle, rgba(41, 151, 255, 0.12) 0%, transparent 65%)'
              : 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 60%)'
          }}
        />
      </div>

      {/* Center Cinematic Geometry & AI Scan Rings */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
        
        {/* SVG Concentric Rings & Light Trails */}
        <svg
          viewBox="0 0 320 320"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          <defs>
            {/* Electric Blue Gradient for Scanning Beam */}
            <linearGradient id="appleScanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2997FF" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#30D158" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#2997FF" stopOpacity="0" />
            </linearGradient>

            {/* Ambient Radial Core */}
            <radialGradient id="centerCoreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#2997FF" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#2997FF" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Central ambient glow disc */}
          <circle
            cx="160"
            cy="160"
            r="40"
            fill="url(#centerCoreGlow)"
            className={`transition-opacity duration-700 ${phase1Active ? 'opacity-100' : 'opacity-0'}`}
          />

          {/* Inner Ring (Static / Minimal) */}
          <circle
            cx="160"
            cy="160"
            r="56"
            fill="none"
            stroke="#262626"
            strokeWidth="1"
            strokeDasharray="3 6"
            className={`transition-all duration-1000 ${
              phase2Active ? 'opacity-60' : 'opacity-20'
            }`}
          />

          {/* Middle Rotating Scan Ring (1-2s & 2-3s active) */}
          <g className={phase2Active && !prefersReducedMotion ? 'animate-preloader-spin' : ''}>
            <circle
              cx="160"
              cy="160"
              r="86"
              fill="none"
              stroke="#262626"
              strokeWidth="1"
              className={`transition-opacity duration-700 ${phase2Active ? 'opacity-70' : 'opacity-0'}`}
            />
            {/* Luminous Light Arc */}
            <circle
              cx="160"
              cy="160"
              r="86"
              fill="none"
              stroke="url(#appleScanGradient)"
              strokeWidth="1.5"
              strokeDasharray="80 320"
              strokeLinecap="round"
              className={`transition-opacity duration-1000 ${
                phase3Active ? 'opacity-100' : phase2Active ? 'opacity-70' : 'opacity-0'
              }`}
            />
          </g>

          {/* Counter-Rotating Outer Reticle Ring */}
          <g className={phase2Active && !prefersReducedMotion ? 'animate-preloader-spin-reverse' : ''}>
            <circle
              cx="160"
              cy="160"
              r="116"
              fill="none"
              stroke="rgba(255, 255, 255, 0.07)"
              strokeWidth="1"
              strokeDasharray="2 12"
              className={`transition-opacity duration-700 ${phase2Active ? 'opacity-80' : 'opacity-0'}`}
            />
            {/* Subtly illuminated tick markers at cardinal points */}
            <line x1="160" y1="40" x2="160" y2="46" stroke="#2997FF" strokeWidth="1" opacity={phase3Active ? 0.9 : 0.2} />
            <line x1="160" y1="274" x2="160" y2="280" stroke="#2997FF" strokeWidth="1" opacity={phase3Active ? 0.9 : 0.2} />
            <line x1="40" y1="160" x2="46" y2="160" stroke="#30D158" strokeWidth="1" opacity={phase3Active ? 0.9 : 0.2} />
            <line x1="274" y1="160" x2="280" y2="160" stroke="#30D158" strokeWidth="1" opacity={phase3Active ? 0.9 : 0.2} />
          </g>

          {/* Sweeping Radar Beam (1-3s) */}
          {phase2Active && !phase5Active && !prefersReducedMotion && (
            <g className="animate-preloader-beam">
              <line
                x1="160"
                y1="160"
                x2="160"
                y2="46"
                stroke="url(#appleScanGradient)"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.7"
              />
            </g>
          )}

          {/* Subtle Orbiting Data Particles (2-3s) */}
          {phase3Active && (
            <>
              <circle
                cx="160"
                cy="74"
                r="2"
                fill="#2997FF"
                className="transition-all duration-500 animate-pulse"
                style={{ filter: 'drop-shadow(0 0 4px #2997FF)' }}
              />
              <circle
                cx="220"
                cy="220"
                r="1.75"
                fill="#30D158"
                className="transition-all duration-700 animate-pulse"
                style={{ filter: 'drop-shadow(0 0 4px #30D158)' }}
              />
              <circle
                cx="90"
                cy="190"
                r="1.75"
                fill="#2997FF"
                className="transition-all duration-600 animate-pulse"
                style={{ filter: 'drop-shadow(0 0 4px #2997FF)' }}
              />
            </>
          )}

          {/* Converged Circular Lock Emblem (3-4s & 4-5s) */}
          <circle
            cx="160"
            cy="160"
            r={phase4Active ? 68 : 80}
            fill="none"
            stroke={phase4Active ? 'rgba(41, 151, 255, 0.4)' : 'transparent'}
            strokeWidth="1"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Central Clean AI Emblem */}
        <div
          className={`relative z-10 flex flex-col items-center justify-center transition-all duration-1000 ${
            phase1Active ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          {/* Glowing Aperture Core */}
          <div
            className={`w-14 h-14 rounded-2xl bg-[#0D0D0D] border border-[#262626] flex items-center justify-center text-[#2997FF] shadow-xl transition-all duration-1000 ${
              phase4Active
                ? 'border-[#2997FF]/40 shadow-[0_0_30px_rgba(41,151,255,0.25)]'
                : 'border-[#262626]'
            }`}
          >
            <Sparkles
              size={24}
              className={`transition-all duration-700 ${
                phase3Active ? 'text-[#2997FF] scale-105' : 'text-[#86868B]'
              }`}
            />
          </div>
        </div>

      </div>

      {/* Typography & Brand Wordmark */}
      <div className="relative z-10 flex flex-col items-center text-center mt-4 space-y-3 px-4">
        
        {/* Wordmark (Reveals smoothly from 0-1s, sharpens by 3-4s) */}
        <div
          className={`flex items-center gap-2 transition-all duration-1000 ease-out ${
            phase1Active
              ? 'opacity-100 translate-y-0 blur-none'
              : 'opacity-0 translate-y-2 blur-xs'
          }`}
        >
          <span
            className={`text-2xl sm:text-3xl font-semibold tracking-[0.22em] text-[#F5F5F7] transition-all duration-1000 ${
              phase4Active ? 'drop-shadow-[0_0_12px_rgba(245,245,247,0.25)]' : ''
            }`}
          >
            CLEAN AI
          </span>
          <span
            className={`w-1.5 h-1.5 rounded-full bg-[#2997FF] transition-all duration-700 ${
              phase3Active
                ? 'opacity-100 shadow-[0_0_8px_#2997FF]'
                : 'opacity-30'
            }`}
          />
        </div>

        {/* Tagline (Appears smoothly during 4-5s) */}
        <div className="h-6 flex items-center justify-center">
          <p
            className={`text-xs sm:text-sm font-normal text-[#86868B] tracking-[0.14em] transition-all duration-700 ease-out ${
              phase5Active
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-2 pointer-events-none'
            }`}
          >
            Smarter Toilets. Cleaner Cities.
          </p>
        </div>

      </div>

      {/* Minimal Apple-Style Progress Line */}
      <div className="relative z-10 mt-10 flex flex-col items-center space-y-2.5">
        <div className="w-56 sm:w-64 h-[1.5px] bg-[#161616] rounded-full overflow-hidden border border-[#222222]">
          <div
            className="h-full bg-gradient-to-r from-[#2997FF] via-[#2997FF] to-[#30D158] transition-all duration-100 ease-linear rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between w-56 sm:w-64 text-[10px] font-mono text-[#6E6E73] tracking-widest uppercase">
          <span>Neural Engine</span>
          <span>{progressPercent}%</span>
        </div>
      </div>

    </div>
  );
};
