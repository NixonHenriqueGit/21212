import React, { useState, useEffect } from 'react';

interface CircularLoaderProps {
  label?: string;
  subtitle?: string;
  expectedDurationMs?: number;
  size?: 'sm' | 'md' | 'lg' | 'fullscreen';
  theme?: 'dark' | 'light' | 'auto';
}

export default function CircularLoader({
  label = 'CARREGANDO MÓDULO...',
  subtitle = 'Preparando interface e carregando dados...',
  expectedDurationMs = 1400,
  size = 'md',
  theme = 'auto',
}: CircularLoaderProps) {
  const [progress, setProgress] = useState(12);
  const [remainingSec, setRemainingSec] = useState<number>(() => {
    return Math.max(0.2, Number((expectedDurationMs / 1000).toFixed(1)));
  });

  useEffect(() => {
    const startTime = Date.now();
    const totalDuration = expectedDurationMs;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const fraction = Math.min(elapsed / totalDuration, 1);

      // Easing curve: fast start, gradual deceleration towards 98%
      // Using logarithmic/exponential ease-out so it never feels stuck
      const easedProgress = Math.min(
        99,
        Math.round(15 + 84 * (1 - Math.pow(1 - fraction, 2.2)))
      );

      setProgress(easedProgress);

      const msLeft = Math.max(0, totalDuration - elapsed);
      const secLeft = Math.max(0.1, Number((msLeft / 1000).toFixed(1)));
      setRemainingSec(secLeft);

      if (fraction >= 1) {
        clearInterval(interval);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [expectedDurationMs]);

  // Dimension calculations based on size
  const dim = size === 'sm' ? 80 : size === 'lg' || size === 'fullscreen' ? 140 : 110;
  const strokeWidth = size === 'sm' ? 6 : size === 'lg' || size === 'fullscreen' ? 9 : 8;
  const radius = (dim - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const isFullscreen = size === 'fullscreen';

  return (
    <div
      className={`flex flex-col items-center justify-center select-none ${
        isFullscreen ? 'min-h-screen w-full bg-slate-950 text-slate-100 p-6' : 'py-12 px-6 w-full min-h-[360px]'
      }`}
    >
      {/* SVG Circular Progress Ring */}
      <div className="relative flex items-center justify-center" style={{ width: dim, height: dim }}>
        {/* Ambient Glow */}
        <div
          className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl pointer-events-none transition-opacity duration-300"
          style={{ opacity: progress / 100 }}
        />

        <svg className="w-full h-full -rotate-90 transform" viewBox={`0 0 ${dim} ${dim}`}>
          {/* Background Track */}
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            className="stroke-slate-200 dark:stroke-slate-800"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Animated Progress Fill */}
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            className="stroke-blue-500 transition-all duration-150 ease-out"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              filter: 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.6))',
            }}
          />
        </svg>

        {/* Center Percentage Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-black tracking-tight text-slate-800 dark:text-white ${
              size === 'sm' ? 'text-sm' : size === 'lg' || size === 'fullscreen' ? 'text-2xl' : 'text-xl'
            }`}
          >
            {progress}
            <span className="text-xs font-bold text-blue-500 ml-0.5">%</span>
          </span>
        </div>
      </div>

      {/* Progress Label and Status */}
      <div className="mt-5 text-center flex flex-col items-center gap-1.5 max-w-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs sm:text-sm font-black uppercase tracking-[2px] text-blue-600 dark:text-blue-400 font-mono">
            {label}
          </span>
        </div>

        {/* Estimated Remaining Time Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300 shadow-inner">
          <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Tempo restante:{' '}
            <strong className="text-blue-600 dark:text-blue-400">
              {remainingSec > 0 ? `${remainingSec.toFixed(1)}s` : '< 0.1s'}
            </strong>
          </span>
        </div>

        {subtitle && (
          <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400 font-medium tracking-wide mt-1">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
