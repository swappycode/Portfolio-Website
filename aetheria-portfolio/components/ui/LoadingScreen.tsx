import React, { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';

export const LoadingScreen: React.FC = () => {
  const { active, progress } = useProgress();
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (!active && progress >= 100) {
      const fadeTimer = setTimeout(() => setIsFading(true), 200);
      const hideTimer = setTimeout(() => setIsVisible(false), 900);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }

    setIsVisible(true);
    setIsFading(false);
  }, [active, progress]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#1a1520] text-[#e8d5a3] transition-opacity duration-700 ${isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
    >
      <div className="w-[320px] sm:w-[420px] text-center flex flex-col items-center">
        {/* RPG Title */}
        <div className="text-3xl font-bold tracking-wider uppercase text-[#e8d5a3] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mb-8"
          style={{ fontFamily: "'Cinzel', serif", textShadow: '0 0 10px rgba(200,160,80,0.3)' }}
        >
          Loading Swapnil's World
        </div>

        {/* Ornament line */}
        <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-[#8b6914] to-transparent mb-8 opacity-50" />

        {/* Progress Bar Container */}
        <div className="relative w-full h-3 bg-[#0a0810] border border-[#8b6914]/30 rounded-full overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          {/* Progress Fill */}
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#8b6914] via-[#c8a050] to-[#8b6914] transition-[width] duration-300 ease-out"
            style={{ width: `${Math.min(progress, 100)}%`, boxShadow: '0 0 10px rgba(200,160,80,0.4)' }}
          />
          {/* Shine effect */}
          <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)] animate-[shimmer_2s_infinite]" />
        </div>

        {/* Percentage */}
        <div className="mt-4 text-sm font-mono text-[#9e8e7a] tracking-widest">
          {Math.round(progress)}%
        </div>

        {/* Tips */}
        <div className="mt-6 text-xs text-[#6b5e50] italic animate-pulse">
          Summoning assets from the void...
        </div>
      </div>
    </div>
  );
};
