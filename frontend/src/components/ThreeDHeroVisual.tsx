import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, MapPin, ShieldCheck, Cpu } from 'lucide-react';
import { Toilet } from '../types';

interface ThreeDHeroVisualProps {
  primaryToilet?: Toilet | null;
  classesCount?: number | null;
}

export const ThreeDHeroVisual: React.FC<ThreeDHeroVisualProps> = ({
  primaryToilet,
  classesCount
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX;
      const clientY = e.clientY;

      const normX = (clientX - (rect.left + rect.width / 2)) / (window.innerWidth / 2);
      const normY = (clientY - (rect.top + rect.height / 2)) / (window.innerHeight / 2);

      const clampedX = Math.max(-1, Math.min(1, normX));
      const clampedY = Math.max(-1, Math.min(1, normY));

      setMousePos({ x: clampedX, y: clampedY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const rotX = -mousePos.y * 14;
  const rotY = mousePos.x * 18;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[460px] sm:h-[540px] lg:h-[600px] flex items-center justify-center select-none"
      style={{
        perspective: '1200px'
      }}
    >
      {/* 3D Transform Stage */}
      <div
        className="relative w-full h-full flex items-center justify-center transition-transform duration-300 ease-out"
        style={{
          transform: `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`,
          transformStyle: 'preserve-3d'
        }}
      >
        
        {/* Layer 0 (Back): Ambient Volumetric Glow */}
        <div
          className="absolute w-[380px] h-[380px] sm:w-[480px] sm:h-[480px] rounded-full blur-[100px] pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(41, 151, 255, 0.18) 0%, rgba(48, 209, 88, 0.06) 45%, transparent 70%)',
            transform: 'translateZ(-80px)'
          }}
        />

        {/* Layer 1: Abstract Perspective 3D City Grid Floor */}
        <div
          className="absolute bottom-6 w-[340px] sm:w-[460px] h-[220px] rounded-3xl border border-[#262626]/60 pointer-events-none overflow-hidden"
          style={{
            transform: 'rotateX(68deg) translateZ(-60px)',
            background:
              'radial-gradient(circle at 50% 50%, rgba(41, 151, 255, 0.08) 0%, rgba(5, 5, 5, 0.95) 75%)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.9), inset 0 0 40px rgba(41,151,255,0.1)'
          }}
        >
          {/* Grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)] bg-[size:28px_28px] opacity-40" />
          {/* Spatial node beacons */}
          <div className="absolute top-[35%] left-[25%] w-2 h-2 rounded-full bg-[#30D158] shadow-[0_0_10px_#30D158] animate-ping" />
          <div className="absolute top-[60%] right-[30%] w-2 h-2 rounded-full bg-[#2997FF] shadow-[0_0_10px_#2997FF] animate-ping" />
        </div>

        {/* Layer 2: 3D Orbital Metallic Rings */}
        <div
          className="absolute w-72 h-72 sm:w-88 sm:h-88 rounded-full border border-[rgba(255,255,255,0.14)] pointer-events-none animate-orbit-1"
          style={{
            transformStyle: 'preserve-3d'
          }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_10px_#ffffff]" />
        </div>

        <div
          className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full border border-[rgba(41,151,255,0.22)] pointer-events-none animate-orbit-2"
          style={{
            transformStyle: 'preserve-3d'
          }}
        >
          <div className="absolute -bottom-1 left-1/3 w-1.5 h-1.5 rounded-full bg-[#2997FF] shadow-[0_0_12px_#2997FF]" />
        </div>

        {/* Layer 3: Central 3D Floating Glass Orb (Clean AI Neural Engine) */}
        <div
          className="relative z-10 w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden flex items-center justify-center animate-orb-breathe cursor-pointer group"
          style={{
            transform: 'translateZ(40px)',
            background:
              'radial-gradient(circle at 38% 34%, #FFFFFF 0%, #D8EBFF 15%, rgba(41, 151, 255, 0.78) 38%, rgba(12, 28, 55, 0.88) 72%, rgba(3, 3, 3, 0.98) 100%)',
            boxShadow:
              'inset 0 0 28px rgba(255, 255, 255, 0.45), inset 0 0 55px rgba(41, 151, 255, 0.38), 0 0 45px rgba(41, 151, 255, 0.35)',
            border: '1.5px solid rgba(255, 255, 255, 0.28)'
          }}
        >
          {/* Specular Highlight Crescent */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at 32% 22%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.4) 28%, transparent 60%)'
            }}
          />

          {/* Secondary Caustic Teal Bounce */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 72% 76%, rgba(48, 209, 88, 0.22) 0%, transparent 48%)'
            }}
          />

          {/* Gliding Sheen Sweep on Hover or Auto */}
          <div className="absolute inset-0 pointer-events-none animate-sheen-sweep opacity-75">
            <div className="w-16 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent blur-xs transform -skew-x-12" />
          </div>

          {/* Center Clean AI Neural Lens */}
          <div className="relative z-20 flex flex-col items-center justify-center">
            <Sparkles size={28} className="text-[#F5F5F7] drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
          </div>
        </div>

        {/* Layer 4: Real Dynamic Telemetry Panels */}
        
        {/* Panel 1: Live AI Vision Telemetry (Top-Left, translateZ = 75px) */}
        <div
          className="absolute -top-2 left-2 sm:left-4 z-20 p-3 sm:p-3.5 rounded-2xl bg-[#0D0D0D]/85 backdrop-blur-xl border border-[#262626] shadow-2xl transition-transform duration-300 pointer-events-none flex items-center gap-3"
          style={{
            transform: `translateZ(75px) rotateY(${-rotY * 0.4}deg)`,
            boxShadow: '0 20px 40px rgba(0,0,0,0.8), 0 0 1px 1px rgba(255,255,255,0.08)'
          }}
        >
          <div className="w-8 h-8 rounded-xl bg-[#2997FF]/10 text-[#2997FF] flex items-center justify-center border border-[#2997FF]/20">
            <Cpu size={16} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] animate-pulse" />
              <p className="text-[10px] font-mono uppercase tracking-wider text-[#86868B]">YOLO Vision Core</p>
            </div>
            <p className="text-xs font-semibold text-[#F5F5F7]">
              {classesCount ? `${classesCount} Trained Classes` : 'Inference Pipeline Active'}
            </p>
          </div>
        </div>

        {/* Panel 2: Verified Sanitation Status (Bottom-Right, translateZ = 95px) */}
        <div
          className="absolute bottom-10 right-2 sm:right-4 z-20 p-3 sm:p-3.5 rounded-2xl bg-[#0D0D0D]/85 backdrop-blur-xl border border-[#262626] shadow-2xl transition-transform duration-300 pointer-events-none flex items-center gap-3 max-w-[210px]"
          style={{
            transform: `translateZ(95px) rotateY(${-rotY * 0.5}deg)`,
            boxShadow: '0 20px 40px rgba(0,0,0,0.8), 0 0 1px 1px rgba(48,209,88,0.15)'
          }}
        >
          <div className="w-8 h-8 rounded-xl bg-[#30D158]/10 text-[#30D158] flex items-center justify-center border border-[#30D158]/20 shrink-0">
            <ShieldCheck size={16} />
          </div>
          <div className="text-left overflow-hidden">
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#30D158]">
              {primaryToilet ? primaryToilet.verified_status : 'Sanitation Grid'}
            </p>
            <p className="text-xs font-semibold text-[#F5F5F7] truncate">
              {primaryToilet ? primaryToilet.name : 'Real-time Telemetry'}
            </p>
          </div>
        </div>

        {/* Panel 3: Spatial GPS Pin (Top-Right, translateZ = 50px) */}
        <div
          className="absolute top-8 right-4 sm:right-10 z-20 px-3 py-1.5 rounded-full bg-[#141414]/90 backdrop-blur-md border border-[#262626] flex items-center gap-2 text-[11px] font-mono text-[#A1A1A6] pointer-events-none"
          style={{
            transform: `translateZ(50px) rotateX(${-rotX * 0.3}deg)`
          }}
        >
          <MapPin size={12} className="text-[#2997FF]" />
          <span>
            {primaryToilet
              ? `${primaryToilet.latitude.toFixed(4)}° N, ${primaryToilet.longitude.toFixed(4)}° E`
              : 'Delhi Spatial Network'}
          </span>
        </div>

        {/* Floating 3D Depth Markers */}
        <div
          className="absolute top-1/4 left-8 w-2 h-2 rounded-full bg-[#2997FF] blur-[1px] shadow-[0_0_8px_#2997FF]"
          style={{ transform: 'translateZ(110px)' }}
        />
        <div
          className="absolute bottom-1/3 left-14 w-1.5 h-1.5 rounded-full bg-[#30D158] blur-[1px] shadow-[0_0_8px_#30D158]"
          style={{ transform: 'translateZ(85px)' }}
        />

      </div>
    </div>
  );
};
