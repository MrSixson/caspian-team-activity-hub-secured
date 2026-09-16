import React from 'react';

interface AnimatedBackgroundProps {
  particlesFx?: boolean;
  themeMode?: 'dark' | 'midnight' | 'emerald' | 'light';
  rgbFx?: boolean;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  particlesFx = true,
  themeMode = 'dark',
  rgbFx = true,
}) => {
  // Background color based on theme
  const getBgClass = () => {
    if (themeMode === 'light') return 'bg-slate-100 bg-gradient-to-b from-slate-100 via-sky-50/50 to-slate-200';
    if (themeMode === 'midnight') return 'bg-slate-950 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950';
    if (themeMode === 'emerald') return 'bg-slate-950 bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950';
    return 'bg-slate-950';
  };

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden -z-10 select-none transition-all duration-700 ${getBgClass()}`}>
      {/* Dynamic Animated Aurora Orbs */}
      {particlesFx && rgbFx && (
        <>
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] sm:w-[800px] sm:h-[800px] bg-sky-600/15 rounded-full blur-[160px] animate-pulseGlow animate-floatSlow" />
          <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] bg-indigo-600/15 rounded-full blur-[150px] animate-pulseGlow animate-floatMedium" />
          <div className="absolute -bottom-40 left-1/4 w-[600px] h-[600px] sm:w-[850px] sm:h-[850px] bg-violet-700/10 rounded-full blur-[180px] animate-pulseGlow animate-floatSlow" />
          <div className="absolute top-2/3 left-10 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[140px] animate-floatMedium" />
        </>
      )}

      {/* Cyber Grid Network Background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Scanning Laser Beam Effect */}
      {particlesFx && (
        <div className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-sky-500/5 to-transparent animate-scanline pointer-events-none" />
      )}

      {/* Ambient Floating Particle Dust Nodes */}
      {particlesFx && (
        <div className="absolute inset-0">
          <div className="absolute top-[15%] left-[20%] w-1.5 h-1.5 rounded-full bg-sky-400/50 blur-[1px] animate-floatSlow" />
          <div className="absolute top-[35%] left-[80%] w-2 h-2 rounded-full bg-indigo-400/40 blur-[1px] animate-floatMedium" />
          <div className="absolute top-[65%] left-[15%] w-1 h-1 rounded-full bg-cyan-300/60 blur-[0.5px] animate-floatSlow" />
          <div className="absolute top-[80%] left-[70%] w-2.5 h-2.5 rounded-full bg-purple-400/30 blur-[1.5px] animate-floatMedium" />
          <div className="absolute top-[45%] left-[45%] w-1.5 h-1.5 rounded-full bg-amber-300/40 blur-[1px] animate-floatSlow" />
          <div className="absolute top-[10%] left-[60%] w-2 h-2 rounded-full bg-emerald-400/40 blur-[1px] animate-floatMedium" />
        </div>
      )}

      {/* Vignette Overlay for Depth */}
      <div className="absolute inset-0 bg-radial-vignette opacity-60" />
    </div>
  );
};
